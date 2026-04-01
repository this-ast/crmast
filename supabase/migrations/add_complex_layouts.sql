-- Add layouts column to complexes table for floor plan images
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS layouts text[] DEFAULT '{}';
