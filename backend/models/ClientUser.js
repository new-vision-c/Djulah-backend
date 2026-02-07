import mongoose from "mongoose";
import User from "./User.js";

const clientUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  failedVerificationAttempts: { type: Number, default: 0 },
  lastVerificationAttempt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  accountStatus: {
    type: String,
    enum: ["active", "suspended", "deleted"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Champs manquants alignés sur Prisma
  avatar: { type: String },
  appleId: { type: String, unique: true, sparse: true },
  otpSentAt: { type: Date, default: Date.now }, // équivalent de otpSentAt
  otpVerified: { type: Boolean, default: false }, // équivalent de isVerified mais pour OTP
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  latitude: { type: Number },
  longitude: { type: Number },
  lastLocationUpdate: { type: Date },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
});

const ClientUser = User.discriminator("client", clientUserSchema);

export default ClientUser;
