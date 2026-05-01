-- Create OTP verification table for signup
-- Migration: Add OTP table for signup verification

CREATE TABLE IF NOT EXISTS otp_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  otp_code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON otp_verifications (email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at ON otp_verifications (expires_at);

-- Create a table to store temporary signup data before email verification
CREATE TABLE IF NOT EXISTS pending_signups (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  ward VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_signups_email ON pending_signups (email);
CREATE INDEX IF NOT EXISTS idx_pending_signups_expires_at ON pending_signups (expires_at);
