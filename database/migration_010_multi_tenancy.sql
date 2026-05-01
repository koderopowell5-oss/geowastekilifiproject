-- ============================================================================
-- Migration 010: Multi-Tenancy Implementation
-- Adds project-based isolation with roles and permissions
-- ============================================================================

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id UUID NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE INDEX idx_projects_admin_id ON projects(admin_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- 2. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full access to project', '["submit_data", "view_submissions", "view_aggregate", "edit_forms", "manage_team", "share_forms", "delete_submissions"]'::jsonb),
  ('supervisor', 'Can view and manage team submissions', '["submit_data", "view_submissions", "view_aggregate", "share_forms"]'::jsonb),
  ('data_collector', 'Can only submit data', '["submit_data", "download_forms"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 3. Create enumerator_roles junction table
CREATE TABLE IF NOT EXISTS enumerator_roles (
  enumerator_id UUID NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enumerator_id, project_id, role_id)
);

CREATE INDEX idx_enumerator_roles_enumerator ON enumerator_roles(enumerator_id);
CREATE INDEX idx_enumerator_roles_project ON enumerator_roles(project_id);

-- 4. Add project_id to enumerators table
ALTER TABLE enumerators ADD COLUMN IF NOT EXISTS primary_project_id UUID REFERENCES projects(id);

-- 5. Add project_id to surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
CREATE INDEX idx_surveys_project_id ON surveys(project_id);

-- 6. Add project_id to waste_sites table
ALTER TABLE waste_sites ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
CREATE INDEX idx_waste_sites_project_id ON waste_sites(project_id);

-- 7. Add project_id to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
CREATE INDEX idx_submissions_project_id ON submissions(project_id);

-- 8. Create form_sharing table (n:m relationship between forms and enumerators)
CREATE TABLE IF NOT EXISTS form_sharing (
  form_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  enumerator_id UUID NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  shared_by_id UUID REFERENCES enumerators(id),
  permissions JSONB DEFAULT '["download", "submit"]'::jsonb,
  PRIMARY KEY (form_id, enumerator_id)
);

CREATE INDEX idx_form_sharing_form ON form_sharing(form_id);
CREATE INDEX idx_form_sharing_enumerator ON form_sharing(enumerator_id);
CREATE INDEX idx_form_sharing_project ON form_sharing(project_id);

-- 9. Create project_invites table
CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invite_code VARCHAR(128) UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, email)
);

CREATE INDEX idx_project_invites_project ON project_invites(project_id);
CREATE INDEX idx_project_invites_email ON project_invites(email);
CREATE INDEX idx_project_invites_code ON project_invites(invite_code);
CREATE INDEX idx_project_invites_status ON project_invites(status);

-- ============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enumerator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Projects: Users can see projects they're members of
CREATE POLICY projects_isolation ON projects
  FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
    OR
    admin_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
  );

-- Enumerator Roles: Users can see roles for their projects
CREATE POLICY enumerator_roles_isolation ON enumerator_roles
  FOR SELECT
  USING (
    project_id IN (
      SELECT DISTINCT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
  );

-- Form Sharing: Users can see forms shared with them
CREATE POLICY form_sharing_isolation ON form_sharing
  FOR SELECT
  USING (
    enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    OR
    project_id IN (
      SELECT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
      AND role_id IN (SELECT id FROM roles WHERE permissions @> '["share_forms"]'::jsonb)
    )
  );

-- Surveys: Users can see surveys in their projects or shared with them
CREATE POLICY surveys_isolation ON surveys
  FOR SELECT
  USING (
    project_id IN (
      SELECT DISTINCT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
    OR
    id IN (
      SELECT form_id FROM form_sharing 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
  );

-- Waste Sites: Users can see sites in their projects
CREATE POLICY waste_sites_isolation ON waste_sites
  FOR SELECT
  USING (
    project_id IN (
      SELECT DISTINCT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
  );

-- Submissions: Users can see submissions from their project's surveys
CREATE POLICY submissions_isolation ON submissions
  FOR SELECT
  USING (
    project_id IN (
      SELECT DISTINCT project_id FROM enumerator_roles 
      WHERE enumerator_id = (SELECT id FROM enumerators WHERE email = current_setting('request.jwt.claims.email', true))
    )
  );

-- ============================================================================
-- MIGRATION SUPPORT FUNCTIONS
-- ============================================================================

-- Function to grant enumerator access to project
CREATE OR REPLACE FUNCTION grant_enumerator_project_access(
  p_enumerator_id UUID,
  p_project_id UUID,
  p_role_id INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO enumerator_roles (enumerator_id, project_id, role_id)
  VALUES (p_enumerator_id, p_project_id, p_role_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share form with enumerator
CREATE OR REPLACE FUNCTION share_form_with_enumerator(
  p_form_id UUID,
  p_enumerator_id UUID,
  p_project_id UUID,
  p_shared_by_id UUID
) RETURNS void AS $$
BEGIN
  INSERT INTO form_sharing (form_id, enumerator_id, project_id, shared_by_id)
  VALUES (p_form_id, p_enumerator_id, p_project_id, p_shared_by_id)
  ON CONFLICT (form_id, enumerator_id) DO UPDATE SET
    shared_at = CURRENT_TIMESTAMP,
    shared_by_id = p_shared_by_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE projects IS 'Represents a survey project with isolated data';
COMMENT ON TABLE roles IS 'Defines role types and their permissions';
COMMENT ON TABLE enumerator_roles IS 'Links enumerators to projects with specific roles';
COMMENT ON TABLE form_sharing IS 'Controls which enumerators can access which forms';
COMMENT ON TABLE project_invites IS 'Stores pending project invitations';
COMMENT ON COLUMN enumerators.primary_project_id IS 'The default project when user logs in';
COMMENT ON COLUMN surveys.project_id IS 'The project this form belongs to';
COMMENT ON COLUMN waste_sites.project_id IS 'The project this data point belongs to';
COMMENT ON COLUMN submissions.project_id IS 'The project this submission belongs to';
