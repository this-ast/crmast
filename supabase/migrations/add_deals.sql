-- Минимальная миграция без зависимостей от других функций/триггеров

create table if not exists deals (
  id               uuid primary key default gen_random_uuid(),
  deal_number      serial,
  title            text,
  deal_date        date,
  buyer_id         uuid,
  seller_id        uuid,
  property_id      uuid,
  payment_method   text,
  deal_price       bigint,
  commission       bigint,
  commission_split text,
  status           text not null default 'active',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RLS
alter table deals enable row level security;

drop policy if exists "allow_all_deals" on deals;
create policy "allow_all_deals" on deals
  for all using (true) with check (true);
