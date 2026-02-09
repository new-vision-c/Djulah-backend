// controllers/authController.js
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../config/emailConfig.js";
import { generateToken } from "../middlewares/authMiddleware.js";
import ClientUser from "../models/ClientUser.js";
import User from "../models/User.js";
import ResponseHandler from "../utils/responseHandler.js";

const normalizeFullName = (fullName) => {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: undefined, lastName: undefined };
  }

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: undefined, lastName: undefined };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "-" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const normalizeIdentifier = (value) => {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export const register = async (req, res) => {
  try {
    const email = normalizeIdentifier(req.body.email);
    const password = req.body.password;

    // Extract name from various possible field names
    const name =
      req.body.name ||
      req.body.fullName ||
      req.body.fullname ||
      req.body.username;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.register.name_required"),
      );
    }

    const phoneNumber =
      normalizeIdentifier(req.body.phoneNumber) ||
      normalizeIdentifier(req.body.phone) ||
      null;

    if (!email || !password || !name) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.register.missing_fields"),
      );
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return ResponseHandler.conflict(
          res,
          req.t("auth.register.already_registered_login"),
        );
      } else {
        // Supprimer l'utilisateur non vérifié pour permettre une nouvelle inscription (aligné Prisma)
        await User.deleteOne({ email });
      }
    }

    // Create client user
    const { firstName, lastName } = normalizeFullName(name);
    const user = new ClientUser({
      firstName: firstName || name,
      lastName: lastName || "-",
      name: name.trim(),
      email: email,
      password: password,
      isVerified: false,
      verificationCode: undefined,
      verificationCodeExpires: undefined,
      failedVerificationAttempts: 0,
      accountStatus: "active",
    });
    user.generateVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Générer un sessionToken JWT temporaire (24h) pour la vérification OTP (aligné Prisma)
    const sessionToken = generateToken(user._id, {
      step: "registration",
      type: "session",
      expiresIn: "24h",
    });

    // Send verification email (optionnel en dev)
    try {
      const emailResult = await sendVerificationEmail(
        email,
        user.verificationCode,
        name,
        req.locale,
      );
      if (!emailResult.success) {
        console.warn("Email non envoyé (mode dev?):", emailResult.error);
      }
    } catch (emailError) {
      console.warn("Email sending failed (mode dev?):", emailError);
      // Ne pas bloquer le flow
    }

    // Réponse alignée sur Prisma : inclure sessionToken et requiresOtp
    return ResponseHandler.created(
      res,
      req.t("auth.register.success_check_email"),
      {
        step: 1,
        user: {
          id: user._id,
          fullname: name.trim(),
          email,
        },
        token: sessionToken,
        requiresOtp: true,
        otpCode:
          process.env.NODE_ENV !== "production"
            ? user.verificationCode
            : undefined,
      },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return ResponseHandler.serverError(
      res,
      req.t("auth.register.failed"),
      error,
    );
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const code =
      normalizeIdentifier(req.body.code) || normalizeIdentifier(req.body.otp);

    // Récupérer le sessionToken depuis le header Authorization: Bearer <token>
    let sessionToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      sessionToken = authHeader.split(" ")[1];
    }

    if (!sessionToken) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.verify.token_required"),
      );
    }

    // Vérifier et décoder le sessionToken JWT (aligné Prisma)
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, config.jwt.secret);
      if (decoded.type !== "session" || decoded.step !== "registration") {
        return ResponseHandler.validationError(
          res,
          req.t("auth.verify.invalid_session"),
        );
      }
    } catch (tokenError) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.verify.session_expired"),
      );
    }

    // Récupérer l'email depuis le payload du token
    const email = decoded.email;

    // Validate input
    if (!code) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.verify.code_required"),
      );
    }

    // Find user with valid verification code
    const user = await ClientUser.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      // Increment failed attempts
      const failedUser = await ClientUser.findOne({ email });
      if (failedUser && !failedUser.isVerified) {
        failedUser.incrementFailedAttempts();
      }
      return ResponseHandler.validationError(
        res,
        req.t("auth.verify.invalid_or_expired"),
      );
    }

    // Verify user
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.failedVerificationAttempts = 0;
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    // Réponse alignée sur Prisma
    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.verify.success"),
      {
        verified: true,
        tokens: {
          accessToken: token,
          // TODO: ajouter refreshToken si nécessaire
        },
        user: {
          id: user._id,
          fullname: user.name,
          email: user.email,
          avatar: user.avatar || null,
          createdAt: user.createdAt,
        },
      },
    );
  } catch (error) {
    console.error("Verification error:", error);
    return ResponseHandler.serverError(res, req.t("auth.verify.failed"), error);
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    // Récupérer le sessionToken depuis le header Authorization: Bearer <token>
    let sessionToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      sessionToken = authHeader.split(" ")[1];
    }

    if (!sessionToken) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.resend.token_required"),
      );
    }

    // Vérifier et décoder le sessionToken JWT (aligné Prisma)
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, config.jwt.secret);
      if (decoded.type !== "session" || decoded.step !== "registration") {
        return ResponseHandler.validationError(
          res,
          req.t("auth.resend.invalid_session"),
        );
      }
    } catch (tokenError) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.resend.session_expired"),
      );
    }

    // Récupérer l'utilisateur depuis le payload du token
    const user = await ClientUser.findById(decoded.id);

    if (!user) {
      return ResponseHandler.notFound(res, req.t("auth.resend.user_not_found"));
    }

    if (user.isVerified) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.resend.already_verified"),
      );
    }

    // Rate limiting - 15 minutes entre les envois si 3 tentatives ou plus (aligné Prisma)
    if (user.failedVerificationAttempts >= 3) {
      const timeSinceLastOtp =
        Date.now() - (user.otpSentAt || user.createdAt).getTime();
      const waitTime = 15 * 60 * 1000; // 15 minutes

      if (timeSinceLastOtp < waitTime) {
        const remainingTime = Math.ceil((waitTime - timeSinceLastOtp) / 60000);
        return ResponseHandler.tooManyRequests(
          res,
          req.t("auth.resend.too_many_requests") + ` (${remainingTime} min)`,
        );
      }
    }

    // Generate new code
    const code = user.generateVerificationCode();
    await user.save({ validateBeforeSave: false });

    // Send email (optionnel en dev)
    try {
      await sendVerificationEmail(user.email, code, user.name);
    } catch (emailError) {
      console.warn("Email non envoyé (mode dev?):", emailError);
      // Ne pas bloquer le flow
    }

    // Réponse alignée sur Prisma
    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.resend.success"),
      {
        email: user.email,
        otpCode: process.env.NODE_ENV !== "production" ? code : undefined,
      },
    );
  } catch (error) {
    console.error("Resend verification code error:", error);
    return ResponseHandler.serverError(res, req.t("auth.resend.failed"), error);
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeIdentifier(req.body.email);
    const password = req.body.password;

    // Validate input
    if (!email || !password) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.login.missing_fields"),
      );
    }

    // Find user with password
    const user = await ClientUser.findOne({ email }).select("+password");

    // Validate credentials
    if (!user || !(await user.comparePassword(password))) {
      return ResponseHandler.unauthorized(
        res,
        req.t("auth.login.invalid_credentials"),
      );
    }

    // Check if email is verified
    if (!user.isVerified) {
      return ResponseHandler.forbidden(
        res,
        req.t("auth.login.email_not_verified"),
      );
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.login.success"),
      {
        token,
        refreshToken: token, // TODO: implémenter vrai refreshToken si nécessaire
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || null,
          createdAt: user.createdAt,
        },
      },
    );
  } catch (error) {
    console.error("Login error:", error);
    return ResponseHandler.serverError(res, req.t("auth.login.failed"), error);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeIdentifier(req.body.email);

    if (!email) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.forgot.email_required"),
      );
    }

    const user = await ClientUser.findOne({ email });

    if (!user) {
      return ResponseHandler.notFound(
        res,
        req.t("auth.forgot.account_not_found"),
      );
    }

    if (!user.isVerified) {
      return ResponseHandler.forbidden(
        res,
        req.t("auth.forgot.email_not_verified"),
      );
    }

    // Rate limiting via otpAttempts (aligné Prisma)
    if (user.failedVerificationAttempts >= 3) {
      const timeSinceLastOtp =
        Date.now() - (user.otpSentAt || user.createdAt).getTime();
      const waitTime = 15 * 60 * 1000; // 15 minutes

      if (timeSinceLastOtp < waitTime) {
        const remainingTime = Math.ceil((waitTime - timeSinceLastOtp) / 60000);
        return ResponseHandler.tooManyRequests(
          res,
          req.t("auth.forgot.too_many_requests") + ` (${remainingTime} min)`,
        );
      }
    }

    // Générer un sessionToken JWT pour la réinitialisation (24h) (aligné Prisma)
    const sessionToken = generateToken(user._id, {
      step: "password_reset",
      type: "session",
      expiresIn: "24h",
    });

    // Générer un OTP de reset
    const code = user.generatePasswordResetCode();
    await user.save({ validateBeforeSave: false });

    // Send email (optionnel en dev)
    try {
      await sendPasswordResetEmail(user.email, code, user.name, req.locale);
    } catch (emailError) {
      console.warn("Email non envoyé (mode dev?):", emailError);
      // Ne pas bloquer le flow
    }

    // Réponse alignée sur Prisma (le front n’attend que message)
    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.forgot.success"),
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return ResponseHandler.serverError(res, req.t("auth.forgot.failed"), error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const code =
      normalizeIdentifier(req.body.code) || normalizeIdentifier(req.body.otp);
    const password = req.body.password || req.body.newPassword;
    const confirmPassword =
      req.body.confirmPassword || req.body.confirmNewPassword;

    // Récupérer le sessionToken depuis le header Authorization: Bearer <token>
    let sessionToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      sessionToken = authHeader.split(" ")[1];
    }

    if (!sessionToken) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.token_required"),
      );
    }

    // Vérifier et décoder le sessionToken JWT (aligné Prisma)
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, config.jwt.secret);
      if (decoded.type !== "session" || decoded.step !== "password_reset") {
        return ResponseHandler.validationError(
          res,
          req.t("auth.reset.invalid_session"),
        );
      }
    } catch (tokenError) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.session_expired"),
      );
    }

    // Récupérer l'email depuis le payload du token
    const email = decoded.email;

    // Validate input
    if (!code || !password) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.missing_fields"),
      );
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.passwords_not_match"),
      );
    }

    // Validate password length (8 characters minimum)
    if (password.length < 8) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.password_too_short"),
      );
    }

    // Find user with valid reset code
    const user = await ClientUser.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.reset.invalid_or_expired"),
      );
    }

    // Reset password
    user.password = password;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.reset.success"),
      { token },
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return ResponseHandler.serverError(res, req.t("auth.reset.failed"), error);
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await ClientUser.findById(req.user._id).select("-password");

    if (!user) {
      return ResponseHandler.notFound(
        res,
        req.t("auth.profile.user_not_found"),
      );
    }

    // Return user data without password
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
    };

    return ResponseHandler.success(res, userResponse);
  } catch (error) {
    console.error("Get profile error:", error);
    return ResponseHandler.serverError(
      res,
      req.t("auth.profile.failed"),
      error,
    );
  }
};

// Change password (for authenticated users including super admin)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.change_password.missing_fields"),
      );
    }

    // Validate new password length (8 characters minimum)
    if (newPassword.length < 8) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.change_password.too_short"),
      );
    }

    // Validate new password matches confirmation
    if (newPassword !== confirmNewPassword) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.change_password.not_match"),
      );
    }

    // Get user with password field
    const user = await ClientUser.findById(req.user._id).select("+password");

    if (!user) {
      return ResponseHandler.notFound(
        res,
        req.t("auth.profile.user_not_found"),
      );
    }

    // Verify current password is correct
    const isCurrentPasswordCorrect =
      await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return ResponseHandler.unauthorized(
        res,
        req.t("auth.change_password.current_incorrect"),
      );
    }

    // Validate new password is different from current password
    const isSameAsOldPassword = await user.comparePassword(newPassword);
    if (isSameAsOldPassword) {
      return ResponseHandler.validationError(
        res,
        req.t("auth.change_password.same_as_old"),
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return ResponseHandler.successWithMessage(
      res,
      req.t("auth.change_password.success"),
    );
  } catch (error) {
    console.error("Change password error:", error);
    return ResponseHandler.serverError(
      res,
      req.t("auth.change_password.failed"),
      error,
    );
  }
};
