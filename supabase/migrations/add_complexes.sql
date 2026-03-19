-- ================================================
-- Жилые комплексы + настройки агента
-- Запустить в Supabase SQL Editor
-- ================================================

-- Таблица ЖК
CREATE TABLE complexes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
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

-- FK в properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS complex_id uuid REFERENCES complexes(id) ON DELETE SET NULL;

-- Триггер: обновлять complex_name при смене complex_id
CREATE OR REPLACE FUNCTION sync_complex_name()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.complex_id IS NOT NULL THEN
    SELECT name INTO NEW.complex_name FROM complexes WHERE id = NEW.complex_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_complex_name
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION sync_complex_name();

-- updated_at триггер для complexes
CREATE TRIGGER trg_complexes_updated_at
  BEFORE UPDATE ON complexes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_complexes ON complexes FOR ALL USING (true) WITH CHECK (true);

-- Настройки агента (одна запись)
CREATE TABLE agent_settings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text,
  phone        text,
  email        text,
  agency_name  text,
  instagram    text,
  telegram     text,
  whatsapp     text,
  logo_url     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX agent_settings_singleton ON agent_settings ((true));

CREATE TRIGGER trg_agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_agent_settings ON agent_settings FOR ALL USING (true) WITH CHECK (true);

-- Storage buckets (выполни в Supabase Dashboard → Storage, или раскомментируй):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('complex-photos', 'complex-photos', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('complex-docs', 'complex-docs', true) ON CONFLICT DO NOTHING;
