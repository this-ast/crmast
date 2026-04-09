-- Add completion_date field to properties table (for new_build status)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS completion_date text;
