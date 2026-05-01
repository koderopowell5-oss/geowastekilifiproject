-- Create custom surveys table for storing questionnaire templates
-- Migration: Add custom surveys support

CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Survey metadata
  created_by VARCHAR(100) NOT NULL,
  organization VARCHAR(255),
  is_public BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Survey structure (stored as JSON)
  form_config JSONB NOT NULL,
  
  -- Statistics
  total_submissions INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys (created_by);
CREATE INDEX IF NOT EXISTS idx_surveys_is_public ON surveys (is_public);
CREATE INDEX IF NOT EXISTS idx_surveys_is_default ON surveys (is_default);
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys (active);

-- Create survey_submissions table to store survey responses
CREATE TABLE IF NOT EXISTS survey_submissions (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  
  -- Location data (if applicable)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geom GEOMETRY(POINT, 4326),
  
  -- Enumerator info
  enumerator_email VARCHAR(100),
  enumerator_name VARCHAR(100),
  
  -- Response data (stored as JSONB for flexibility)
  response_data JSONB NOT NULL,
  
  -- Status tracking
  is_draft BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'submitted', -- submitted, draft, flagged, approved
  flag_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_submissions_survey_id ON survey_submissions (survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_enumerator_email ON survey_submissions (enumerator_email);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_status ON survey_submissions (status);
CREATE INDEX IF NOT EXISTS idx_survey_submissions_created_at ON survey_submissions (created_at);

-- Create spatial index for submission locations
CREATE INDEX IF NOT EXISTS idx_survey_submissions_geom ON survey_submissions USING GIST (geom);

-- Create survey_templates table for pre-built templates
CREATE TABLE IF NOT EXISTS survey_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50), -- 'waste_management', 'environmental', 'custom', etc.
  form_config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_templates_category ON survey_templates (category);

-- Create survey_versions table to track survey changes
CREATE TABLE IF NOT EXISTS survey_versions (
  id SERIAL PRIMARY KEY,
  survey_id INT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  version_number VARCHAR(20),
  form_config JSONB NOT NULL,
  change_description TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_versions_survey_id ON survey_versions (survey_id);
