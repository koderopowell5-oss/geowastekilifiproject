-- Multi-tenancy tables setup script
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  admin_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name)
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full administrative access', '["submit_data", "view_submissions", "view_aggregate", "edit_forms", "manage_team", "share_forms", "delete_submissions"]'::jsonb),
  ('supervisor', 'Supervisor with team management', '["submit_data", "view_submissions", "view_aggregate", "share_forms"]'::jsonb),
  ('data_collector', 'Basic data submission only', '["submit_data", "download_forms"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS enumerator_roles (
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (enumerator_id, project_id, role_id)
);

CREATE TABLE IF NOT EXISTS form_sharing (
  form_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  enumerator_id INTEGER NOT NULL REFERENCES enumerators(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  shared_by_id INTEGER REFERENCES enumerators(id) ON DELETE SET NULL,
  permissions JSONB DEFAULT '["download", "submit"]'::jsonb,
  PRIMARY KEY (form_id, enumerator_id)
);

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

CREATE INDEX IF NOT EXISTS idx_form_sharing_enumerator_id ON form_sharing(enumerator_id);
CREATE INDEX IF NOT EXISTS idx_form_sharing_project_id ON form_sharing(project_id);
CREATE INDEX IF NOT EXISTS idx_form_sharing_shared_by_id ON form_sharing(shared_by_id);
