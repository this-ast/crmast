-- ================================================================
-- ПОЛНЫЙ ПАТЧ — запустить в Supabase SQL Editor
-- Идемпотентно: безопасно запускать повторно на любой базе
-- ================================================================
-- ВАЖНО: НЕ запускай final.sql повторно — он удаляет clients и properties!

-- ─── Вспомогательная функция updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── complex_units — новые колонки для калькулятора ──────────────
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS floor_to                  INTEGER;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS price_per_m2              NUMERIC;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS payment_type              TEXT;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_rate             NUMERIC;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_years            INTEGER;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS mortgage_down_payment_pct NUMERIC;
ALTER TABLE complex_units ADD COLUMN IF NOT EXISTS photos                    TEXT[] DEFAULT '{}';

-- ─── complexes — pricing_conditions (для форм оплаты) ────────────
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS pricing_conditions JSONB DEFAULT '[]';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS district           TEXT;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS address            TEXT;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS layouts            TEXT[] DEFAULT '{}';

-- ─── clients — первый контакт ────────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_contact DATE;

-- ─── properties — завершение, district ───────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS completion_date TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS district        TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS complex_id      UUID REFERENCES complexes(id) ON DELETE SET NULL;

-- ─── tasks — also_linked (множественные привязки) ────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS also_linked JSONB DEFAULT '[]';

-- ─── tasks — idempotent policy (удалить обе возможные версии) ────
DROP POLICY IF EXISTS "allow all tasks" ON tasks;
DROP POLICY IF EXISTS allow_all_tasks ON tasks;
CREATE POLICY allow_all_tasks ON tasks FOR ALL USING (true) WITH CHECK (true);

-- ─── demands — таблица заявок покупателей ────────────────────────
-- (нигде не создавалась отдельным файлом — КРИТИЧНО)
CREATE TABLE IF NOT EXISTS demands (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_number   SERIAL,
  title           TEXT,
  client_id       UUID        REFERENCES clients(id) ON DELETE CASCADE,
  budget_min      NUMERIC,
  budget_max      NUMERIC,
  districts       TEXT[]      DEFAULT '{}',
  property_types  TEXT[]      DEFAULT '{}',
  payment_types   TEXT[]      DEFAULT '{}',
  floor_min       INTEGER,
  floor_max       INTEGER,
  area_min        NUMERIC,
  area_max        NUMERIC,
  area_sotki_min  NUMERIC,
  area_sotki_max  NUMERIC,
  market_type     TEXT,
  complex_ids     UUID[]      DEFAULT '{}',
  renovation      TEXT[]      DEFAULT '{}',
  funnel_stage    TEXT        DEFAULT 'new',
  status          TEXT        DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all demands" ON demands;
DROP POLICY IF EXISTS allow_all_demands ON demands;
CREATE POLICY allow_all_demands ON demands FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_demands_updated_at ON demands;
CREATE TRIGGER trg_demands_updated_at
  BEFORE UPDATE ON demands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── clients — seller_status (добавлялся в patch_client_demand_v2) ─
ALTER TABLE clients ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'Активный';

-- ─── saved_filters ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_filters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client','property')),
  filter_data JSONB NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
-- Удаляем обе версии имени полиса (с пробелом и с подчёркиванием)
DROP POLICY IF EXISTS "allow all saved_filters" ON saved_filters;
DROP POLICY IF EXISTS allow_all_saved_filters ON saved_filters;
CREATE POLICY allow_all_saved_filters ON saved_filters FOR ALL USING (true) WITH CHECK (true);

-- ─── custom_statuses ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#3b82f6',
  type        TEXT NOT NULL DEFAULT 'warm',
  hint        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
-- Удаляем обе версии имени полиса (с пробелом и с подчёркиванием)
DROP POLICY IF EXISTS "allow all custom_statuses" ON custom_statuses;
DROP POLICY IF EXISTS allow_all_custom_statuses ON custom_statuses;
CREATE POLICY allow_all_custom_statuses ON custom_statuses FOR ALL USING (true) WITH CHECK (true);

-- ─── agent_settings ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  phone       TEXT,
  email       TEXT,
  agency_name TEXT,
  instagram   TEXT,
  telegram    TEXT,
  whatsapp    TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_agent_settings ON agent_settings;
CREATE POLICY allow_all_agent_settings ON agent_settings FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_agent_settings_updated_at ON agent_settings;
CREATE TRIGGER trg_agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Обновить кеш схемы PostgREST ────────────────────────────────
NOTIFY pgrst, 'reload schema';
