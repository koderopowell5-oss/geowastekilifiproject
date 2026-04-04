-- GeoWaste Kilifi Database Schema (No PostGIS)
-- PostgreSQL database solution for waste site mapping

-- Create waste_sites table (without PostGIS geometry)
CREATE TABLE IF NOT EXISTS waste_sites (
  id SERIAL PRIMARY KEY,
  
  -- Location & Household
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  ward VARCHAR(50) NOT NULL,
  settlement_type VARCHAR(50) NOT NULL,
  household_size VARCHAR(10) NOT NULL,
  
  -- Waste Generation
  waste_types TEXT NOT NULL DEFAULT '',
  waste_quantity VARCHAR(20) NOT NULL,
  waste_separation BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Disposal Practices
  disposal_method VARCHAR(50) NOT NULL,
  distance_to_site VARCHAR(20) NOT NULL,
  collection_frequency VARCHAR(20) NOT NULL,
  
  -- Accessibility
  road_access VARCHAR(20) NOT NULL,
  distance_to_road VARCHAR(20) NOT NULL,
  
  -- Environmental Risk
  waste_near_home BOOLEAN NOT NULL DEFAULT FALSE,
  distance_to_waste VARCHAR(20) NOT NULL,
  impacts TEXT NOT NULL DEFAULT '',
  nearby_features TEXT NOT NULL DEFAULT '',
  
  -- Suitability Perception
  recommended_distance VARCHAR(20) NOT NULL,
  preferred_location TEXT NOT NULL DEFAULT '',
  distance_weight SMALLINT CHECK (distance_weight >= 1 AND distance_weight <= 5),
  water_weight SMALLINT CHECK (water_weight >= 1 AND water_weight <= 5),
  road_weight SMALLINT CHECK (road_weight >= 1 AND road_weight <= 5),
  slope_weight SMALLINT CHECK (slope_weight >= 1 AND slope_weight <= 5),
  landuse_weight SMALLINT CHECK (landuse_weight >= 1 AND landuse_weight <= 5),
  
  -- Topography
  terrain VARCHAR(30) NOT NULL,
  flooding VARCHAR(30) NOT NULL,
  
  -- Community & Policy
  policy_awareness BOOLEAN NOT NULL DEFAULT FALSE,
  support_new_site VARCHAR(20) NOT NULL,
  preferred_management VARCHAR(30) NOT NULL,
  
  -- Open Ended
  challenges TEXT,
  suggested_location TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waste_sites_created_at ON waste_sites (created_at);
CREATE INDEX IF NOT EXISTS idx_waste_sites_ward ON waste_sites (ward);
CREATE INDEX IF NOT EXISTS idx_waste_sites_lat_lon ON waste_sites (latitude, longitude);

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

-- Create summary statistics view
CREATE OR REPLACE VIEW waste_statistics AS
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT ward) as wards_surveyed,
    AVG(household_size::INTEGER) as avg_household_size,
    COUNT(CASE WHEN waste_separation = TRUE THEN 1 END) as separation_adopters,
    COUNT(CASE WHEN policy_awareness = TRUE THEN 1 END) as aware_of_policy
FROM waste_sites;

-- Sample data for testing
INSERT INTO waste_sites (
    latitude, longitude, ward, settlement_type, household_size,
    waste_types, waste_quantity, waste_separation, disposal_method,
    distance_to_site, collection_frequency, road_access, distance_to_road,
    waste_near_home, distance_to_waste, impacts, nearby_features,
    recommended_distance, preferred_location, terrain, flooding,
    policy_awareness, support_new_site, preferred_management
) VALUES (
    -3.750000, 39.650000, 'Central Ward', 'Urban', '5-8',
    'Organic, Plastic, Metal', 'Large', TRUE, 'Waste pit',
    '0.5km', 'Weekly', 'Yes', '100m',
    FALSE, '500m', 'Odor, Flies', 'School, Water source',
    '2km', 'Away from homes', 'Flat', 'Low risk',
    TRUE, 'Yes', 'Managed site'
) ON CONFLICT DO NOTHING;
