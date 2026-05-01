#!/usr/bin/env node

/**
 * Test Notification Generator
 * Quickly generate dummy notifications for testing the notification system
 * 
 * Usage:
 *   node scripts/generate-test-notifications.js 10
 *   node scripts/generate-test-notifications.js 5 custom@example.com
 *   node scripts/generate-test-notifications.js
 */

const pool = require('../backend/src/db');

// Configuration
const DEFAULT_COUNT = 5;
const DEFAULT_EMAIL = 'test@example.com';

// Notification types and samples
const notificationTemplates = [
  {
    type: 'account_verification',
    subject: '✓ GeoWaste Kilifi - Account Verified',
    message: 'Your account has been verified successfully. You can now log in and start using GeoWaste Kilifi.',
  },
  {
    type: 'survey_reminder',
    subject: '⏰ Survey Reminder: Waste Management Assessment',
    message: 'You have a pending survey: Waste Management Assessment. Please complete it before the deadline.',
  },
  {
    type: 'survey_reminder',
    subject: '⏰ Survey Reminder: Environmental Assessment',
    message: 'Reminder: Environmental Assessment survey is waiting for your response.',
  },
  {
    type: 'submission_confirmation',
    subject: '✓ Survey Submitted Successfully',
    message: 'Your waste management survey has been received and logged. Thank you for your contribution!',
  },
  {
    type: 'submission_confirmation',
    subject: '✓ Environmental Assessment Submitted',
    message: 'Your environmental assessment data has been successfully recorded.',
  },
  {
    type: 'security_alert',
    subject: '🔒 Security Alert: New Login',
    message: 'Your GeoWaste account was accessed from a new device. If this was not you, please change your password.',
  },
  {
    type: 'system_notification',
    subject: '📢 App Update Available',
    message: 'A new version of GeoWaste Kilifi is available. Update now to get new features!',
  },
  {
    type: 'general',
    subject: '📨 General Notification',
    message: 'You have a new notification from GeoWaste Kilifi.',
  },
];

// Parse command line arguments
const args = process.argv.slice(2);
const count = parseInt(args[0]) || DEFAULT_COUNT;
const email = args[1] || DEFAULT_EMAIL;

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║      Test Notification Generator                   ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log(`📝 Generating ${count} test notifications...`);
console.log(`📧 Target email: ${email}\n`);

/**
 * Generate random notification
 */
function generateRandomNotification() {
  const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
  const status = Math.random() > 0.4 ? 'read' : 'unread';
  const hoursAgo = Math.floor(Math.random() * 72) + 1; // 1-72 hours ago
  
  return {
    ...template,
    status,
    hoursAgo,
  };
}

/**
 * Insert notification into database
 */
async function insertNotification(email, notification) {
  const { type, subject, message, status, hoursAgo } = notification;
  
  const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const sentAt = status === 'failed' ? null : createdAt;
  const readAt = status === 'read' ? new Date() : null;
  
  const query = `
    INSERT INTO notifications (
      recipient_email,
      notification_type,
      subject,
      message,
      status,
      sent_at,
      read_at,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at;
  `;
  
  const values = [
    email,
    type,
    subject,
    message,
    status,
    sentAt,
    readAt,
    createdAt,
    createdAt,
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Failed to insert notification:', error.message);
    throw error;
  }
}

/**
 * Get statistics
 */
async function getStatistics(email) {
  const query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read,
      SUM(CASE WHEN status != 'read' THEN 1 ELSE 0 END) as unread,
      COUNT(DISTINCT notification_type) as types
    FROM notifications
    WHERE recipient_email = $1;
  `;
  
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

/**
 * Get notifications by type
 */
async function getNotificationsByType(email) {
  const query = `
    SELECT notification_type, status, COUNT(*) as count
    FROM notifications
    WHERE recipient_email = $1
    GROUP BY notification_type, status
    ORDER BY notification_type;
  `;
  
  const result = await pool.query(query, [email]);
  return result.rows;
}

/**
 * Main function
 */
async function main() {
  try {
    // Verify user exists
    const userQuery = 'SELECT id FROM enumerators WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.error(`❌ Error: User with email "${email}" does not exist`);
      console.log('\n💡 Create a test user first:');
      console.log(`   INSERT INTO enumerators (email, name, password_hash, ward, phone, role)`);
      console.log(`   VALUES ('${email}', 'Test User', '...', 'Jomvu', '+254712345678', 'enumerator');`);
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${email}\n`);
    console.log(`📊 Generating notifications...\n`);
    
    // Generate notifications
    let successCount = 0;
    for (let i = 0; i < count; i++) {
      const notification = generateRandomNotification();
      const result = await insertNotification(email, notification);
      
      if (result) {
        successCount++;
        const icon = notification.status === 'read' ? '📖' : '📬';
        const type = notification.type.padEnd(25);
        const subject = notification.subject.substring(0, 50);
        console.log(`${icon} ${type} | ${subject}`);
      }
    }
    
    console.log('\n✓ Insertion complete!\n');
    
    // Show statistics
    const stats = await getStatistics(email);
    console.log('📈 Notification Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Read: ${stats.read}`);
    console.log(`   Unread: ${stats.unread}`);
    console.log(`   Types: ${stats.types}\n`);
    
    // Show by type
    console.log('📋 Notifications by Type:');
    const byType = await getNotificationsByType(email);
    byType.forEach(row => {
      console.log(`   ${row.notification_type.padEnd(25)} | ${row.status.padEnd(8)} | ${row.count}`);
    });
    
    console.log('\n✅ Test notifications generated successfully!\n');
    console.log(`🎯 Next steps:`);
    console.log(`   1. Login with ${email}`);
    console.log(`   2. Click the bell icon in the header`);
    console.log(`   3. Test notification interactions\n`);
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
