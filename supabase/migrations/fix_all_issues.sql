-- =============================================================
-- КОМПЛЕКСНЫЙ ФИКС: таблицы + права + бакеты + schema cache
-- Запустить в Supabase → SQL Editor → New query
-- =============================================================

-- ─── 1. saved_filters ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_filters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'property')),
  filter_data jsonb NOT NULL DEFAULT '{}',
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_saved_filters ON saved_filters;
CREATE POLICY allow_all_saved_filters ON saved_filters
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_filters TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_saved_filters_entity ON saved_filters(entity_type);

-- ─── 2. custom_statuses ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_statuses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  color      text NOT NULL,
  type       text NOT NULL CHECK (type IN ('hot','warm','thinking','cold','deal','archive')),
  hint       text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_custom_statuses ON custom_statuses;
CREATE POLICY allow_all_custom_statuses ON custom_statuses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_statuses TO anon, authenticated;

-- ─── 3. timeline_events ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'property')),
  entity_id   uuid NOT NULL,
  event_type  text NOT NULL,
  title       text,
  notes       text,
  event_date  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_timeline_events ON timeline_events;
CREATE POLICY allow_all_timeline_events ON timeline_events
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_events TO anon, authenticated;
CREATE INDEX IF NOT EXISTS idx_timeline_entity ON timeline_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_date   ON timeline_events(event_date DESC);

CREATE OR REPLACE FUNCTION update_timeline_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS timeline_events_updated_at ON timeline_events;
CREATE TRIGGER timeline_events_updated_at
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_timeline_updated_at();

-- ─── 4. Явные GRANT на основные таблицы (фикс "данные не сохраняются") ──────
GRANT SELECT, INSERT, UPDATE, DELETE ON clients    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deals      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON complexes  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO anon, authenticated;

-- ─── 5. Storage бакеты для ЖК ────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complex-photos', 'complex-photos', true, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complex-docs', 'complex-docs', true, 20971520,
  ARRAY['application/pdf','image/jpeg','image/jpg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

-- RLS для complex-photos
DROP POLICY IF EXISTS "complex-photos public read"  ON storage.objects;
DROP POLICY IF EXISTS "complex-photos insert"       ON storage.objects;
DROP POLICY IF EXISTS "complex-photos update"       ON storage.objects;
DROP POLICY IF EXISTS "complex-photos delete"       ON storage.objects;
CREATE POLICY "complex-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'complex-photos');
CREATE POLICY "complex-photos insert"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complex-photos');
CREATE POLICY "complex-photos update"      ON storage.objects FOR UPDATE USING (bucket_id = 'complex-photos');
CREATE POLICY "complex-photos delete"      ON storage.objects FOR DELETE USING (bucket_id = 'complex-photos');

-- RLS для complex-docs
DROP POLICY IF EXISTS "complex-docs public read"  ON storage.objects;
DROP POLICY IF EXISTS "complex-docs insert"       ON storage.objects;
DROP POLICY IF EXISTS "complex-docs update"       ON storage.objects;
DROP POLICY IF EXISTS "complex-docs delete"       ON storage.objects;
CREATE POLICY "complex-docs public read" ON storage.objects FOR SELECT USING (bucket_id = 'complex-docs');
CREATE POLICY "complex-docs insert"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complex-docs');
CREATE POLICY "complex-docs update"      ON storage.objects FOR UPDATE USING (bucket_id = 'complex-docs');
CREATE POLICY "complex-docs delete"      ON storage.objects FOR DELETE USING (bucket_id = 'complex-docs');

-- ─── 6. Перезагрузить schema cache PostgREST (фикс 400 на collections) ──────
NOTIFY pgrst, 'reload schema';
