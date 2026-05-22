-- Migration 014: Add project_id to surveys and survey_submissions
-- Ensures both surveys and survey_submissions carry project context and backfills existing submissions

BEGIN;

-- 1. Ensure projects table exists (migration_010 should have created it). This will fail if projects table does not exist.
-- Add project_id to surveys (if missing)
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 2. Add project_id to survey_submissions (this project uses `survey_submissions` table name)
ALTER TABLE survey_submissions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- 3. Backfill project_id on survey_submissions from stored JSON field `_project_id` (if present)
-- `_project_id` may have been stored as a string in the JSON payload by the application.
-- Use a safe cast and perform only where the JSON key exists and is a valid uuid.
UPDATE survey_submissions
SET project_id = (response_data ->> '_project_id')::uuid
WHERE response_data ? '_project_id'
  AND (response_data ->> '_project_id') ~ '^[0-9a-fA-F-]{36}$'
  AND (project_id IS NULL OR project_id = '00000000-0000-0000-0000-000000000000');

-- 4. Create index for fast lookups by project
CREATE INDEX IF NOT EXISTS idx_survey_submissions_project_id ON survey_submissions (project_id);
CREATE INDEX IF NOT EXISTS idx_surveys_project_id ON surveys (project_id);

-- 5. Add comments for clarity
COMMENT ON COLUMN surveys.project_id IS 'Project this survey/form belongs to';
COMMENT ON COLUMN survey_submissions.project_id IS 'Project context for this submission (sourced server-side)';

COMMIT;
