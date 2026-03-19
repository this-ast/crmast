-- Добавить поле тип клиента
alter table clients
  add column if not exists client_type text;
