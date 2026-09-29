# Shelf

A personal, artwork-first tracker for movies, TV, books and games.
Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Motion · deployed on Vercel.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in (see below).
3. Create the database: open the Supabase SQL editor and run
   [`supabase/migrations/20260929000000_library.sql`](supabase/migrations/20260929000000_library.sql)
   (or `supabase db push` with the Supabase CLI).
4. Supabase → Authentication → URL Configuration:
   - **Site URL**: your production URL
   - **Redirect URLs**: `http://localhost:3000/**` and `https://*-<your-vercel-team>.vercel.app/**`
5. `npm run dev`

Without Supabase keys the app runs as a read-only **preview** with sample content, so every
Vercel preview deploy stays viewable. Without TMDB/IGDB keys, those rows and search groups are
simply hidden.

## Environment variables

| Variable | Where it's used | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server (safe to expose; RLS protects data) | Supabase → Project Settings → API keys |
| `TMDB_API_KEY` | **server only** | themoviedb.org → Settings → API (Read Access Token or v3 key) |
| `IGDB_CLIENT_ID` | **server only** | dev.twitch.tv/console → register an application |
| `IGDB_CLIENT_SECRET` | **server only** | same app → "New Secret" |
| `OPENLIBRARY_CONTACT` | server only, optional | your email/URL for Open Library's User-Agent |
| `NEXT_PUBLIC_SITE_URL` | server, optional | your production URL, for auth email links |

## Architecture

```
supabase/migrations/        SQL schema, trigger, Row Level Security
src/proxy.ts                Session refresh + route protection (Next 16 "proxy", formerly middleware)
src/app/
  (app)/                    Signed-in shell: sidebar (desktop) + floating tab bar (mobile)
    page.tsx                Home — library rows first, discovery rows stream in after
    library/                Filterable, sortable artwork grid
    search/                 Unified search (debounced, grouped, per-provider fault tolerant)
    movie|tv|book|game/[id] Detail pages (share components/detail/detail-page.tsx)
    profile/                Profile, stats, reviews journal
  (auth)/login/             Email + password, or magic link
  auth/callback/            Magic-link / confirmation handler
  api/search/               Server-side search endpoint (keeps API keys off the client)
src/lib/
  providers/                tmdb.ts · openlibrary.ts · igdb.ts → normalized MediaSearchResult / MediaDetail
  library/                  queries (server), actions (server actions), selectors (pure sorting/sections/stats)
  media/                    Shared types, status labels, formatting, card mapping
  supabase/                 Server + proxy clients
  image-loader.ts           Serves artwork at the right size straight from each provider's CDN
src/components/             ui/ · media/ · library/ · nav/ · detail/ · search/ · home/ · profile/
```

- **One table** (`library_items`) for all four media types, unique per user + type + external ID.
  A small snapshot (title, artwork, release date, a few metadata keys) is stored so the library
  never depends on external APIs being up; full details are fetched (and cached) on demand.
- **Statuses** are stored as `backlog | in_progress | completed | dropped` and labelled per type in the UI.
- **Dates** (`date_started`, `date_finished`, `reviewed_at`) are maintained by a database trigger.
- **Caching**: provider responses use the Next.js data cache (search 1h, discovery 6–12h, details 12–24h).
- **Images** use `next/image` with a custom loader mapped onto TMDB / Open Library / IGDB sizes —
  no Vercel image-optimization usage.

Attribution for TMDB, IGDB and Open Library lives on the Profile screen.
