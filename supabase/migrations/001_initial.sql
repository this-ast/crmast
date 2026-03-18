-- =============================================
-- CRM Риэлтора — начальная миграция
-- Запустить в Supabase SQL Editor
-- =============================================

-- Чистый старт
drop table if exists properties cascade;
drop table if exists clients cascade;
drop function if exists update_updated_at cascade;

-- =============================================
-- КЛИЕНТЫ
-- =============================================
create table clients (
  id            uuid primary key default gen_random_uuid(),
  client_number serial not null unique,
  name          text not null,
  phone         text not null,
  email         text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================
-- ОБЪЕКТЫ
-- =============================================
create table properties (
  id                 uuid primary key default gen_random_uuid(),
  article            text not null unique,
  type               text not null check (type in ('apartment','house','land','commercial')),
  status             text not null default 'active' check (status in ('active','sold','reserved','withdrawn')),
  price              numeric(15,2) not null,
  area               numeric(10,2) not null,
  rooms              int,
  floor              int,
  total_floors       int,
  view               text,
  address            text not null,
  complex_name       text,
  description        text,
  photos             text[] not null default '{}',
  videos             text[] not null default '{}',
  owner_id           uuid references clients(id) on delete set null,
  area_sotki         numeric(10,2),
  communications     text[],
  cadastral_number   text,
  is_active_business boolean,
  has_wet_points     boolean,
  has_parking        boolean,
  entrance_groups    int,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- =============================================
-- ИНДЕКСЫ
-- =============================================
create index idx_properties_type     on properties(type);
create index idx_properties_status   on properties(status);
create index idx_properties_owner_id on properties(owner_id);
create index idx_clients_number      on clients(client_number);

-- =============================================
-- AUTO updated_at
-- =============================================
create function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger trg_properties_updated_at
  before update on properties
  for each row execute function update_updated_at();

-- =============================================
-- RLS
-- =============================================
alter table clients    enable row level security;
alter table properties enable row level security;

create policy "allow_all_clients"
  on clients for all using (true) with check (true);

create policy "allow_all_properties"
  on properties for all using (true) with check (true);

-- =============================================
-- ТЕСТОВЫЕ ДАННЫЕ
-- =============================================
insert into clients (name, phone, email) values
  ('Иван Петров',    '+79161234501', 'ivan@example.com'),
  ('Мария Сидорова', '+79161234502', null),
  ('Алексей Козлов', '+79161234503', 'alexey@example.com');

insert into properties
  (article, type, status, price, area, rooms, floor, total_floors, address, complex_name, owner_id)
values
  ('APT-001', 'apartment', 'active', 8500000, 52, 2, 7, 16,
   'ул. Ленина, д. 5, кв. 24', 'ЖК Новый Горизонт',
   (select id from clients where name = 'Иван Петров'));

insert into properties
  (article, type, status, price, area, rooms, floor, total_floors, address, owner_id)
values
  ('APT-002', 'apartment', 'reserved', 5200000, 38, 1, 3, 9,
   'пр. Мира, д. 12, кв. 8',
   (select id from clients where name = 'Мария Сидорова'));

insert into properties
  (article, type, status, price, area, address, area_sotki, communications, cadastral_number, owner_id)
values
  ('UCH-001', 'land', 'active', 1800000, 600,
   'Подмосковье, Дмитровский р-н, д. Берёзовка',
   15, array['Электричество', 'Газ'], '50:04:0010203:45',
   (select id from clients where name = 'Алексей Козлов'));

insert into properties
  (article, type, status, price, area, address,
   is_active_business, has_parking, has_wet_points, entrance_groups, owner_id)
values
  ('KOM-001', 'commercial', 'active', 12000000, 120, 'ул. Тверская, д. 18',
   true, true, true, 2,
   (select id from clients where name = 'Иван Петров'));
