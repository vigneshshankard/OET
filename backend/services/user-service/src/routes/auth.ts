/**
 * Authentication routes for User Service
 * Based on api-specification.md auth    await req.database.query(insertUserQuery, [
      userId,
      email,
      hashedPassword,
      fullName,
      profession,
    ]);ion endpoints
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  asyncHandler, 
  AppError, 
  ValidationError, 
  AuthenticationError,
  ConflictError 
} from '../middleware/error-handler';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

const router = Router();

// JWT Helper functions
const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: 'oet-praxis',
    audience: 'oet-praxis-app',
  });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry,
      issuer: 'oet-praxis',
      audience: 'oet-praxis-app',
    }
  );
};

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('fullName').isLength({ min: 2, max: 100 }),
  body('profession').isIn(['doctor', 'nurse', 'dentist', 'physiotherapist']),
], asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password, fullName, profession } = req.body;
  
  try {
    // Check if user already exists
    const existingUserQuery = `
      SELECT id FROM users WHERE email = $1
    `;
    const existingUser = await req.database.query(existingUserQuery, [email]);
    
    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    const insertUserQuery = `
      INSERT INTO users (id, email, hashed_password, full_name, profession, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, email, full_name, profession, is_email_verified, created_at
    `;
    
    const result = await req.database.query(insertUserQuery, [
      userId,
      email,
      hashedPassword,
      fullName,
      profession,
    ]);

    const user = result.rows[0];

    // Create default subscription
    const subscriptionId = uuidv4();
    const insertSubscriptionQuery = `
      INSERT INTO subscriptions (id, user_id, plan_name, status, created_at, updated_at)
      VALUES ($1, $2, 'free', 'active', NOW(), NOW())
    `;
    
    await req.database.query(insertSubscriptionQuery, [subscriptionId, userId]);

    // Generate JWT tokens
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: 'user' as const,
      plan: 'free',
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      profession: user.profession,
    });

    const response = {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profession: user.profession,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
      },
    };

    res.status(201).json(response);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const err = error as Error;
    logger.error('User registration failed', {
      email,
      error: err.message,
    });
    
    throw new AppError('Registration failed', 500);
  }
}));

/**
 * POST /auth/login
 * Authenticate user and return JWT tokens
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  try {
    // Find user by email
    const userQuery = `
      SELECT 
        u.id, u.email, u.hashed_password, u.full_name, u.profession, 
        u.is_email_verified, u.created_at,
        s.plan_name, s.status as subscription_status
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
      WHERE u.email = $1
    `;
    
    const result = await req.database.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login timestamp
    await req.database.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT tokens
    const tokenPayload = {
      sub: user.id,
      role: 'user',
      plan: user.plan_name || 'free',
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    const response = {
      accessToken,
      refreshToken,
      expiresIn: '24h',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        profession: user.profession,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
      },
    };

    res.json(response);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const err = error as Error;
    logger.error('User login failed', {
      email,
      error: err.message,
    });
    
    throw new AppError('Authentication failed', 500);
  }
}));

/**
 * POST /auth/forgot-password
 * Initiate password reset process
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userQuery = 'SELECT id, full_name FROM users WHERE email = $1';
    const result = await req.database.query(userQuery, [email]);
    
    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
        resetTokenExpiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      });
    }

    const user = result.rows[0];

    // Generate reset token (in production, use crypto.randomBytes)
    const resetToken = uuidv4();
    const expiryTime = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in Redis (or database)
    await req.cache.setEx(`password_reset:${resetToken}`, 3600, user.id);

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(email, user.full_name, resetToken);

    logger.info('Password reset requested', {
      userId: user.id,
      email,
    });

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      resetTokenExpiry: expiryTime.toISOString(),
    });

  } catch (error) {
    const err = error as Error;
    logger.error('Password reset request failed', {
      email,
      error: err.message,
    });
    
    throw new AppError('Password reset request failed', 500);
  }
}));

/**
 * POST /auth/reset-password
 * Reset password using reset token
 */
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify reset token
    const userId = await req.cache.get(`password_reset:${token}`);
    
    if (!userId) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await req.database.query(
      'UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    // Delete reset token
    await req.cache.del(`password_reset:${token}`);

    logger.info('Password reset completed', { userId });

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const err = error as Error;
    logger.error('Password reset failed', {
      error: err.message,
    });
    
    throw new AppError('Password reset failed', 500);
  }
}));

export default router;