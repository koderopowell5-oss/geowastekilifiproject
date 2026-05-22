-- ============================================================================
-- Migration 010: Multi-Tenancy Implementation (FIXED)
-- Adds project-based isolation with roles and permissions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create projects table (with integer admin_id to match enumerators)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE INDEX IF NOT EXISTS idx_projects_admin_id ON projects(admin_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- 2. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles (if not exists)
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full administrative access', '["submit_data", "view_submissions", "view_aggregate", "edit_forms", "manage_team", "share_forms", "delete_submissions"]'::jsonb),
  ('supervisor', 'Supervisor with team management', '["submit_data", "view_submissions", "view_aggregate", "share_forms"]'::jsonb),
  ('data_collector', 'Basic data submission only', '["submit_data", "download_forms"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 3. Create enumerator_roles junction table
CREATE TABLE IF NOT EXISTS enumerator_roles (
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enumerator_id, project_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_enumerator_roles_enumerator_id ON enumerator_roles(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_enumerator_roles_project_id ON enumerator_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_enumerator_roles_role_id ON enumerator_roles(role_id);

-- 4. Create form_sharing table
CREATE TABLE IF NOT EXISTS form_sharing (
  form_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  shared_by_id INTEGER REFERENCES enumerators(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '["download", "submit"]'::jsonb,
  PRIMARY KEY (form_id, enumerator_id)
);

CREATE INDEX IF NOT EXISTS idx_form_sharing_enumerator_id ON form_sharing(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_form_sharing_project_id ON form_sharing(project_id);
CREATE INDEX IF NOT EXISTS idx_form_sharing_shared_by_id ON form_sharing(shared_by_id);

-- 5. Create project_invites table
CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invite_code VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_project_invites_email ON project_invites(email);
CREATE INDEX IF NOT EXISTS idx_project_invites_project_id ON project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_invite_code ON project_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_project_invites_expires_at ON project_invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_project_invites_status ON project_invites(status);

-- 6. Add project_id columns to existing tables that definitely exist
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS primary_project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE waste_sites ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- Create indexes for project_id columns
CREATE INDEX IF NOT EXISTS idx_enumerators_primary_project_id ON enumerators(primary_project_id);
CREATE INDEX IF NOT EXISTS idx_surveys_project_id ON surveys(project_id);
CREATE INDEX IF NOT EXISTS idx_waste_sites_project_id ON waste_sites(project_id);

-- 7. Helper functions for permissions and project access

-- Function to grant enumerator access to project
CREATE OR REPLACE FUNCTION grant_enumerator_project_access(
  p_enumerator_id INTEGER,
  p_project_id UUID,
  p_role_id INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO enumerator_roles (enumerator_id, project_id, role_id)
  VALUES (p_enumerator_id, p_project_id, p_role_id)
  ON CONFLICT (enumerator_id, project_id, role_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to share form with enumerator
CREATE OR REPLACE FUNCTION share_form_with_enumerator(
  p_form_id INTEGER,
  p_enumerator_id INTEGER,
  p_project_id UUID,
  p_shared_by_id INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO form_sharing (form_id, enumerator_id, project_id, shared_by_id)
  VALUES (p_form_id, p_enumerator_id, p_project_id, p_shared_by_id)
  ON CONFLICT (form_id, enumerator_id) DO UPDATE SET
    shared_at = CURRENT_TIMESTAMP,
    shared_by_id = p_shared_by_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Comments for documentation
COMMENT ON TABLE projects IS 'Project/workspace container for organizing forms, submissions, and team members';
COMMENT ON TABLE enumerator_roles IS 'Junction table mapping enumerators to projects with assigned roles';
COMMENT ON TABLE form_sharing IS 'Form sharing permissions between projects and enumerators';
COMMENT ON TABLE project_invites IS 'Invitation codes for adding enumerators to projects';
COMMENT ON COLUMN enumerators.primary_project_id IS 'Default/active project for this enumerator';
COMMENT ON COLUMN surveys.project_id IS 'Project this survey/form belongs to';
COMMENT ON COLUMN waste_sites.project_id IS 'Project this waste site belongs to';
COMMENT ON COLUMN submissions.project_id IS 'Project this submission belongs to';
