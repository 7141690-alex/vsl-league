-- Run in Supabase SQL editor.
-- Collects detailed website analytics events (page views + sessions).

create table if not exists public.site_visit_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('session_start', 'page_view')),
  visitor_id text not null,
  session_id text not null,
  page_key text not null,
  league text,
  season_id uuid,
  referrer text,
  url text not null,
  path text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_site_visit_events_created_at
  on public.site_visit_events (created_at desc);

create index if not exists idx_site_visit_events_event_type
  on public.site_visit_events (event_type);

create index if not exists idx_site_visit_events_page_key
  on public.site_visit_events (page_key);

create index if not exists idx_site_visit_events_session_id
  on public.site_visit_events (session_id);

create index if not exists idx_site_visit_events_visitor_id
  on public.site_visit_events (visitor_id);

alter table public.site_visit_events enable row level security;

-- Public website can only insert analytics events (anonymous user).
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_visit_events'
      and policyname = 'anon_insert_site_visit_events'
  ) then
    create policy anon_insert_site_visit_events
      on public.site_visit_events
      for insert
      to anon
      with check (true);
  end if;
end $$;

-- Optional read policy for authenticated admins only.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_visit_events'
      and policyname = 'auth_read_site_visit_events'
  ) then
    create policy auth_read_site_visit_events
      on public.site_visit_events
      for select
      to authenticated
      using (true);
  end if;
end $$;
