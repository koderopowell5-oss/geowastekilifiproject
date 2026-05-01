import pool from './db';
import crypto from 'crypto';
import { EmailService } from './emailService';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetVerification {
  token: string;
  newPassword: string;
}

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_MINUTES = 30; // Token valid for 30 minutes
  private static readonly TOKEN_LENGTH = 32;

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }

  /**
   * Request password reset for an enumerator
   * Generates token and sends email
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find enumerator by email
      const result = await pool.query(
        'SELECT id, email, name FROM enumerators WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        // Don't reveal if email exists - for security
        return {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.',
        };
      }

      const enumerator = result.rows[0];

      // Generate reset token
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Store token in database
      await pool.query(
        `INSERT INTO password_reset_tokens (enumerator_id, token, email, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [enumerator.id, token, email.toLowerCase(), expiresAt]
      );

      // Send password reset email
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      await EmailService.sendPasswordResetEmail(
        enumerator.email,
        enumerator.name,
        resetLink,
        this.TOKEN_EXPIRY_MINUTES
      );

      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      throw new Error('Failed to process password reset request');
    }
  }

  /**
   * Verify reset token is valid
   */
  static async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      const result = await pool.query(
        `SELECT email, expires_at, used_at FROM password_reset_tokens
         WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return { valid: false };
      }

      const resetToken = result.rows[0];

      // Check if token has already been used
      if (resetToken.used_at) {
        return { valid: false };
      }

      // Check if token has expired
      if (new Date(resetToken.expires_at) < new Date()) {
        return { valid: false };
      }

      return {
        valid: true,
        email: resetToken.email,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify token is valid
      const verification = await this.verifyResetToken(token);
      if (!verification.valid) {
        throw new Error('Invalid or expired reset token');
      }

      // Get the enumerator from the token record
      const tokenResult = await pool.query(
        `SELECT enumerator_id FROM password_reset_tokens WHERE token = $1`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        throw new Error('Token not found');
      }

      const enumeratorId = tokenResult.rows[0].enumerator_id;

      // Hash the new password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        `UPDATE enumerators SET password = $1, updated_at = NOW()
         WHERE id = $2`,
        [hashedPassword, enumeratorId]
      );

      // Mark token as used
      await pool.query(
        `UPDATE password_reset_tokens SET used_at = NOW()
         WHERE token = $1`,
        [token]
      );

      return {
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  /**
   * Clean up expired tokens (can be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < CURRENT_TIMESTAMP OR (used_at IS NOT NULL AND used_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')
         RETURNING id`
      );

      console.log(`Cleaned up ${result.rows.length} expired password reset tokens`);
      return result.rows.length;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

export default PasswordResetService;
