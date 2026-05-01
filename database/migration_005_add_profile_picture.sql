-- Add profile picture URL column to enumerators table
-- Migration: Add profile_picture_url column

ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(500);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enumerators_profile_picture_url ON enumerators (profile_picture_url);
