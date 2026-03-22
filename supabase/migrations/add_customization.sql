-- Custom client statuses
CREATE TABLE IF NOT EXISTS custom_statuses (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#6366f1',
  type       text NOT NULL DEFAULT 'active', -- hot | warm | thinking | cold | deal | archive
  hint       text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE custom_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all custom_statuses" ON custom_statuses;
DROP POLICY IF EXISTS allow_all_custom_statuses ON custom_statuses;
CREATE POLICY allow_all_custom_statuses ON custom_statuses FOR ALL USING (true) WITH CHECK (true);

-- Pre-populate with defaults
INSERT INTO custom_statuses (name, color, type, hint, sort_order) VALUES
  ('Горячий',  '#ef4444', 'hot',     '🔥 Срочно в работу',      0),
  ('Тёплый',   '#f97316', 'warm',    '⚡ Активно работать',      1),
  ('Думает',   '#8b5cf6', 'thinking','💭 Прогреть',              2),
  ('Воздухан', '#94a3b8', 'cold',    '💨 Дожать или забить',     3),
  ('Холодный', '#3b82f6', 'cold',    '❄️ Напомнить о себе',     4),
  ('Сделка',   '#10b981', 'deal',    '✅ Закрыто',               5),
  ('Архив',    '#eab308', 'archive', '📦 Архив',                 6)
ON CONFLICT DO NOTHING;

-- Saved smart filters
CREATE TABLE IF NOT EXISTS saved_filters (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text NOT NULL,
  entity_type text NOT NULL DEFAULT 'client',
  filter_data jsonb NOT NULL DEFAULT '{}',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all saved_filters" ON saved_filters;
DROP POLICY IF EXISTS allow_all_saved_filters ON saved_filters;
CREATE POLICY allow_all_saved_filters ON saved_filters FOR ALL USING (true) WITH CHECK (true);
