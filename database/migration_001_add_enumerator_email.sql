-- Migration: Add enumerator_email to waste_sites table
-- This allows tracking which enumerator created each waste site record

-- Add enumerator_email column to waste_sites
ALTER TABLE waste_sites
ADD COLUMN IF NOT EXISTS enumerator_email VARCHAR(100);

-- Add index on enumerator_email for faster queries
CREATE INDEX IF NOT EXISTS idx_waste_sites_enumerator_email ON waste_sites (enumerator_email);

-- Add foreign key constraint to enumerators table if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_waste_sites_enumerator'
      AND t.relname = 'waste_sites'
  ) THEN
    ALTER TABLE waste_sites
      ADD CONSTRAINT fk_waste_sites_enumerator
      FOREIGN KEY (enumerator_email)
      REFERENCES enumerators(email)
      ON DELETE CASCADE;
  END IF;
END
$$;
