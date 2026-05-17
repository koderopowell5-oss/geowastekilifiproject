/**
 * Email Notification Service
 * Handles sending emails via Google SMTP
 */

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private verifyPromise: Promise<void>;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || '';
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';

    const buildTransportOptions = (useHost: boolean, hostPort?: number, secure?: boolean) => {
      const port = hostPort ?? smtpPort;
      const isSecure = secure ?? smtpSecure;
      if (useHost) {
        return {
          host: smtpHost,
          port,
          secure: isSecure,
          requireTLS: !isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS || '20000', 10),
          greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS || '20000', 10),
          socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS || '20000', 10),
        } as any;
      }
      return {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: parseInt(process.env.EMAIL_CONNECTION_TIMEOUT_MS || '20000', 10),
        greetingTimeout: parseInt(process.env.EMAIL_GREETING_TIMEOUT_MS || '20000', 10),
        socketTimeout: parseInt(process.env.EMAIL_SOCKET_TIMEOUT_MS || '20000', 10),
      } as any;
    };

    const useExplicitHost = Boolean(smtpHost);
    this.transporter = nodemailer.createTransport(buildTransportOptions(useExplicitHost));

    const verifyTransport = async (transport: nodemailer.Transporter, configLabel: string) => {
      try {
        await transport.verify();
        console.log(`[EMAIL] SMTP transporter verified and ready (${configLabel})`);
      } catch (err: any) {
        console.warn(`[EMAIL] SMTP transporter verification failed (${configLabel}):`, err && err.message ? err.message : err);
        throw err;
      }
    };

    const logConfig = {
      smtpHost: smtpHost || 'gmail service',
      smtpPort,
      smtpSecure,
    };

    this.verifyPromise = verifyTransport(this.transporter, smtpHost ? `host:${smtpHost}` : 'gmail service')
      .catch(async (error: any) => {
        if (smtpHost === 'smtp.gmail.com') {
          console.warn('[EMAIL] Explicit Gmail SMTP host failed. Falling back to Gmail service transport.');
          this.transporter = nodemailer.createTransport(buildTransportOptions(false));
          await verifyTransport(this.transporter, 'gmail service fallback').catch((fallbackErr: any) => {
            console.warn('[EMAIL] Fallback Gmail service verification failed:', fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr);
            throw fallbackErr;
          });
        } else {
          throw error;
        }
      });

    console.log('[EMAIL] Using SMTP configuration:', logConfig);

    if (!smtpUser || !smtpPass) {
      console.warn('Email service not configured. Set SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD in .env');
    }
  }

  /**
   * Send notification email to enumerator
   */
  async sendNotification(to: string, subject: string, html: string): Promise<boolean> {
    const emailStart = Date.now();

    const maxRetries = parseInt(process.env.EMAIL_MAX_RETRIES || '2', 10);
    const baseDelay = parseInt(process.env.EMAIL_RETRY_BASE_MS || '1000', 10);

    const transientCodes = new Set([
      'ETIMEDOUT',
      'ECONNRESET',
      'EPIPE',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
      'EHOSTUNREACH',
    ]);

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    let lastError: any = null;

    // Ensure transporter verification and fallback logic completes before sending
    if (this.verifyPromise) {
      await this.verifyPromise;
    }

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`[EMAIL] Sending to ${to} (attempt ${attempt}): "${subject}"`);

        const info = await this.transporter.sendMail({
          from: process.env.GMAIL_USER || 'noreply@geowaste.com',
          to,
          subject,
          html,
        });

        const duration = Date.now() - emailStart;
        console.log(`[EMAIL] ✓ Sent to ${to} (${duration}ms) | MessageID: ${info.messageId}`);
        return true;
      } catch (error: any) {
        lastError = error;
        const duration = Date.now() - emailStart;
        const code = error?.code;
        console.error(`[EMAIL] ✗ Attempt ${attempt} failed to send to ${to} (${duration}ms):`, {
          code,
          message: error?.message,
          command: error?.command,
        });

        const isTransient = !!code && transientCodes.has(code);
        const willRetry = attempt <= maxRetries && isTransient;

        if (willRetry) {
          // exponential backoff with jitter
          const backoff = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.floor(Math.random() * 300);
          const delay = backoff + jitter;
          console.log(`[EMAIL] Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(delay);
          continue;
        }

        // No more retries or non-transient error — throw to let caller handle
        throw error;
      }
    }

    // If we exit loop unexpectedly, throw last error
    throw lastError || new Error('Unknown email send failure');
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

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    enumeratorEmail: string,
    enumeratorName: string,
    resetLink: string,
    expiryMinutes: number
  ): Promise<boolean> {
    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello ${enumeratorName},</p>
      <p>We received a request to reset your password. Click the link below to proceed:</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #329D9C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p><strong>This link will expire in ${expiryMinutes} minutes.</strong></p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        <em>This is an automated message from GeoWaste Kilifi. Please do not reply to this email.</em>
      </p>
    `;

    return this.sendNotification(
      enumeratorEmail,
      'Password Reset Request - GeoWaste Kilifi',
      html
    );
  }

  /**
   * Static method for password reset service
   */
  static async sendPasswordResetEmail(
    enumeratorEmail: string,
    enumeratorName: string,
    resetLink: string,
    expiryMinutes: number
  ): Promise<boolean> {
    const service = new EmailService();
    return service.sendPasswordResetEmail(enumeratorEmail, enumeratorName, resetLink, expiryMinutes);
  }
}

export const emailService = new EmailService();
