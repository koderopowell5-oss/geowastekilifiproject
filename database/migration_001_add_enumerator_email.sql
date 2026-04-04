-- Migration: Add enumerator_email to waste_sites table
-- This allows tracking which enumerator created each waste site record

-- Add enumerator_email column to waste_sites
ALTER TABLE waste_sites
ADD COLUMN IF NOT EXISTS enumerator_email VARCHAR(100);

-- Add index on enumerator_email for faster queries
CREATE INDEX IF NOT EXISTS idx_waste_sites_enumerator_email ON waste_sites (enumerator_email);

-- Add foreign key constraint to enumerators table
ALTER TABLE waste_sites
ADD CONSTRAINT fk_waste_sites_enumerator
FOREIGN KEY (enumerator_email) 
REFERENCES enumerators(email)
ON DELETE CASCADE;
