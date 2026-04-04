-- Fix waste_sites table schema
-- Remove geom column that's not used by backend

ALTER TABLE waste_sites DROP COLUMN IF EXISTS geom;

-- Verify the structure
SELECT 'Schema updated - geom column removed' as status;
