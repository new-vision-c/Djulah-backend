// routes/authRoutes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  verifyEmail,
  resendVerificationCode,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  changePassword
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rate limiting for all auth routes (internationalized via middleware)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: (req) => ({
    success: false,
    message: req.t ? req.t('auth.rate_limit') : 'Too many requests. Try again later.'
  })
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
 *                     email: { type: string, example: 'client@djulah.cm' }
 *                     name: { type: string, example: 'Alice N.' }
 *       400:
 *         description: Validation error (missing or invalid fields)
 *       409:
 *         description: User already exists (either verified or pending verification)
 */
router.post('/register', authLimiter, register);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with 6-digit code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailInput'
 *     responses:
 *       200:
 *         description: Email verified – returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Email vérifié avec succès.' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, example: 'eyJ...' }
 *                     user:
 *                       $ref: '#/components/schemas/ClientUser'
 *       400:
 *         description: Invalid or expired code
 */
router.post('/verify-email', authLimiter, verifyEmail);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification code (max once per minute)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
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
 *       429:
 *         description: Too many resend requests
 */
router.post('/resend-verification', authLimiter, resendVerificationCode);

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
router.post('/login', authLimiter, login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Reset code sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Code de réinitialisation envoyé.' }
 *       404:
 *         description: No verified account found
 */
router.post('/forgot-password', authLimiter, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using 6-digit code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Password reset successful – returns new JWT token
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
 *                     token: { type: string, example: 'eyJ...' }
 *       400:
 *         description: Invalid or expired code
 */
router.post('/reset-password', authLimiter, resetPassword);

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
router.get('/profile', protect, getProfile);

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
router.put('/change-password', protect, changePassword);

// ==================== FLUTTER CLIENT ALIASES ====================
// These routes provide aliases for Flutter app endpoint naming conventions
router.post('/register/step1', authLimiter, register);      // Flutter: register/step1
router.post('/verify-otp', authLimiter, verifyEmail);       // Flutter: verify-otp
router.post('/resend-otp', authLimiter, resendVerificationCode); // Flutter: resend-otp
router.get('/me', protect, getProfile);                     // Flutter: me
router.put('/update-password', protect, changePassword);    // Flutter: update-password

export default router;