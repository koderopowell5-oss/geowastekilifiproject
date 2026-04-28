-- Migration: Add geom column if missing
-- This ensures PostGIS geometry column exists for spatial queries

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geom column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_sites' AND column_name = 'geom'
    ) THEN
        -- Add the geom column
        ALTER TABLE waste_sites ADD COLUMN geom GEOMETRY(POINT, 4326);
        
        -- Populate geom from existing latitude/longitude
        UPDATE waste_sites SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) 
        WHERE geom IS NULL;
        
        -- Make column NOT NULL
        ALTER TABLE waste_sites ALTER COLUMN geom SET NOT NULL;
        
        -- Create spatial index
        CREATE INDEX idx_waste_sites_geom ON waste_sites USING GIST (geom);
        
        RAISE NOTICE 'geom column added successfully';
    ELSE
        RAISE NOTICE 'geom column already exists';
    END IF;
END $$;

-- Add quality_score column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'waste_sites' AND column_name = 'quality_score'
    ) THEN
        ALTER TABLE waste_sites ADD COLUMN quality_score INTEGER DEFAULT 0;
        ALTER TABLE waste_sites ADD COLUMN quality_issues TEXT[] DEFAULT '{}';
        ALTER TABLE waste_sites ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;
        ALTER TABLE waste_sites ADD COLUMN flag_reason VARCHAR(255);
        
        RAISE NOTICE 'Quality score columns added successfully';
    ELSE
        RAISE NOTICE 'Quality score columns already exist';
    END IF;
END $$;
