-- Add pricing_conditions column for flexible deal conditions in complexes
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS pricing_conditions jsonb DEFAULT '[]'::jsonb;
