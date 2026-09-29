-- Shelf: personal media library
-- One normalized table for movies, TV, books and games.

create type public.media_type as enum ('movie', 'tv', 'book', 'game');
create type public.library_status as enum ('backlog', 'in_progress', 'completed', 'dropped');

create table public.library_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  media_type      public.media_type not null,
  external_id     text not null,

  -- Minimal snapshot so the library renders without calling external APIs.
  title           text not null,
  subtitle        text,
  artwork_url     text,
  backdrop_url    text,
  release_date    date,

  status          public.library_status not null default 'backlog',
  rating          numeric(2, 1)
                  check (rating is null or (rating between 0.5 and 5 and mod(rating * 2, 1) = 0)),
  review          text check (review is null or char_length(review) <= 20000),
  reviewed_at     timestamptz,
  date_started    timestamptz,
  date_finished   timestamptz,

  -- Reserved for future progress tracking (season/episode, page, hours, percent).
  progress        jsonb,
  -- Small provider-specific extras (genres, platforms, author...).
  metadata        jsonb not null default '{}'::jsonb,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint library_items_unique_per_user unique (user_id, media_type, external_id)
);

create index library_items_user_created_idx  on public.library_items (user_id, created_at desc);
create index library_items_user_status_idx   on public.library_items (user_id, status);
create index library_items_user_finished_idx on public.library_items (user_id, date_finished desc) where date_finished is not null;
create index library_items_user_reviewed_idx on public.library_items (user_id, reviewed_at desc) where review is not null;

-- Keep timestamps and lifecycle dates consistent no matter which client writes.
create or replace function public.library_items_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    if new.status in ('in_progress', 'completed', 'dropped') and new.date_started is null then
      new.date_started := now();
    end if;
    if new.status = 'completed' and new.date_finished is null then
      new.date_finished := now();
    end if;
    if new.status in ('backlog', 'in_progress') then
      new.date_finished := null;
    end if;
    if new.status = 'backlog' then
      new.date_started := null;
    end if;
  end if;

  if tg_op = 'INSERT' or new.review is distinct from old.review then
    new.review := nullif(btrim(new.review), '');
    new.reviewed_at := case when new.review is null then null else now() end;
  end if;

  return new;
end;
$$;

create trigger library_items_before_write
  before insert or update on public.library_items
  for each row execute function public.library_items_before_write();

-- Row Level Security: every row belongs to exactly one user.
alter table public.library_items enable row level security;

create policy "Users read own items"
  on public.library_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert own items"
  on public.library_items for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own items"
  on public.library_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own items"
  on public.library_items for delete to authenticated
  using ((select auth.uid()) = user_id);
