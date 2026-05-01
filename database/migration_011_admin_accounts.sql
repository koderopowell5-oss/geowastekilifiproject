-- ============================================================================
-- Migration 011: Admin-Only Account Creation (KoBo Collect Model)
-- Restructures authentication to admin-creates-enumerators workflow
-- ============================================================================

-- Add account_type field to enumerators table
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'enumerator' CHECK (account_type IN ('admin', 'enumerator'));

-- Create index on account_type for filtering
CREATE INDEX IF NOT EXISTS idx_enumerators_account_type ON enumerators(account_type);

-- Create a table to track enumerator credentials distribution
CREATE TABLE IF NOT EXISTS enumerator_credentials (
  id SERIAL PRIMARY KEY,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  created_by_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE SET NULL,
  temporary_password_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enumerator_credentials_enumerator_id ON enumerator_credentials(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_enumerator_credentials_created_by_id ON enumerator_credentials(created_by_id);

-- Comment for documentation
COMMENT ON COLUMN enumerators.account_type IS 'Type of account: admin for project managers, enumerator for data collectors';
COMMENT ON TABLE enumerator_credentials IS 'Tracks when enumerator credentials are created and password changes';
