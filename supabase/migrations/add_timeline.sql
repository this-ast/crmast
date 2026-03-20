create table if not exists timeline_events (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,  -- 'client' | 'property'
  entity_id   uuid not null,
  event_type  text not null,
  title       text,
  notes       text,
  event_date  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table timeline_events enable row level security;

drop policy if exists "allow_all_timeline" on timeline_events;
create policy "allow_all_timeline" on timeline_events
  for all using (true) with check (true);

create index if not exists timeline_entity_idx
  on timeline_events(entity_type, entity_id, event_date desc);
