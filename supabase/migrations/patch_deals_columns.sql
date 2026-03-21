-- ================================================
-- ПАТЧ: добавить все недостающие колонки в deals
-- Безопасно запускать повторно (IF NOT EXISTS)
-- Запустить в Supabase SQL Editor
-- ================================================

-- Участники сделки
ALTER TABLE deals ADD COLUMN IF NOT EXISTS buyer_id    uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS seller_id   uuid REFERENCES clients(id) ON DELETE SET NULL;

-- Объект
ALTER TABLE deals ADD COLUMN IF NOT EXISTS property_id    uuid REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS property_notes text;

-- Финансы
ALTER TABLE deals ADD COLUMN IF NOT EXISTS payment_method   text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_price       bigint;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission       bigint;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS commission_split text;

-- Номер сделки
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_number integer;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS deal_date   date;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes       text;

-- Заполнить deal_number для существующих строк
CREATE SEQUENCE IF NOT EXISTS deals_deal_number_seq;
UPDATE deals SET deal_number = nextval('deals_deal_number_seq') WHERE deal_number IS NULL;
ALTER TABLE deals ALTER COLUMN deal_number SET DEFAULT nextval('deals_deal_number_seq');

-- RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_deals ON deals;
DROP POLICY IF EXISTS "allow_all_deals" ON deals;
CREATE POLICY allow_all_deals ON deals FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Принудительно обновить schema cache Supabase
NOTIFY pgrst, 'reload schema';
