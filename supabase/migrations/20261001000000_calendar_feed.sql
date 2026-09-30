-- Shelf: private calendar feed for reminders
-- Calendar apps can't sign in, so each user gets a secret link token instead.

create table public.calendar_feeds (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.calendar_feeds enable row level security;

create policy "Users can read their calendar link"
  on public.calendar_feeds for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their calendar link"
  on public.calendar_feeds for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can reset their calendar link"
  on public.calendar_feeds for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Returns the library rows a calendar feed needs, for whoever owns the token.
-- Security definer so the (signed-out) calendar app can read only this one user's feed.
create or replace function public.calendar_feed(feed_token uuid)
returns setof public.library_items
language sql
stable
security definer
set search_path = ''
as $$
  select li.*
  from public.library_items li
  join public.calendar_feeds f on f.user_id = li.user_id
  where f.token = feed_token
    and li.status in ('backlog', 'in_progress', 'completed')
  order by li.updated_at desc
  limit 1000;
$$;

revoke all on function public.calendar_feed(uuid) from public;
grant execute on function public.calendar_feed(uuid) to anon, authenticated;
