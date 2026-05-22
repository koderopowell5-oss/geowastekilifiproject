/**
 * Notification Service
 * Handles all notifications: emails, SMS, in-app notifications
 * Stores notification history in database for audit trail
 */

import pool from './db';
import { EmailService } from './emailService';

export interface NotificationPayload {
  email?: string;
  phone?: string;
  type: 'email' | 'sms' | 'in-app' | 'all';
  subject: string;
  message: string;
  htmlContent?: string;
  metadata?: Record<string, any>;
  templateName?: string;
  templateData?: Record<string, any>;
}

export interface NotificationRecord {
  id: number;
  recipient_email?: string;
  recipient_phone?: string;
  notification_type: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sent_at?: string;
  read_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send notification via multiple channels
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      // Validate required fields
      if (!payload.email && !payload.phone) {
        throw new Error('Either email or phone is required');
      }

      let emailSent = false;
      let smsSent = false;

      // Send email notification
      if ((payload.type === 'email' || payload.type === 'all') && payload.email) {
        emailSent = await this.sendEmailNotification(
          payload.email,
          payload.subject,
          payload.htmlContent || payload.message
        );
      }

      // Send SMS notification (placeholder for actual SMS service)
      if ((payload.type === 'sms' || payload.type === 'all') && payload.phone) {
        smsSent = await this.sendSMSNotification(
          payload.phone,
          payload.message
        );
      }

      // Store in-app notification
      if (payload.type === 'in-app' || payload.type === 'all') {
        await this.storeInAppNotification(payload);
      }

      // Log notification in database
      await this.logNotification({
        email: payload.email,
        phone: payload.phone,
        type: payload.type,
        subject: payload.subject,
        message: payload.message,
        emailSent,
        smsSent,
      });

      return emailSent || smsSent;
    } catch (error: any) {
      console.error('Error sending notification:', error.message);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    subject: string,
    htmlContent: string
  ): Promise<boolean> {
    try {
      const sent = await this.emailService.sendNotification(email, subject, htmlContent);
      return sent;
    } catch (error: any) {
      console.error(`Error sending email to ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Send SMS notification (placeholder)
   * Integrate with actual SMS provider (Twilio, AWS SNS, etc.)
   */
  private async sendSMSNotification(phone: string, message: string): Promise<boolean> {
    try {
      // TODO: Integrate with SMS provider like Twilio
      console.log(`[SMS] To ${phone}: ${message}`);
      // For now, just log it
      return true;
    } catch (error: any) {
      console.error(`Error sending SMS to ${phone}:`, error.message);
      return false;
    }
  }

  /**
   * Store in-app notification in database
   */
  private async storeInAppNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (!payload.email) {
        return; // In-app notifications require email identifier
      }

      await pool.query(
        `INSERT INTO notifications (recipient_email, notification_type, subject, message, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [payload.email, payload.templateName || 'general', payload.subject, payload.message, 'pending']
      );
    } catch (error: any) {
      console.error('Error storing in-app notification:', error.message);
    }
  }

  /**
   * Log notification attempt for audit trail
   */
  private async logNotification(data: {
    email?: string;
    phone?: string;
    type: string;
    subject: string;
    message: string;
    emailSent: boolean;
    smsSent: boolean;
  }): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO notification_logs (recipient_email, recipient_phone, notification_type, subject, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          data.email || null,
          data.phone || null,
          data.type,
          data.subject,
          data.message,
          data.emailSent || data.smsSent ? 'sent' : 'failed',
        ]
      );
    } catch (error: any) {
      console.error('Error logging notification:', error.message);
    }
  }

  /**
   * Send account verification notification
   */
  async sendVerificationNotification(
    email: string,
    name: string,
    verificationCode: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6fbf8; border-radius: 12px; padding: 40px;">
        <h1 style="color: #329D9C; text-align: center; margin-bottom: 10px; font-size: 24px;">Welcome to GeoKollect</h1>
        <p style="color: #7a9a8a; text-align: center; margin-bottom: 30px;">Account Verification</p>
        
        <p style="font-size: 16px; color: #1c3a2e; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          Thank you for signing up with GeoKollect. Your account has been successfully created and is ready to use.
        </p>
        
        <div style="background: white; border: 2px solid #e2ede8; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="font-size: 12px; color: #7a9a8a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</p>
          <p style="font-size: 14px; color: #205072; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 14px; color: #205072; margin: 5px 0;"><strong>Verification Code:</strong> <code style="font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${verificationCode}</code></p>
        </div>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          You can now log in to the GeoKollect application using your email and password. Start creating and collecting surveys right away!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2ede8; margin: 30px 0;">
        <p style="font-size: 11px; color: #7a9a8a; text-align: center; margin: 0;">
          If you didn't create this account, please contact our support team immediately.
        </p>
      </div>
    `;

    return this.sendNotification({
      email,
      type: 'email',
      subject: '✓ GeoKollect - Account Verified',
      message: `Your account has been verified, ${name}. Welcome to GeoKollect!`,
      htmlContent: html,
      templateName: 'account_verification',
    });
  }

  /**
   * Send account deletion notification
   */
  async sendDeletionNotification(email: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6fbf8; border-radius: 12px; padding: 40px;">
        <h1 style="color: #dc2626; text-align: center; margin-bottom: 10px; font-size: 24px;">Account Deleted</h1>
        <p style="color: #7a9a8a; text-align: center; margin-bottom: 30px;">Your GeoKollect Account</p>
        
        <p style="font-size: 16px; color: #1c3a2e; margin-bottom: 20px;">Hello ${name},</p>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          This is to confirm that your GeoKollect account associated with <strong>${email}</strong> has been permanently deleted.
        </p>
        
        <div style="background: #fee2e2; border: 2px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="font-size: 14px; color: #dc2626; margin: 0;"><strong>⚠️ Important:</strong> This action is permanent and cannot be undone. All associated data has been removed from our systems.</p>
        </div>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or did not request this deletion, please contact our support team immediately.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2ede8; margin: 30px 0;">
        <p style="font-size: 11px; color: #7a9a8a; text-align: center; margin: 0;">
          Thank you for using GeoKollect.
        </p>
      </div>
    `;

    return this.sendNotification({
      email,
      type: 'email',
      subject: '✓ GeoKollect - Account Deleted',
      message: `Your GeoKollect account has been deleted.`,
      htmlContent: html,
      templateName: 'account_deletion',
    });
  }

  /**
   * Send survey reminder notification
   */
  async sendSurveyReminderNotification(email: string, name: string, surveyTitle: string): Promise<boolean> {
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6fbf8; border-radius: 12px; padding: 40px;">
        <h1 style="color: #329D9C; text-align: center; margin-bottom: 10px; font-size: 24px;">Survey Reminder</h1>
        
        <p style="font-size: 16px; color: #1c3a2e; margin-bottom: 20px;">Hello ${name},</p>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          You have a pending survey waiting for response: <strong>${surveyTitle}</strong>
        </p>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 30px;">
          Please complete this survey at your earliest convenience to help us gather important data.
        </p>
        
        <a href="https://geowaste.example.com/surveys" style="display: inline-block; background: linear-gradient(135deg, #329D9C 0%, #56C596 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 20px;">
          Go to Survey
        </a>
        
        <hr style="border: none; border-top: 1px solid #e2ede8; margin: 30px 0;">
        <p style="font-size: 11px; color: #7a9a8a; text-align: center; margin: 0;">
          GeoKollect • Data Collection System
        </p>
      </div>
    `;

    return this.sendNotification({
      email,
      type: 'email',
      subject: `📋 Survey Reminder: ${surveyTitle}`,
      message: `Survey reminder: ${surveyTitle}`,
      htmlContent: html,
      templateName: 'survey_reminder',
    });
  }

  /**
   * Send submission confirmation notification
   */
  async sendSubmissionConfirmationNotification(email: string, name: string, surveyTitle: string): Promise<boolean> {
    const html = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6fbf8; border-radius: 12px; padding: 40px;">
        <h1 style="color: #329D9C; text-align: center; margin-bottom: 10px; font-size: 24px;">✓ Submission Confirmed</h1>
        
        <p style="font-size: 16px; color: #1c3a2e; margin-bottom: 20px;">Hello ${name},</p>
        
        <p style="font-size: 14px; color: #1c3a2e; line-height: 1.6; margin-bottom: 20px;">
          Thank you! Your survey response for <strong>${surveyTitle}</strong> has been successfully submitted and recorded.
        </p>
        
        <div style="background: white; border: 2px solid #e2ede8; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="font-size: 12px; color: #7a9a8a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Submission Details</p>
          <p style="font-size: 14px; color: #205072; margin: 5px 0;"><strong>Survey:</strong> ${surveyTitle}</p>
          <p style="font-size: 14px; color: #205072; margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <p style="font-size: 14px; color: #205072; margin: 5px 0;"><strong>Status:</strong> <span style="color: #16a34a;">Received</span></p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2ede8; margin: 30px 0;">
        <p style="font-size: 11px; color: #7a9a8a; text-align: center; margin: 0;">
          GeoKollect • Data Collection System
        </p>
      </div>
    `;

    return this.sendNotification({
      email,
      type: 'email',
      subject: `✓ Survey Submission Confirmed: ${surveyTitle}`,
      message: `Your survey submission has been confirmed.`,
      htmlContent: html,
      templateName: 'submission_confirmation',
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(email: string, limit: number = 20): Promise<NotificationRecord[]> {
    try {
      const result = await pool.query(
        `SELECT id, recipient_email, recipient_phone, notification_type, subject, message, status, sent_at, read_at, error_message, created_at, updated_at
         FROM notifications
         WHERE recipient_email = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [email, limit]
      );

      return result.rows as NotificationRecord[];
    } catch (error: any) {
      console.error('Error retrieving notifications:', error.message);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE notifications 
         SET status = 'read', read_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [notificationId]
      );

      return result.rows.length > 0;
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
      throw error;
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearUserNotifications(email: string): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM notifications WHERE recipient_email = $1 RETURNING id`,
        [email]
      );

      return result.rows.length;
    } catch (error: any) {
      console.error('Error clearing notifications:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
