-- Seed file: Test notification data for development/testing
-- This file populates the notifications table with dummy data
-- Run after migration_008_notification_system.sql

-- Clear existing test data (optional - comment out to keep data)
-- DELETE FROM notifications WHERE recipient_email IN ('test@example.com', 'enumerator@example.com');

-- ─── Account Verification Notifications ──────────────────────────────────────

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
) VALUES (
  'test@example.com',
  'account_verification',
  '✓ GeoWaste Kilifi - Account Verified',
  'Your account has been verified successfully. You can now log in and start using GeoWaste Kilifi to collect waste data in your area.',
  'read',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);

-- ─── Survey Reminder Notifications ──────────────────────────────────────────

INSERT INTO notifications (
  recipient_email,
  notification_type,
  subject,
  message,
  status,
  sent_at,
  created_at,
  updated_at
) VALUES (
  'test@example.com',
  'survey_reminder',
  '⏰ Survey Reminder: Waste Management Assessment',
  'You have a pending survey: Waste Management Assessment. Please complete it before the deadline. Your contribution helps improve waste management in Kilifi.',
  'unread',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
),
(
  'test@example.com',
  'survey_reminder',
  '⏰ Survey Reminder: Environmental Assessment',
  'Reminder: Environmental Assessment survey is waiting for your response. This survey helps us understand environmental impacts in your ward.',
  'unread',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- ─── Submission Confirmation Notifications ──────────────────────────────────

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
) VALUES (
  'test@example.com',
  'submission_confirmation',
  '✓ Survey Submitted Successfully',
  'Your waste management survey has been received and logged. Reference ID: WMS-2026-04-15-001. Thank you for your contribution!',
  'read',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  'test@example.com',
  'submission_confirmation',
  '✓ Environmental Assessment Submitted',
  'Your environmental assessment data has been successfully recorded. Reference ID: EA-2026-04-20-042. We appreciate your detailed observations!',
  'read',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '3 hours'
);

-- ─── Security Alert Notifications ────────────────────────────────────────────

INSERT INTO notifications (
  recipient_email,
  notification_type,
  subject,
  message,
  status,
  sent_at,
  created_at,
  updated_at
) VALUES (
  'test@example.com',
  'security_alert',
  '🔒 Security Alert: New Login',
  'Your GeoWaste account was accessed from a new device. If this was not you, please change your password immediately.',
  'unread',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes'
);

-- ─── System Notifications ───────────────────────────────────────────────────

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
) VALUES (
  'test@example.com',
  'system_notification',
  '📢 App Update Available',
  'A new version of GeoWaste Kilifi is available. Update now to get new features and improvements!',
  'read',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
);

-- ─── Failed Notification (for testing error states) ──────────────────────────

INSERT INTO notifications (
  recipient_email,
  notification_type,
  subject,
  message,
  status,
  created_at,
  updated_at
) VALUES (
  'test@example.com',
  'general',
  '⚠️ Failed to Process Your Request',
  'There was an issue processing your last survey submission. Please try again or contact support.',
  'failed',
  NOW() - INTERVAL '5 hours',
  NOW() - INTERVAL '5 hours'
);

-- ─── Test User Notifications ────────────────────────────────────────────────
-- Add notifications for another test user (if needed)

INSERT INTO notifications (
  recipient_email,
  notification_type,
  subject,
  message,
  status,
  sent_at,
  created_at,
  updated_at
) VALUES (
  'enumerator@example.com',
  'account_verification',
  '✓ GeoWaste Kilifi - Account Verified',
  'Your account has been verified successfully. You can now log in and start using GeoWaste Kilifi.',
  'read',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
);

-- ─── Summary ────────────────────────────────────────────────────────────────
-- This seed file adds:
-- ✓ 2 Account verification notifications (showing different statuses)
-- ✓ 3 Survey reminder notifications (all unread, showing urgency)
-- ✓ 2 Submission confirmation notifications (showing progress)
-- ✓ 1 Security alert notification (showing new type)
-- ✓ 1 System notification (showing app updates)
-- ✓ 1 Failed notification (for error state testing)
-- ✓ 1 Notification for secondary test user
--
-- Total: 11 notifications for comprehensive UI testing
--
-- To use this data:
-- 1. Make sure you have at least one user with email 'test@example.com' in enumerators table
-- 2. Run: psql -U postgres -d geowaste_db -f database/seed-notifications.sql
-- 3. Access the app as that user and click the bell icon
--
-- To clear test data later, run:
-- DELETE FROM notifications WHERE recipient_email IN ('test@example.com', 'enumerator@example.com');
