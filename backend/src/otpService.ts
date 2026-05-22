/**
 * OTP Service
 * Handles OTP generation, sending, and verification for signup
 */

import pool from './db';
import { EmailService } from './emailService';
import crypto from 'crypto';

export interface PendingSignup {
  email: string;
  password: string;
  name: string;
  ward: string;
  phone: string;
  project_name?: string;
  account_type?: string;
}

export class OTPService {
  private emailService: EmailService;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store pending signup data temporarily
   */
  async savePendingSignup(signupData: PendingSignup): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      await pool.query(
        `INSERT INTO pending_signups (email, password, name, ward, phone, project_name, account_type, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET 
         password = EXCLUDED.password,
         name = EXCLUDED.name,
         ward = EXCLUDED.ward,
         phone = EXCLUDED.phone,
         project_name = EXCLUDED.project_name,
         account_type = EXCLUDED.account_type,
         expires_at = EXCLUDED.expires_at`,
        [
          signupData.email,
          signupData.password,
          signupData.name,
          signupData.ward,
          signupData.phone,
          signupData.project_name || null,
          signupData.account_type || 'enumerator',
          expiresAt,
        ]
      );
    } catch (error: any) {
      console.error('Error saving pending signup:', error.message);
      throw new Error('Failed to save signup data');
    }
  }

  /**
   * Generate and send OTP to email
   */
  async generateAndSendOTP(email: string): Promise<void> {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
      // Store OTP in database
      await pool.query(
        `INSERT INTO otp_verifications (email, otp_code, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET 
         otp_code = EXCLUDED.otp_code,
         expires_at = EXCLUDED.expires_at,
         attempts = 0,
         verified = FALSE`,
        [email, otp, expiresAt]
      );

      // Send OTP via email
      const html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #205072; margin-bottom: 20px;">Email Verification</h2>
          <p style="font-size: 16px; color: #1c3a2e; margin-bottom: 20px;">
            Your OTP for GeoKollect registration is:
          </p>
          
          <div style="background: #f6fbf8; border: 2px dashed #329D9C; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="font-size: 14px; color: #7a9a8a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your Code</p>
            <p style="font-size: 32px; font-weight: 700; color: #329D9C; margin: 0; letter-spacing: 4px; font-family: 'DM Mono', monospace;">
              ${otp}
            </p>
          </div>
          
          <p style="font-size: 14px; color: #7a9a8a; margin: 20px 0;">
            This OTP will expire in <strong>${this.OTP_EXPIRY_MINUTES} minutes</strong>. Do not share this code with anyone.
          </p>
          
          <p style="font-size: 13px; color: #7a9a8a; margin-top: 30px;">
            If you didn't request this code, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2ede8; margin: 30px 0;">
          <p style="font-size: 11px; color: #7a9a8a; text-align: center; margin: 0;">
            GeoKollect • Data Collection System
          </p>
        </div>
      `;

      const emailSent = await this.emailService.sendNotification(
        email,
        'GeoKollect - Email Verification Code',
        html
      );

      if (!emailSent) {
        throw new Error('Failed to send OTP email');
      }

      console.log(`OTP sent to ${email}`);
    } catch (error: any) {
      console.error('Error generating and sending OTP:', error.message);
      throw new Error('Failed to generate and send OTP');
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, otpCode: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT otp_code, expires_at, attempts, verified FROM otp_verifications 
         WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('No OTP found for this email');
      }

      const { otp_code, expires_at, attempts, verified } = result.rows[0];

      // Check if already verified
      if (verified) {
        throw new Error('This email has already been verified');
      }

      // Check if OTP expired
      if (new Date() > new Date(expires_at)) {
        throw new Error('OTP has expired');
      }

      // Check if max attempts exceeded
      if (attempts >= this.MAX_ATTEMPTS) {
        throw new Error('Maximum attempts exceeded. Please request a new OTP');
      }

      // Verify OTP code
      if (otp_code !== otpCode) {
        // Increment attempts
        await pool.query(
          'UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1',
          [email]
        );
        throw new Error('Invalid OTP code');
      }

      // Mark as verified
      await pool.query(
        `UPDATE otp_verifications SET verified = TRUE, verified_at = NOW() 
         WHERE email = $1`,
        [email]
      );

      return true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error.message);
      throw error;
    }
  }

  /**
   * Get verified signup data
   */
  async getVerifiedSignupData(email: string): Promise<PendingSignup | null> {
    try {
      const otpResult = await pool.query(
        'SELECT verified FROM otp_verifications WHERE email = $1',
        [email]
      );

      if (otpResult.rows.length === 0 || !otpResult.rows[0].verified) {
        throw new Error('Email not verified');
      }

      const signupResult = await pool.query(
        'SELECT email, password, name, ward, phone FROM pending_signups WHERE email = $1',
        [email]
      );

      if (signupResult.rows.length === 0) {
        throw new Error('Signup data not found');
      }

      return signupResult.rows[0] as PendingSignup;
    } catch (error: any) {
      console.error('Error getting verified signup data:', error.message);
      throw error;
    }
  }

  /**
   * Cleanup expired OTPs and pending signups
   */
  async cleanupExpiredData(): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM otp_verifications WHERE expires_at < NOW()'
      );
      await pool.query(
        'DELETE FROM pending_signups WHERE expires_at < NOW()'
      );
      console.log('Cleaned up expired OTP and signup data');
    } catch (error: any) {
      console.error('Error cleaning up expired data:', error.message);
    }
  }

  /**
   * Resend OTP (generates new one)
   */
  async resendOTP(email: string): Promise<void> {
    try {
      // Check if too many resend attempts
      const result = await pool.query(
        `SELECT attempts FROM otp_verifications 
         WHERE email = $1 AND verified = FALSE`,
        [email]
      );

      if (result.rows.length > 0 && result.rows[0].attempts >= this.MAX_ATTEMPTS) {
        throw new Error('Too many failed attempts. Please try again later');
      }

      // Generate and send new OTP
      await this.generateAndSendOTP(email);
    } catch (error: any) {
      console.error('Error resending OTP:', error.message);
      throw error;
    }
  }
}

export const otpService = new OTPService();
