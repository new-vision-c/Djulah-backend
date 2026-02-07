// routes/authRoutes.js
import express from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  getProfile,
  login,
  register,
  resendVerificationCode,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rate limiting for all auth routes (internationalized via middleware)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: (req) => ({
    success: false,
    message: req.t
      ? req.t("auth.rate_limit")
      : "Too many requests. Try again later.",
  }),
});

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication, registration & password management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registration successful – check email for verification code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Inscription réussie. Vérifiez vos emails.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     step: { type: number, example: 1 }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, example: '...' }
 *                         fullname: { type: string, example: 'Alice N.' }
 *                         email: { type: string, example: 'client@djulah.cm' }
 *                     token: { type: string, example: 'eyJ...' }
 *                     requiresOtp: { type: boolean, example: true }
 *                     otpCode: { type: string, example: '123456', description: 'OTP code (dev only)' }
 *       400:
 *         description: Validation error (missing or invalid fields)
 *       409:
 *         description: User already exists (either verified or pending verification)
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with 6-digit code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit verification code received by email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified – returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Email verified successfully.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified: { type: boolean, example: true }
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: string, example: 'eyJ...' }
 *                     user:
 *                       $ref: '#/components/schemas/ClientUser'
 *       400:
 *         description: Invalid or expired code / session token
 *       401:
 *         description: Missing or invalid session token
 */
router.post("/verify-email", authLimiter, verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification code (max once per 15 minutes after 3 attempts)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New code sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Code de vérification renvoyé.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     otpSent: { type: boolean, example: true }
 *                     email: { type: string, example: 'client@djulah.cm' }
 *                     otpCode: { type: string, example: '123456', description: 'OTP code (dev only)' }
 *       400:
 *         description: Invalid session token or already verified
 *       401:
 *         description: Missing or invalid session token
 *       429:
 *         description: Too many requests
 */
router.post("/resend-verification", authLimiter, resendVerificationCode);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful – returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Connexion réussie.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: 'eyJ...' }
 *                     user:
 *                       $ref: '#/components/schemas/ClientUser'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Email not verified
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset code (generates sessionToken + OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: "testuser@example.com"
 *     responses:
 *       200:
 *         description: SessionToken created and OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Un code OTP a été envoyé à votre adresse email' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionToken: { type: string, example: '550e8400-e29b-41d4-a716-446655440000', description: 'Session token for next step (24h)' }
 *                     requiresOtp: { type: boolean, example: true }
 *                     otpCode: { type: string, example: '123456', description: 'OTP code (dev only)' }
 *                     email: { type: string, example: 'testuser@example.com' }
 *       400:
 *         description: Invalid email
 *       403:
 *         description: Account not verified
 *       404:
 *         description: Email not found
 *       429:
 *         description: Too many requests
 */
router.post("/forgot-password", authLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using 6-digit code and sessionToken
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - newPassword
 *             properties:
 *               code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit reset code received by email
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (min 8 characters)
 *                 example: "NewPassword123!"
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Password reset successful – returns new login token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Mot de passe réinitialisé.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: 'eyJ...', description: 'Login JWT token (7 days)' }
 *       400:
 *         description: Invalid/expired code or session token / passwords don't match
 *       401:
 *         description: Missing or invalid session token
 */
router.post("/reset-password", authLimiter, resetPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/ClientUser'
 *       401:
 *         description: Unauthorized - no token provided
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (requires authentication)
 *     description: Allows authenticated users (including super admin) to change their password. New password must be different from current password.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Mot de passe changé avec succès."
 *       400:
 *         description: Validation error (passwords don't match, too short, or same as old password)
 *       401:
 *         description: Current password is incorrect or unauthorized
 */
router.put("/change-password", protect, changePassword);

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Update user profile (fullname only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *             properties:
 *               fullname:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: New full name
 *                 example: "Jean Dupont"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Profile updated successfully' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: '...' }
 *                     fullname: { type: string, example: 'Jean Dupont' }
 *                     email: { type: string, example: 'jean.dupont@example.com' }
 *                     avatar: { type: string, example: null }
 *                     createdAt: { type: string, example: '2024-01-01T00:00:00.000Z' }
 *                     updatedAt: { type: string, example: '2024-01-01T12:00:00.000Z' }
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put("/update-profile", protect, updateProfile);

/**
 * @swagger
 * /api/auth/update-avatar:
 *   put:
 *     summary: Update user avatar (file upload)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG/PNG/WebP, max 10MB)
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Avatar updated successfully' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, example: '...' }
 *                     fullname: { type: string, example: 'Jean Dupont' }
 *                     email: { type: string, example: 'jean.dupont@example.com' }
 *                     avatar: { type: string, example: '/uploads/avatars/avatar.jpg' }
 *       400:
 *         description: Validation error (no file uploaded)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put("/update-avatar", protect, updateAvatar);

// ==================== FLUTTER CLIENT ALIASES ====================
// These routes provide aliases for Flutter app endpoint naming conventions
router.post("/register/step1", authLimiter, register); // Flutter: register/step1
router.post("/verify-otp", authLimiter, verifyEmail); // Flutter: verify-otp
router.post("/resend-otp", authLimiter, resendVerificationCode); // Flutter: resend-otp
router.get("/me", protect, getProfile); // Flutter: me
router.put("/update-password", protect, changePassword); // Flutter: update-password

export default router;
