-- ================================================================
-- ПОЛНЫЙ ПАТЧ — запустить в Supabase SQL Editor
-- Идемпотентно: безопасно запускать повторно на любой базе
-- ================================================================

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
