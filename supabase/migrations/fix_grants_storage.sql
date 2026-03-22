-- =============================================================
-- Фикс: GRANT права + Storage бакеты
-- Таблицы уже созданы — этот скрипт только права и бакеты
-- Запустить в Supabase → SQL Editor → New query
-- =============================================================

-- ─── 1. Пересоздать политики (DROP + CREATE в DO-блоке чтобы не падало) ─────

DO $$ BEGIN
  DROP POLICY IF EXISTS allow_all_saved_filters ON saved_filters;
  CREATE POLICY allow_all_saved_filters ON saved_filters
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS allow_all_custom_statuses ON custom_statuses;
  CREATE POLICY allow_all_custom_statuses ON custom_statuses
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS allow_all_timeline_events ON timeline_events;
  CREATE POLICY allow_all_timeline_events ON timeline_events
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS allow_all_collections ON collections;
  CREATE POLICY allow_all_collections ON collections
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. GRANT на основные таблицы ────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_filters    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_statuses  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_events  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients          TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON properties       TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deals            TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks            TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON complexes        TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON collections      TO anon, authenticated;

-- ─── 3. Storage: property-photos ─────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos', 'property-photos', true, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

DO $$ BEGIN
  DROP POLICY IF EXISTS "property-photos public read" ON storage.objects;
  CREATE POLICY "property-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "property-photos insert" ON storage.objects;
  CREATE POLICY "property-photos insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "property-photos update" ON storage.objects;
  CREATE POLICY "property-photos update" ON storage.objects FOR UPDATE USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "property-photos delete" ON storage.objects;
  CREATE POLICY "property-photos delete" ON storage.objects FOR DELETE USING (bucket_id = 'property-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. Storage: complex-photos / complex-docs ───────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('complex-photos', 'complex-photos', true, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 10485760;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('complex-docs', 'complex-docs', true, 20971520,
  ARRAY['application/pdf','image/jpeg','image/jpg','image/png','image/webp']
) ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

DO $$ BEGIN
  DROP POLICY IF EXISTS "complex-photos public read" ON storage.objects;
  CREATE POLICY "complex-photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'complex-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "complex-photos insert" ON storage.objects;
  CREATE POLICY "complex-photos insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complex-photos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "complex-docs public read" ON storage.objects;
  CREATE POLICY "complex-docs public read" ON storage.objects FOR SELECT USING (bucket_id = 'complex-docs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "complex-docs insert" ON storage.objects;
  CREATE POLICY "complex-docs insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'complex-docs');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 5. Перезагрузить schema cache PostgREST ─────────────────
NOTIFY pgrst, 'reload schema';

-- ─── Проверка ────────────────────────────────────────────────
SELECT id, name, public FROM storage.buckets WHERE id IN ('property-photos','complex-photos','complex-docs');
