-- ================================================
-- Storage bucket для фотографий объектов
-- Выполни в Supabase → SQL Editor
-- ================================================

-- Создать bucket (публичный — фото доступны по прямой ссылке)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  10485760,  -- 10 MB на файл
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- RLS политики для storage.objects
-- Разрешить публичное чтение (просмотр фото)
DROP POLICY IF EXISTS "property-photos public read" ON storage.objects;
CREATE POLICY "property-photos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Разрешить загрузку (anon + authenticated)
DROP POLICY IF EXISTS "property-photos insert" ON storage.objects;
CREATE POLICY "property-photos insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-photos');

-- Разрешить замену (upsert)
DROP POLICY IF EXISTS "property-photos update" ON storage.objects;
CREATE POLICY "property-photos update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'property-photos');

-- Разрешить удаление
DROP POLICY IF EXISTS "property-photos delete" ON storage.objects;
CREATE POLICY "property-photos delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-photos');

-- Проверка
SELECT id, name, public FROM storage.buckets WHERE id = 'property-photos';
