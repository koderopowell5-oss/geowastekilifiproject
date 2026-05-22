/**
 * Email Notification Service
 * Handles sending emails via Google SMTP
 */

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const smtpSecure = (process.env.SMTP_SECURE || 'true') === 'true';

    const smtpUser =
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      '';

    // remove accidental spaces from Gmail app password
    const smtpPass = (
      process.env.SMTP_PASS ||
      process.env.GMAIL_APP_PASSWORD ||
      ''
    ).replace(/\s+/g, '');

    this.isConfigured = !!smtpUser && !!smtpPass;

    if (!this.isConfigured) {
      console.warn(
        '[EMAIL] Email service not configured. Missing SMTP credentials.'
      );
    }

    const transportOptions: any = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,

      auth: {
        user: smtpUser,
        pass: smtpPass,
      },

      // pooled connections improve cloud reliability
      pool: true,
      maxConnections: 3,
      maxMessages: 100,

      // timeouts
      connectionTimeout: parseInt(
        process.env.EMAIL_CONNECTION_TIMEOUT_MS || '30000',
        10
      ),
      greetingTimeout: parseInt(
        process.env.EMAIL_GREETING_TIMEOUT_MS || '30000',
        10
      ),
      socketTimeout: parseInt(
        process.env.EMAIL_SOCKET_TIMEOUT_MS || '30000',
        10
      ),
    };

    // required for STARTTLS on port 587
    if (!smtpSecure && smtpPort === 587) {
      (transportOptions as any).requireTLS = true;
    }

    this.transporter = nodemailer.createTransport(transportOptions);

    console.log('[EMAIL] SMTP transporter created');

    console.log('[EMAIL] SMTP configuration:', {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser ? 'configured' : 'missing',
      pass: smtpPass ? 'configured' : 'missing',
    });

    // verify transporter without crashing the app
    if (this.isConfigured) {
      this.transporter
        .verify()
        .then(() => {
          console.log('[EMAIL] ✓ SMTP server is ready');
        })
        .catch((err: any) => {
          console.error('[EMAIL] SMTP verification failed:', {
            code: err?.code,
            message: err?.message,
          });
        });
    }
  }

  /**
   * Send notification email
   */
  async sendNotification(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn(
        `[EMAIL] Cannot send email to ${to}: SMTP not configured`
      );
      return false;
    }

    const emailStart = Date.now();

    const maxRetries = parseInt(
      process.env.EMAIL_MAX_RETRIES || '2',
      10
    );

    const baseDelay = parseInt(
      process.env.EMAIL_RETRY_BASE_MS || '1000',
      10
    );

    const transientCodes = new Set([
      'ETIMEDOUT',
      'ECONNRESET',
      'EPIPE',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
      'EHOSTUNREACH',
    ]);

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(
          `[EMAIL] Sending to ${to} (attempt ${attempt})`
        );

        const info = await this.transporter.sendMail({
          from:
            process.env.SMTP_FROM ||
            `"GeoKollect" <${process.env.SMTP_USER}>`,

          to,
          subject,
          html,
        });

        const duration = Date.now() - emailStart;

        console.log(
          `[EMAIL] ✓ Sent successfully (${duration}ms)`
        );

        console.log('[EMAIL] Message ID:', info.messageId);

        return true;
      } catch (error: any) {
        const duration = Date.now() - emailStart;

        console.error(
          `[EMAIL] ✗ Attempt ${attempt} failed (${duration}ms):`,
          {
            code: error?.code,
            message: error?.message,
            command: error?.command,
          }
        );

        const isTransient =
          error?.code && transientCodes.has(error.code);

        const shouldRetry =
          attempt <= maxRetries && isTransient;

        if (shouldRetry) {
          const backoff =
            baseDelay * Math.pow(2, attempt - 1);

          const jitter = Math.floor(Math.random() * 500);

          const delay = backoff + jitter;

          console.log(
            `[EMAIL] Retrying in ${delay}ms...`
          );

          await sleep(delay);

          continue;
        }

        console.error(
          `[EMAIL] ✗ Giving up after ${attempt} attempts`
        );

        return false;
      }
    }

    return false;
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

      <p>
        You have been assigned to collect data in
        <strong>${ward}</strong> ward.
      </p>

      <p>
        <strong>Target Records:</strong>
        ${targetRecords}
      </p>

      <p>
        Please log in to the GeoKollect dashboard
        to begin your assignment.
      </p>

      <hr>

      <p>
        <em>
          This is an automated message.
          Please do not reply.
        </em>
      </p>
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
      <p><em>This is an automated alert from GeoKollect.</em></p>
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

      <p>
        We received a request to reset your password.
      </p>

      <p style="margin: 24px 0;">
        <a
          href="${resetLink}"
          style="
            background:#329D9C;
            color:white;
            padding:12px 24px;
            text-decoration:none;
            border-radius:4px;
            display:inline-block;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        <strong>
          This link expires in ${expiryMinutes} minutes.
        </strong>
      </p>

      <p>
        If you did not request this reset,
        you can safely ignore this email.
      </p>

      <hr>

      <p style="font-size:12px;color:#666;">
        <em>
          This is an automated message from GeoKollect.
        </em>
      </p>
    `;

    return this.sendNotification(
      enumeratorEmail,
      'Password Reset Request - GeoKollect',
      html
    );
  }

  /**
   * Static helper
   */
  static async sendPasswordResetEmail(
    enumeratorEmail: string,
    enumeratorName: string,
    resetLink: string,
    expiryMinutes: number
  ): Promise<boolean> {
    const service = new EmailService();

    return service.sendPasswordResetEmail(
      enumeratorEmail,
      enumeratorName,
      resetLink,
      expiryMinutes
    );
  }
}

export const emailService = new EmailService();
