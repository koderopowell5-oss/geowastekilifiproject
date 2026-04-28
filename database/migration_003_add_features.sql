-- Migration: Add comprehensive features support
-- Includes: RBAC, Task Assignments, Comments, Quality Scoring, Offline Queue, Notifications

-- ─── 1. ROLE-BASED ACCESS CONTROL ──────────────────────────────────────────

-- Update enumerators table with additional role management fields
ALTER TABLE enumerators 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'enumerator' CHECK (role IN ('admin', 'supervisor', 'enumerator'));

ALTER TABLE enumerators 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_enumerators_role ON enumerators(role);

-- ─── 2. ENUMERATOR TASK ASSIGNMENTS ────────────────────────────────────────

-- New table for assigning wards/areas to enumerators
CREATE TABLE IF NOT EXISTS enumerator_assignments (
  id SERIAL PRIMARY KEY,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  ward VARCHAR(50) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES enumerators(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  target_records INTEGER,
  description TEXT,
  
  UNIQUE(enumerator_id, ward),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enumerator_assignments_enumerator_id ON enumerator_assignments(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_enumerator_assignments_ward ON enumerator_assignments(ward);
CREATE INDEX IF NOT EXISTS idx_enumerator_assignments_status ON enumerator_assignments(status);

-- ─── 3. COMMENT SYSTEM ─────────────────────────────────────────────────────

-- New table for comments on waste site records
CREATE TABLE IF NOT EXISTS record_comments (
  id SERIAL PRIMARY KEY,
  waste_site_id INTEGER NOT NULL REFERENCES waste_sites(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE SET NULL,
  author_email VARCHAR(100) NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN ('general', 'flag', 'feedback', 'correction')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_record_comments_waste_site_id ON record_comments(waste_site_id);
CREATE INDEX IF NOT EXISTS idx_record_comments_author_id ON record_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_record_comments_created_at ON record_comments(created_at);

-- ─── 4. DATA QUALITY SCORING ───────────────────────────────────────────────

-- Add quality score to waste_sites table
ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100);

ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS quality_issues TEXT[];

ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;

ALTER TABLE waste_sites 
ADD COLUMN IF NOT EXISTS flag_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_waste_sites_quality_score ON waste_sites(quality_score);
CREATE INDEX IF NOT EXISTS idx_waste_sites_is_flagged ON waste_sites(is_flagged);

-- ─── 5. EMAIL NOTIFICATIONS ────────────────────────────────────────────────

-- Table to track sent notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  recipient_email VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'assignment', 'feedback', 'record_flag', 'approval', 'alert', 'system'
  )),
  
  related_record_id INTEGER REFERENCES waste_sites(id) ON DELETE SET NULL,
  related_assignment_id INTEGER REFERENCES enumerator_assignments(id) ON DELETE SET NULL,
  
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at DESC);

-- ─── 6. OFFLINE SUBMISSION QUEUE ───────────────────────────────────────────

-- Table for queuing offline submissions
CREATE TABLE IF NOT EXISTS offline_queue (
  id SERIAL PRIMARY KEY,
  enumerator_email VARCHAR(100) NOT NULL,
  form_data JSONB NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP,
  error_message TEXT,
  
  retries INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offline_queue_enumerator_email ON offline_queue(enumerator_email);
CREATE INDEX IF NOT EXISTS idx_offline_queue_sync_status ON offline_queue(sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_created_at ON offline_queue(created_at DESC);

-- ─── 7. DEFAULT PERMISSIONS FOR ROLES ────────────────────────────────────

-- Admin permissions
UPDATE enumerators 
SET permissions = jsonb_build_object(
  'view_records', true,
  'create_records', true,
  'edit_records', true,
  'delete_records', true,
  'view_assignments', true,
  'create_assignments', true,
  'view_comments', true,
  'create_comments', true,
  'delete_comments', true,
  'view_notifications', true,
  'manage_users', true,
  'export_data', true,
  'generate_reports', true
)
WHERE role = 'admin';

-- Supervisor permissions
UPDATE enumerators 
SET permissions = jsonb_build_object(
  'view_records', true,
  'create_records', true,
  'edit_records', true,
  'delete_records', false,
  'view_assignments', true,
  'create_assignments', true,
  'view_comments', true,
  'create_comments', true,
  'delete_comments', false,
  'view_notifications', true,
  'manage_users', false,
  'export_data', true,
  'generate_reports', true
)
WHERE role = 'supervisor';

-- Enumerator permissions (default)
UPDATE enumerators 
SET permissions = jsonb_build_object(
  'view_records', true,
  'create_records', true,
  'edit_records', true,
  'delete_records', false,
  'view_assignments', true,
  'create_assignments', false,
  'view_comments', true,
  'create_comments', true,
  'delete_comments', false,
  'view_notifications', true,
  'manage_users', false,
  'export_data', false,
  'generate_reports', false
)
WHERE role = 'enumerator';

-- ─── TRIGGERS ──────────────────────────────────────────────────────────────

-- Auto-update timestamps for new tables
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enumerator_assignments_update 
BEFORE UPDATE ON enumerator_assignments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_record_comments_update 
BEFORE UPDATE ON record_comments
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
