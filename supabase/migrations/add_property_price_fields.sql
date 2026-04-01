-- Add net price and agent commission fields to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_net numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_commission numeric;
