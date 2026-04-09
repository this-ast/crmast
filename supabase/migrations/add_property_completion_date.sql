-- Add completion_date field to properties table (for new_build status)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS completion_date text;

-- Extend market_type check constraint to allow new_build subtypes
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_market_type_check;
ALTER TABLE properties ADD CONSTRAINT properties_market_type_check
  CHECK (market_type IN ('secondary','new_build','new_build_ready','new_build_unready'));
