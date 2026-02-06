import User from './User.js';
import mongoose from 'mongoose';

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
  accountStatus: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ClientUser = User.discriminator('client', clientUserSchema);

export default ClientUser;
