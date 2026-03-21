-- ================================================
-- ФИНАЛЬНЫЙ ПАТЧ ЖК — запустить в Supabase SQL Editor
-- Идемпотентно: безопасно запускать повторно
-- ================================================

-- 1. Функция update_updated_at (нужна для триггеров)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Создать таблицу если не существует
CREATE TABLE IF NOT EXISTS complexes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL DEFAULT 'Без названия',
  description         text,
  developer           text,
  completion_date     text,
  purchase_conditions text,
  characteristics     jsonb NOT NULL DEFAULT '{}',
  developer_phones    text[] NOT NULL DEFAULT '{}',
  manager_names       text[] NOT NULL DEFAULT '{}',
  manager_phones      text[] NOT NULL DEFAULT '{}',
  photos              text[] NOT NULL DEFAULT '{}',
  documents           jsonb NOT NULL DEFAULT '[]',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 3. Убрать NOT NULL с поля name (разрешить пустое название)
ALTER TABLE complexes ALTER COLUMN name DROP NOT NULL;
ALTER TABLE complexes ALTER COLUMN name SET DEFAULT 'Без названия';

-- 4. Добавить недостающие колонки если их нет
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS description         text;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS developer           text;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS completion_date     text;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS purchase_conditions text;
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS characteristics     jsonb NOT NULL DEFAULT '{}';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS developer_phones    text[] NOT NULL DEFAULT '{}';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS manager_names       text[] NOT NULL DEFAULT '{}';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS manager_phones      text[] NOT NULL DEFAULT '{}';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS photos              text[] NOT NULL DEFAULT '{}';
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS documents           jsonb NOT NULL DEFAULT '[]';

-- 5. FK в properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS complex_id uuid REFERENCES complexes(id) ON DELETE SET NULL;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS complex_name text;

CREATE INDEX IF NOT EXISTS idx_properties_complex_id ON properties(complex_id);

-- 6. Триггер updated_at
DROP TRIGGER IF EXISTS trg_complexes_updated_at ON complexes;
CREATE TRIGGER trg_complexes_updated_at
  BEFORE UPDATE ON complexes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS — разрешить всё для всех
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_complexes ON complexes;
CREATE POLICY allow_all_complexes ON complexes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Настройки агента
CREATE TABLE IF NOT EXISTS agent_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  agency_name text,
  instagram   text,
  telegram    text,
  whatsapp    text,
  logo_url    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_agent_settings ON agent_settings;
CREATE POLICY allow_all_agent_settings ON agent_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_agent_settings_updated_at ON agent_settings;
CREATE TRIGGER trg_agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- Проверка: должно вернуть список колонок таблицы
-- ================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'complexes'
ORDER BY ordinal_position;
