-- ==============================================
-- Недостающие таблицы: saved_filters, custom_statuses, collections, timeline_events
-- ==============================================

-- Сохранённые фильтры
CREATE TABLE IF NOT EXISTS saved_filters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('client', 'property')),
  filter_data jsonb NOT NULL DEFAULT '{}',
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_saved_filters ON saved_filters;
CREATE POLICY allow_all_saved_filters ON saved_filters FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_saved_filters_entity_type ON saved_filters(entity_type);

-- Кастомные статусы клиентов
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
CREATE POLICY allow_all_custom_statuses ON custom_statuses FOR ALL USING (true) WITH CHECK (true);

-- Подборки объектов
CREATE TABLE IF NOT EXISTS collections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  client_id    uuid REFERENCES clients(id) ON DELETE SET NULL,
  title        text NOT NULL,
  comment      text,
  property_ids uuid[] NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS allow_all_collections ON collections;
CREATE POLICY allow_all_collections ON collections FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_collections_slug      ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_client_id ON collections(client_id);

CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS collections_updated_at ON collections;
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_collections_updated_at();

-- Лента событий (timeline)
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
CREATE POLICY allow_all_timeline_events ON timeline_events FOR ALL USING (true) WITH CHECK (true);

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
