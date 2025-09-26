/**
 * User management routes
 * Based on api-specification.md user endpoints
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { 
  asyncHandler, 
  NotFoundError,
  ValidationError 
} from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /users/:id
 * Get user profile by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const userQuery = `
    SELECT 
      u.id, u.email, u.full_name, u.profession, u.is_email_verified, u.created_at,
      s.plan_name, s.status as subscription_status
    FROM users u
    LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
    WHERE u.id = $1
  `;
  
  const result = await req.database.query(userQuery, [id]);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  // Get user stats
  const statsQuery = `
    SELECT 
      COUNT(*) as sessions_completed,
      AVG(fr.score_raw) as average_score
    FROM sessions s
    LEFT JOIN feedback_reports fr ON s.id = fr.session_id
    WHERE s.user_id = $1 AND s.status = 'completed'
  `;
  
  const statsResult = await req.database.query(statsQuery, [id]);
  const stats = statsResult.rows[0];

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    profession: user.profession,
    subscription: {
      plan: user.plan_name || 'free',
      status: user.subscription_status || 'active',
    },
    stats: {
      sessionsCompleted: parseInt(stats.sessions_completed) || 0,
      averageScore: parseFloat(stats.average_score) || 0,
    },
  });
}));

/**
 * PATCH /users/:id
 * Update user profile
 */
router.patch('/:id', [
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('profession').optional().isIn(['doctor', 'nurse', 'dentist', 'physiotherapist']),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  const { id } = req.params;
  const { fullName, profession } = req.body;

  const updateFields = [];
  const values = [];
  let paramCount = 1;

  if (fullName) {
    updateFields.push(`full_name = $${paramCount++}`);
    values.push(fullName);
  }

  if (profession) {
    updateFields.push(`profession = $${paramCount++}`);
    values.push(profession);
  }

  if (updateFields.length === 0) {
    throw new ValidationError('No valid fields to update');
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(id);

  const updateQuery = `
    UPDATE users 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, full_name, profession
  `;

  const result = await req.database.query(updateQuery, values);
  
  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  logger.info('User profile updated', {
    userId: user.id,
    updatedFields: Object.keys(req.body),
  });

  res.json({
    updated: true,
    user: {
      id: user.id,
      fullName: user.full_name,
      profession: user.profession,
    },
  });
}));

/**
 * DELETE /users/:id
 * Delete user account
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user exists
  const userExists = await req.database.query(
    'SELECT id FROM users WHERE id = $1',
    [id]
  );

  if (userExists.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  // Delete user (cascade will handle related records)
  await req.database.query('DELETE FROM users WHERE id = $1', [id]);

  logger.info('User account deleted', { userId: id });

  res.json({
    deleted: true,
    message: 'User account has been permanently deleted',
  });
}));

export default router;