-- GeoWaste Kilifi Database Schema
-- PostgreSQL with PostGIS extension

-- Create PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create waste_sites table
CREATE TABLE IF NOT EXISTS waste_sites (
  id SERIAL PRIMARY KEY,
  
  -- Location & Household
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geom GEOMETRY(POINT, 4326) NOT NULL, -- PostGIS geometry
  ward VARCHAR(50) NOT NULL,
  settlement_type VARCHAR(50) NOT NULL,
  household_size VARCHAR(10) NOT NULL,
  
  -- Waste Generation
  waste_types TEXT[] NOT NULL DEFAULT '{}',
  waste_quantity VARCHAR(20) NOT NULL,
  waste_separation BOOLEAN NOT NULL,
  
  -- Disposal Practices
  disposal_method VARCHAR(50) NOT NULL,
  distance_to_site VARCHAR(20) NOT NULL,
  collection_frequency VARCHAR(20) NOT NULL,
  
  -- Accessibility
  road_access VARCHAR(20) NOT NULL,
  distance_to_road VARCHAR(20) NOT NULL,
  
  -- Environmental Risk
  waste_near_home BOOLEAN NOT NULL,
  distance_to_waste VARCHAR(20) NOT NULL,
  impacts TEXT[] NOT NULL DEFAULT '{}',
  nearby_features TEXT[] NOT NULL DEFAULT '{}',
  
  -- Suitability Perception
  recommended_distance VARCHAR(20) NOT NULL,
  preferred_location TEXT[] NOT NULL DEFAULT '{}',
  distance_weight SMALLINT CHECK (distance_weight >= 1 AND distance_weight <= 5),
  water_weight SMALLINT CHECK (water_weight >= 1 AND water_weight <= 5),
  road_weight SMALLINT CHECK (road_weight >= 1 AND road_weight <= 5),
  slope_weight SMALLINT CHECK (slope_weight >= 1 AND slope_weight <= 5),
  landuse_weight SMALLINT CHECK (landuse_weight >= 1 AND landuse_weight <= 5),
  
  -- Topography
  terrain VARCHAR(30) NOT NULL,
  flooding VARCHAR(30) NOT NULL,
  
  -- Community & Policy
  policy_awareness BOOLEAN NOT NULL,
  support_new_site VARCHAR(20) NOT NULL,
  preferred_management VARCHAR(30) NOT NULL,
  
  -- Open Ended
  challenges TEXT,
  suggested_location TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for better query performance
CREATE INDEX IF NOT EXISTS idx_waste_sites_geom ON waste_sites USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_waste_sites_created_at ON waste_sites (created_at);
CREATE INDEX IF NOT EXISTS idx_waste_sites_ward ON waste_sites (ward);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waste_sites_updated_at BEFORE UPDATE ON waste_sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for summary statistics
CREATE OR REPLACE VIEW waste_sites_summary AS
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT ward) as total_wards,
  AVG(ST_Distance(geom, ST_GeomFromText('POINT(0 0)', 4326))) as avg_location,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM waste_sites;
