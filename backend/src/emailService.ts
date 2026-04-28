/**
 * Email Notification Service
 * Handles sending emails via Google SMTP
 */

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Google SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || '',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }
  }

  /**
   * Send notification email to enumerator
   */
  async sendNotification(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.GMAIL_USER || 'noreply@geowaste.com',
        to,
        subject,
        html,
      });

      console.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to send email to ${to}:`, error.message);
      return false;
    }
  }

  /**
   * Send assignment notification
   */
  async sendAssignmentEmail(
    enumeratorEmail: string,
    enumeratorName: string,
    ward: string,
    targetRecords: number
  ): Promise<boolean> {
    const html = `
      <h2>New Task Assignment</h2>
      <p>Hello ${enumeratorName},</p>
      <p>You have been assigned to collect data in <strong>${ward}</strong> ward.</p>
      <p><strong>Target Records:</strong> ${targetRecords}</p>
      <p>Please log in to the GeoWaste Kilifi dashboard to view more details and start collecting data.</p>
      <hr>
      <p><em>This is an automated message. Please do not reply to this email.</em></p>
    `;

    return this.sendNotification(
      enumeratorEmail,
      `New Assignment: ${ward} Ward`,
      html
    );
  }

  /**
   * Send record flag notification
   */
  async sendRecordFlagEmail(
    enumeratorEmail: string,
    recordId: number,
    flagReason: string
  ): Promise<boolean> {
    const html = `
      <h2>Record Flagged for Review</h2>
      <p>Your submitted record (ID: ${recordId}) has been flagged for review.</p>
      <p><strong>Reason:</strong> ${flagReason}</p>
      <p>Please log in to the dashboard to view the feedback and make corrections if needed.</p>
      <hr>
      <p><em>This is an automated message. Please do not reply to this email.</em></p>
    `;

    return this.sendNotification(
      enumeratorEmail,
      `Record Flagged: #${recordId}`,
      html
    );
  }

  /**
   * Send comment notification
   */
  async sendCommentEmail(
    recipientEmail: string,
    authorName: string,
    recordId: number,
    comment: string
  ): Promise<boolean> {
    const html = `
      <h2>New Comment on Your Record</h2>
      <p>${authorName} has left a comment on record #${recordId}:</p>
      <blockquote style="border-left: 4px solid #329D9C; padding-left: 16px; margin: 16px 0;">
        ${comment.replace(/\n/g, '<br>')}
      </blockquote>
      <p>Log in to view the full discussion and respond.</p>
      <hr>
      <p><em>This is an automated message. Please do not reply to this email.</em></p>
    `;

    return this.sendNotification(
      recipientEmail,
      `New Comment on Record #${recordId}`,
      html
    );
  }

  /**
   * Send approval notification
   */
  async sendApprovalEmail(
    enumeratorEmail: string,
    recordId: number,
    approvedCount: number
  ): Promise<boolean> {
    const html = `
      <h2>Records Approved</h2>
      <p>Great news! ${approvedCount} of your submitted records have been approved.</p>
      <p>Record #${recordId} is one of them.</p>
      <p>You're doing excellent work! Keep up the momentum.</p>
      <hr>
      <p><em>This is an automated message. Please do not reply to this email.</em></p>
    `;

    return this.sendNotification(
      enumeratorEmail,
      `Records Approved ✓`,
      html
    );
  }

  /**
   * Send admin alert
   */
  async sendAdminAlert(
    adminEmail: string,
    subject: string,
    message: string
  ): Promise<boolean> {
    const html = `
      <h2>${subject}</h2>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><em>This is an automated alert from GeoWaste Kilifi.</em></p>
    `;

    return this.sendNotification(
      adminEmail,
      `[ALERT] ${subject}`,
      html
    );
  }
}

export const emailService = new EmailService();
