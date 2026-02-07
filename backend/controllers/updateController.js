// controllers/updateController.js
import ClientUser from "../models/ClientUser.js";
import ResponseHandler from "../utils/responseHandler.js";

export const updateProfile = async (req, res) => {
  try {
    const { fullname } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return ResponseHandler.unauthorized(res, "User not authenticated");
    }

    if (
      !fullname ||
      typeof fullname !== "string" ||
      fullname.trim().length === 0
    ) {
      return ResponseHandler.validationError(res, "Fullname is required");
    }

    const updatedUser = await ClientUser.findByIdAndUpdate(
      userId,
      { fullname: fullname.trim() },
      { new: true, select: "-password" },
    );

    if (!updatedUser) {
      return ResponseHandler.notFound(res, "User not found");
    }

    return ResponseHandler.successWithMessage(
      res,
      "Profile updated successfully",
      {
        id: updatedUser._id,
        fullname: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || null,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return ResponseHandler.serverError(res, "Failed to update profile", error);
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return ResponseHandler.unauthorized(res, "User not authenticated");
    }

    if (!currentPassword || !newPassword) {
      return ResponseHandler.validationError(
        res,
        "Current password and new password are required",
      );
    }

    if (newPassword.length < 8) {
      return ResponseHandler.validationError(
        res,
        "Password must be at least 8 characters",
      );
    }

    if (newPassword !== confirmNewPassword) {
      return ResponseHandler.validationError(res, "Passwords do not match");
    }

    const user = await ClientUser.findById(userId).select("+password");

    if (!user) {
      return ResponseHandler.notFound(res, "User not found");
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return ResponseHandler.validationError(
        res,
        "Current password is incorrect",
      );
    }

    user.password = newPassword;
    await user.save();

    return ResponseHandler.successWithMessage(
      res,
      "Password updated successfully",
    );
  } catch (error) {
    console.error("Update password error:", error);
    return ResponseHandler.serverError(res, "Failed to update password", error);
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return ResponseHandler.unauthorized(res, "User not authenticated");
    }

    if (!req.file) {
      return ResponseHandler.validationError(res, "Avatar file is required");
    }

    // Pour l’instant, on retourne l’URL du fichier uploadé (simplifié, sans Cloudinary)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await ClientUser.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, select: "-password" },
    );

    if (!updatedUser) {
      return ResponseHandler.notFound(res, "User not found");
    }

    return ResponseHandler.successWithMessage(
      res,
      "Avatar updated successfully",
      {
        id: updatedUser._id,
        fullname: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      },
    );
  } catch (error) {
    console.error("Update avatar error:", error);
    return ResponseHandler.serverError(res, "Failed to update avatar", error);
  }
};
