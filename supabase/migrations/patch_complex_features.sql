-- Add district and address to complexes
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS address text;

-- Add pricing JSONB for deal conditions
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS pricing jsonb DEFAULT '{}'::jsonb;

-- Developer units table (objects directly from developer, separate from owner properties)
CREATE TABLE IF NOT EXISTS complex_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id UUID NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  title TEXT,
  rooms INTEGER,
  area NUMERIC,
  floor INTEGER,
  total_floors INTEGER,
  price BIGINT,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE complex_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_complex_units" ON complex_units;
CREATE POLICY "allow_all_complex_units" ON complex_units FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
