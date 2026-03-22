-- Добавить флаг "объект риэлтора" в таблицу properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_realtor_property boolean NOT NULL DEFAULT false;
