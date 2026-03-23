-- ================================================
-- ПАТЧ: добавить колонку район (district)
-- Безопасно запускать повторно
-- ================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS district text;

NOTIFY pgrst, 'reload schema';
