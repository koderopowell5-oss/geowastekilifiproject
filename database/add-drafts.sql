-- Add Drafts Table for Waste Site Forms

CREATE TABLE IF NOT EXISTS waste_site_drafts (
  id SERIAL PRIMARY KEY,
  enumerator_email VARCHAR(100) NOT NULL UNIQUE,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enumerator_email) REFERENCES enumerators(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_drafts_enumerator_email ON waste_site_drafts (enumerator_email);

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_drafts_updated_at ON waste_site_drafts;
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON waste_site_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Drafts table created successfully!' as message;
