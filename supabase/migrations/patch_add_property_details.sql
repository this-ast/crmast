-- ================================================
-- ПАТЧ: расширенные поля квартиры
-- Безопасно запускать повторно
-- ================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS kitchen_area   numeric(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS living_area    numeric(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS extra_features text[]   DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS room_type      text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ceiling_height numeric(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathroom_type  text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS window_views   text[]   DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS renovation     text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heated_floor   boolean  DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furniture      text[]   DEFAULT '{}';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_method    text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plan     text;

NOTIFY pgrst, 'reload schema';
