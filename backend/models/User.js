// models/User.js
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
    },
    verificationCodeResentAt: {
      type: Date,
      select: false,
    },
    failedVerificationAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetCode: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Account status
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "inactive"],
      default: "inactive",
    },
  },
  {
    timestamps: true,
    discriminatorKey: "userType",
  },
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate 6-digit verification code
userSchema.methods.generateVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  this.verificationCodeResentAt = Date.now();
  // Mettre à jour otpSentAt pour compatibilité avec ClientUser/Prisma
  if (this.otpSentAt !== undefined) {
    this.otpSentAt = Date.now();
  }
  return code;
};

// Generate password reset code
userSchema.methods.generatePasswordResetCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.passwordResetCode = code;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return code;
};

userSchema.methods.incrementFailedAttempts = function () {
  this.failedVerificationAttempts += 1;
};

// Indexes for new fields
userSchema.index({ accountStatus: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
