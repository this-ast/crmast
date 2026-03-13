-- 002: Добавление display_id, priority, last_contact_date в clients

-- 1. Автоинкремент display_id
ALTER TABLE clients ADD COLUMN IF NOT EXISTS display_id serial;

-- Заполнить существующие записи порядковыми номерами по дате создания
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM clients
)
UPDATE clients SET display_id = numbered.rn
FROM numbered WHERE clients.id = numbered.id;

-- Уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_display_id ON clients (display_id);

-- Сбросить sequence на max+1 чтобы новые записи получали правильные номера
SELECT setval(
  pg_get_serial_sequence('clients', 'display_id'),
  COALESCE((SELECT MAX(display_id) FROM clients), 0) + 1,
  false
);

-- 2. Приоритет
ALTER TABLE clients ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

-- 3. Дата последнего контакта
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_contact_date timestamptz;

-- Заполнить last_contact_date из последних взаимодействий
UPDATE clients SET last_contact_date = sub.last_dt
FROM (
  SELECT client_id, MAX(occurred_at) AS last_dt
  FROM client_interactions
  GROUP BY client_id
) sub
WHERE clients.id = sub.client_id AND clients.last_contact_date IS NULL;

-- 4. Триггер: автообновление last_contact_date при добавлении взаимодействия
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS trigger AS $$
BEGIN
  UPDATE clients
  SET last_contact_date = NEW.occurred_at
  WHERE id = NEW.client_id
    AND (last_contact_date IS NULL OR last_contact_date < NEW.occurred_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_client_last_contact ON client_interactions;
CREATE TRIGGER trg_update_client_last_contact
  AFTER INSERT ON client_interactions
  FOR EACH ROW EXECUTE FUNCTION update_client_last_contact();
