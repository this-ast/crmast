-- ================================================
-- Подборки объектов для клиентов
-- Идемпотентно: безопасно запускать повторно
-- ================================================

-- Функция update_updated_at (создаётся в patch_complexes_final.sql, на всякий случай)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Таблица подборок
CREATE TABLE IF NOT EXISTS collections (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        NOT NULL UNIQUE,
  client_id    uuid        REFERENCES clients(id) ON DELETE SET NULL,
  title        text        NOT NULL DEFAULT 'Подборка',
  comment      text,
  property_ids uuid[]      NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Индекс по slug (для публичного поиска)
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);

-- RLS — разрешить всё (anon нужен для публичного просмотра по slug)
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_collections ON collections;
CREATE POLICY allow_all_collections ON collections
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Триггер updated_at
DROP TRIGGER IF EXISTS trg_collections_updated_at ON collections;
CREATE TRIGGER trg_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Обновить schema cache
NOTIFY pgrst, 'reload schema';

-- Проверка
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'collections' ORDER BY ordinal_position;
