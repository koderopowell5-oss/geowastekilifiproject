-- Migration: Add notification system tables
-- Purpose: Store notifications and notification logs for audit trail

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'read')),
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (recipient_email) REFERENCES enumerators(email) ON DELETE CASCADE
);

-- Ensure notifications table has expected columns when it already existed
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Create index on recipient_email and created_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Create notification logs table for audit trail
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Ensure notification_logs table has expected columns when it already existed
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS recipient_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NOT NULL,
  ADD COLUMN IF NOT EXISTS message TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_email ON notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- Add account_verification_completed column to enumerators if it doesn't exist
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS account_verification_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Create index for verified accounts
CREATE INDEX IF NOT EXISTS idx_enumerators_account_verification_completed ON enumerators(account_verification_completed);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_logs TO postgres;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO postgres;
GRANT USAGE, SELECT ON SEQUENCE notification_logs_id_seq TO postgres;

-- Add comment
COMMENT ON TABLE notifications IS 'Stores in-app notifications for users';
COMMENT ON TABLE notification_logs IS 'Audit log of all notification attempts (email, SMS, etc.)';
