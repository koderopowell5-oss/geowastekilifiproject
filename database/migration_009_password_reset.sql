-- Migration: Add password reset tokens table
-- Purpose: Store temporary tokens for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  CONSTRAINT reset_token_not_used CHECK (used_at IS NULL OR used_at <= expires_at)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_enumerator_id ON password_reset_tokens(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create an index for finding unused password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_valid 
  ON password_reset_tokens(token) 
  WHERE used_at IS NULL;
