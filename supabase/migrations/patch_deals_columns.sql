-- ================================================
-- ПАТЧ: добавить недостающие колонки в таблицу deals
-- Запустить в Supabase SQL Editor (БЕЗОПАСНО — данные не удаляются)
-- ================================================

-- Добавить deal_number (integer, будет заполнен через sequence)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_number integer;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS property_notes text;

-- Создать sequence и привязать к deal_number
CREATE SEQUENCE IF NOT EXISTS deals_deal_number_seq;

-- Заполнить существующие строки, у которых deal_number ещё NULL
UPDATE deals
SET deal_number = nextval('deals_deal_number_seq')
WHERE deal_number IS NULL;

-- Установить default для новых строк
ALTER TABLE deals
  ALTER COLUMN deal_number SET DEFAULT nextval('deals_deal_number_seq');

-- RLS политики (если ещё не созданы)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_deals ON deals;
CREATE POLICY allow_all_deals ON deals FOR ALL USING (true) WITH CHECK (true);
