#!/usr/bin/env node
/**
 * Email Service Diagnostic Test
 * Tests Gmail SMTP connectivity and email sending
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

console.log('═══════════════════════════════════════════════════════');
console.log('📧 Email Service Diagnostic Test');
console.log('═══════════════════════════════════════════════════════');

// Check credentials
console.log('\n1️⃣  Checking credentials...');
if (!GMAIL_USER) {
  console.error('❌ GMAIL_USER not set in .env');
  process.exit(1);
}
if (!GMAIL_APP_PASSWORD) {
  console.error('❌ GMAIL_APP_PASSWORD not set in .env');
  process.exit(1);
}
console.log(`✓ GMAIL_USER: ${GMAIL_USER}`);
console.log(`✓ GMAIL_APP_PASSWORD: [set - length: ${GMAIL_APP_PASSWORD.length}]`);

// Test transporter
console.log('\n2️⃣  Creating nodemailer transporter...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
console.log('✓ Transporter created');

// Test connection
console.log('\n3️⃣  Testing SMTP connection...');
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
    console.error('Details:', {
      code: error.code,
      command: error.command,
      response: error.response,
    });
    process.exit(1);
  } else {
    console.log('✓ SMTP connection verified successfully');
    console.log('✓ Server is ready to send emails');

    // Send test email
    console.log('\n4️⃣  Sending test email...');
    const testEmailStart = Date.now();
    
    transporter.sendMail(
      {
        from: GMAIL_USER,
        to: GMAIL_USER, // Send to self for testing
        subject: '🧪 GeoWaste Email Service Test',
        html: `
          <div style="font-family: Arial; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #329D9C;">Email Service Test</h2>
            <p>This is a test email from the GeoKollect Admin Portal email service.</p>
            <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
            <p>If you received this, the SMTP service is working correctly! ✓</p>
          </div>
        `,
      },
      function (error, info) {
        const duration = Date.now() - testEmailStart;
        if (error) {
          console.error(`❌ Email sending failed (${duration}ms):`, error.message);
          console.error('Details:', {
            code: error.code,
            response: error.response,
          });
          process.exit(1);
        } else {
          console.log(`✓ Test email sent successfully (${duration}ms)`);
          console.log(`✓ Message ID: ${info.messageId}`);
          console.log('\n═══════════════════════════════════════════════════════');
          console.log('✅ All tests passed! Email service is working correctly.');
          console.log('═══════════════════════════════════════════════════════');
          process.exit(0);
        }
      }
    );
  }
});
