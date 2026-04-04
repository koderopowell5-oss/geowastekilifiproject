-- GeoWaste Kilifi - Render Database Setup
-- Creates all necessary tables for production deployment

-- ================== ENUMERATORS TABLE ==================
CREATE TABLE IF NOT EXISTS enumerators (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  ward VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'enumerator',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enumerators_email ON enumerators (email);
CREATE INDEX IF NOT EXISTS idx_enumerators_ward ON enumerators (ward);

-- ================== WASTE SITES TABLE ==================
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
  
  -- Enumerator metadata
  enumerator_email VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waste_sites_created_at ON waste_sites (created_at);
CREATE INDEX IF NOT EXISTS idx_waste_sites_ward ON waste_sites (ward);
CREATE INDEX IF NOT EXISTS idx_waste_sites_lat_lon ON waste_sites (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_waste_sites_enumerator_email ON waste_sites (enumerator_email);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_enumerators_updated_at ON enumerators;
CREATE TRIGGER update_enumerators_updated_at BEFORE UPDATE ON enumerators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_waste_sites_updated_at ON waste_sites;
CREATE TRIGGER update_waste_sites_updated_at BEFORE UPDATE ON waste_sites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================== VIEWS ==================
CREATE OR REPLACE VIEW waste_statistics AS
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT ward) as wards_surveyed,
    COUNT(DISTINCT settlement_type) as distinct_settlement_types
FROM waste_sites;

-- ================== TEST DATA (OPTIONAL) ==================
-- Insert a test user for development
INSERT INTO enumerators (email, password, name, ward, phone)
VALUES (
    'test@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36iMlL69', -- bcrypt hash of 'password'
    'Test User',
    'Central Ward',
    '+254712345678'
) ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as message;
