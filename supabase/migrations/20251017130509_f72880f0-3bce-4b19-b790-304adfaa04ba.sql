-- Update photo storage columns to support descriptions
-- Simplified approach: convert to jsonb with default empty array
-- New format: [{url: string, description: string, uploaded_at: timestamp}]

-- Environmental Areas
ALTER TABLE environmental_areas 
  ALTER COLUMN photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN photo_urls SET DEFAULT '[]'::jsonb;

-- AT Audit
ALTER TABLE at_audit 
  ALTER COLUMN photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN photo_urls SET DEFAULT '[]'::jsonb;

-- Measurements
ALTER TABLE measurements 
  ALTER COLUMN photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN photo_urls SET DEFAULT '[]'::jsonb;

-- Risks Controls
ALTER TABLE risks_controls 
  ALTER COLUMN photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN photo_urls SET DEFAULT '[]'::jsonb;

-- Site Survey - Multiple photo fields
ALTER TABLE site_survey 
  ALTER COLUMN stairs_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN stairs_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN living_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN living_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN outdoor_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN outdoor_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN laundry_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN laundry_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN bedroom_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN bedroom_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN bathroom_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN bathroom_photo_urls SET DEFAULT '[]'::jsonb,
  ALTER COLUMN kitchen_photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN kitchen_photo_urls SET DEFAULT '[]'::jsonb;

-- Structural Reconnaissance
ALTER TABLE structural_reconnaissance 
  ALTER COLUMN photo_urls TYPE jsonb USING '[]'::jsonb,
  ALTER COLUMN photo_urls SET DEFAULT '[]'::jsonb;