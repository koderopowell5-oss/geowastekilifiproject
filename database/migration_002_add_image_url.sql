-- Migration: Add image_url column to waste_sites table
-- Description: Add support for storing Cloudinary image URLs with survey records

ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waste_sites_image_url ON waste_sites (image_url);

-- Add enumerator_email column if not exists
ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS enumerator_email VARCHAR(100);

-- Create index for enumerator_email
CREATE INDEX IF NOT EXISTS idx_waste_sites_enumerator_email ON waste_sites (enumerator_email);
