-- ================================================
-- ПАТЧ: добавить недостающие колонки
-- Запустить в Supabase SQL Editor (БЕЗОПАСНО — данные не удаляются)
-- Если колонка уже есть — просто игнорирует
-- ================================================

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deal_type          text NOT NULL DEFAULT 'sale'
    CHECK (deal_type IN ('sale','rent')),
  ADD COLUMN IF NOT EXISTS market_type        text
    CHECK (market_type IN ('secondary','new_build')),
  ADD COLUMN IF NOT EXISTS has_mortgage       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_installment    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_trade_in       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_maternal_cap   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_military_mort  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active_business boolean,
  ADD COLUMN IF NOT EXISTS has_wet_points     boolean,
  ADD COLUMN IF NOT EXISTS has_parking        boolean,
  ADD COLUMN IF NOT EXISTS entrance_groups    int,
  ADD COLUMN IF NOT EXISTS area_sotki         numeric(10,2),
  ADD COLUMN IF NOT EXISTS communications     text[],
  ADD COLUMN IF NOT EXISTS cadastral_number   text,
  ADD COLUMN IF NOT EXISTS view               text,
  ADD COLUMN IF NOT EXISTS complex_name       text,
  ADD COLUMN IF NOT EXISTS description        text;

-- Убедиться что RLS разрешает запись
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_properties ON properties;
DROP POLICY IF EXISTS allow_all_clients    ON clients;

CREATE POLICY allow_all_properties ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY allow_all_clients    ON clients    FOR ALL USING (true) WITH CHECK (true);
