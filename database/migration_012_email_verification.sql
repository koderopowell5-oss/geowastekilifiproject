-- Migration: Add email verification system
-- Purpose: Support email verification codes for admin registration

-- Add email verification fields to enumerators table
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6);
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS email_verification_code_expires_at TIMESTAMP;
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS verification_attempts INT DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enumerators_email_verified ON enumerators(email_verified);
CREATE INDEX IF NOT EXISTS idx_enumerators_verification_code ON enumerators(email_verification_code);

-- Add constraint: verification attempts should not exceed 3
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'check_verification_attempts'
      AND t.relname = 'enumerators'
  ) THEN
    ALTER TABLE enumerators ADD CONSTRAINT check_verification_attempts CHECK (verification_attempts <= 3);
  END IF;
END
$$;

-- Log when records were created/updated
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add admin-specific verification field
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20); -- 'email' or 'manual'
