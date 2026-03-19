-- ================================================
-- Таблица ЖК (Жилые комплексы)
-- Таблица настроек агента (для PDF)
-- Запустить в Supabase SQL Editor
-- ================================================

-- Таблица ЖК
create table if not exists complexes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  developer           text,
  completion_date     text,
  purchase_conditions text,
  characteristics     jsonb not null default '{}',
  developer_phones    text[] not null default '{}',
  manager_names       text[] not null default '{}',
  manager_phones      text[] not null default '{}',
  photos              text[] not null default '{}',
  documents           jsonb not null default '[]',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Привязка объекта к ЖК
alter table properties
  add column if not exists complex_id uuid references complexes(id) on delete set null;

create index if not exists idx_properties_complex_id on properties(complex_id);

-- Таблица настроек агента (одна строка)
create table if not exists agent_settings (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  agency_name text,
  instagram   text,
  telegram    text,
  whatsapp    text,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto updated_at для новых таблиц
drop trigger if exists trg_complexes_updated_at      on complexes;
drop trigger if exists trg_agent_settings_updated_at on agent_settings;

create trigger trg_complexes_updated_at
  before update on complexes
  for each row execute function update_updated_at();

create trigger trg_agent_settings_updated_at
  before update on agent_settings
  for each row execute function update_updated_at();

-- RLS
alter table complexes      enable row level security;
alter table agent_settings enable row level security;

drop policy if exists allow_all_complexes       on complexes;
drop policy if exists allow_all_agent_settings  on agent_settings;

create policy allow_all_complexes       on complexes      for all using (true) with check (true);
create policy allow_all_agent_settings  on agent_settings for all using (true) with check (true);

-- Storage bucket для фото и документов ЖК (если не создан)
-- Создать вручную в Supabase Storage: bucket "complexes" (public)
