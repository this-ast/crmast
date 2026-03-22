-- Tasks table for dashboard task management
CREATE TABLE IF NOT EXISTS tasks (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  priority      text NOT NULL DEFAULT 'medium',  -- high | medium | low
  deadline      date,
  status        text NOT NULL DEFAULT 'pending', -- pending | done | cancelled
  linked_type   text,                            -- client | property | deal
  linked_id     uuid,
  profit_potential numeric,
  created_at    timestamptz DEFAULT now() NOT NULL,
  updated_at    timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow all tasks" ON tasks;
DROP POLICY IF EXISTS allow_all_tasks ON tasks;
CREATE POLICY allow_all_tasks ON tasks FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_tasks_updated_at();
