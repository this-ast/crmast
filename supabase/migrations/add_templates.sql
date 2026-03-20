create table if not exists message_templates (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  category   text not null default 'Общее',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table message_templates enable row level security;

drop policy if exists "allow_all_templates" on message_templates;
create policy "allow_all_templates" on message_templates
  for all using (true) with check (true);
