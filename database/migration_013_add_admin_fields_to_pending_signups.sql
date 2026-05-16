-- Migration: Add fields to pending_signups for admin registration
-- Adds projectName and account_type to support admin account creation after OTP verification

ALTER TABLE pending_signups
ADD COLUMN IF NOT EXISTS project_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'enumerator';

-- Create index on account_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_pending_signups_account_type ON pending_signups (account_type);
