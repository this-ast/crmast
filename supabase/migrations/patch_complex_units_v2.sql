-- Add missing columns to complex_units for price calculator and payment types
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS floor_to INTEGER;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS price_per_m2 NUMERIC;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_rate NUMERIC;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_years INTEGER;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_down_payment_pct NUMERIC;

-- Make sure photos column exists (in case complex_units was recreated without it)
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
