# Life OS

A complete, Chinese-language personal life workspace built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PostgreSQL and Drizzle ORM. Warm ivory / sage UI, responsive navigation, Supabase authentication, real per-user records, rule-based insights and an installable PWA.

## Run locally

Requires Node.js 20.19+ and PostgreSQL.

```sh
npm install
cp .env.example .env
# Configure DATABASE_URL. For the optional isolated demo, set ALLOW_DEMO=true.
npx drizzle-kit push
npx tsx scripts/local-rls.ts
npm run dev
```

The sandbox already provides `DATABASE_URL`. Its preview creates an isolated guest profile and seeded records when neither Supabase variable is set and `ALLOW_DEMO` is not `false`. A random HTTP-only session cookie isolates visitors. This is an explicitly labeled experience space, not an authenticated production account. Registering creates a new, empty personal account; guest records are NOT silently transferred. Local registrations use scrypt password hashes and random server-side sessions stored as SHA-256 hashes.

For production, use Supabase Auth and disable visitor creation. Do not mistake a demo session for a secure production signup flow.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `DATABASE_URL` | Server only | PostgreSQL connection, used exclusively by Drizzle |
| `NEXT_PUBLIC_SUPABASE_URL` | Publishable | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable | Supabase publishable key, not `service_role` |
| `ALLOW_DEMO` | Server only | `false` prevents automatic visitor spaces |

There are no other `NEXT_PUBLIC_*` variables. No secret/service role token is required by the frontend. Never commit `.env` or place a database password in a publishable variable.

## Supabase setup and security

1. Create a Supabase project and enable Email authentication.
2. Set the two publishable environment variables and a **server-side** `DATABASE_URL` pointing to the project's PostgreSQL database (Supavisor session pooler is suitable for IPv4 environments).
3. Run `supabase/setup.sql` in the Supabase SQL editor. It creates the exact relational envelopes used by `src/db/schema.ts`, JSONB payloads, indexes, uniqueness constraints and RLS policies. Use this SQL rather than the local-RLS script for Supabase.
4. Configure Auth → URL Configuration → Site URL to your HTTPS deployment and add your deployment/login URLs to the redirect allowlist. Email confirmation is supported; users follow the email link and return to `/login` to sign in.
5. Deploy with `ALLOW_DEMO=false`. With Supabase configured, unauthenticated app routes redirect to `/login`; API requests validate access tokens using `auth.getUser()`. Refresh tokens renew sessions server-side.
6. Session and refresh cookies are HttpOnly, SameSite=Lax and Secure in production. Logout revokes the Supabase session (or removes the local session hash) and clears cookies. Mutation requests enforce same-origin checks.

### RLS and ownership

All data tables have RLS enabled and forced. Supabase policy ownership is `auth.uid() = user_id` through `life_user_id()`, or `auth.uid() = id` for profiles. Trusted server transactions additionally set `app.user_id` **after** authentication. Every server data query also includes an explicit owner predicate; incoming user IDs are never accepted. Referenced task projects are checked for the same owner. Local sessions and password hashes have no Supabase browser grants.

`DATABASE_URL` is trusted backend infrastructure, typically the Supabase/postgres administrative role; such roles can bypass RLS. Therefore the API's explicit authenticated owner predicates and transaction context are mandatory defense in depth, not an excuse to disable RLS. Do not expose this connection or reuse these routes without their identity checks. For a custom least-privilege connection, grant records access to an application role and separately provision identity/profile administration; the current auth bootstrap expects trusted backend DB access.

## Data model

`profiles`: id, email, display_name, password_hash (local only), budget, guest, created_at.

`life_sessions`: SHA-256 session id, user_id, expiry (local auth only).

Each module has a **separate table**: `projects`, `tasks`, `fitness_sessions`, `sleep_logs`, `finance_records`, `daily_reviews`, `weekly_reviews`, `study_entries`.

The shared relational envelope is `id`, `user_id` (foreign key), `date`, `data` (JSONB), `created_at`, `updated_at`. This is an intentional document-envelope design: relational ownership/indexes and a modular, server-validated payload. It is not the column-per-field sample schema in the product brief. `src/lib/types.ts` defines the payload and `src/lib/config.ts` defines field validation/UI constraints. All database interactions use Drizzle.

- Tasks: title, description, projectId, priority, status, estimated/actual minutes, tags. `date` is due date.
- Projects: description, color, progress, status, phase, next action, startDate. `date` is target date.
- Fitness: workout, duration, cardio, feeling, notes, exercises (name, sets, reps, weight, RIR), embedded atomically in the session.
- Sleep: hours, bedtime, wake, quality, energy, mood, notes.
- Finance: title, amount, expense/income type, category, notes.
- Daily review: wins, problems, gratitude, mood, energy, tomorrow's priorities, self score.
- Weekly review: summary, wins, issues, habits, next focus; date normalized to Monday.
- Study: chapter/topic/type, progress, duration, understanding, missing content/risks, next step.

Unique `(user_id, date)` indexes on sleep, daily and weekly reviews prevent duplicates. Saving the same day/week updates its record. User deletion cascades to records. Project association is validated in the API (JSONB reference, not a SQL foreign key).

## Pages and interactions

- `/` and `/dashboard`: greeting, real task counts, sleep/energy, weekly training, budget, main projects, weekly chart, insights and latest reflection.
- `/tasks`: create/edit/delete, completion toggle, today/week/status filters, priority sort, project association.
- `/projects`: progress, phases, next steps, related tasks and record timestamps.
- `/study`: chapters, experiments, literature, learning topics and mentor feedback.
- `/fitness`: sessions and editable exercise rows with sets/reps/load/RIR.
- `/sleep`: sleep/energy/mood history and weekly summary.
- `/finance`: income and expenses, category chart, category/date filters, budget overview.
- `/journal`, `/review`: daily review history and editing.
- `/weekly`: auto-computed current-week stats and written weekly reviews.
- `/profile`: display name, budget, JSON export, PWA installation instructions, logout.
- `/login`: email signup/login; Supabase confirmation feedback.

Global search (`⌘/Ctrl K`), quick-add modal, mobile bottom navigation, notification insights, loading skeletons, empty states, network errors, retry actions, delete confirmation and success feedback are included. Records persist in PostgreSQL across refreshes. Demo data is seeded once per isolated guest; registered accounts start empty.

Insights use real records: three consecutive short-sleep days, healthy sleep/energy, low weekly task completion, zero workouts, budget threshold and stale project updates. They are rule-based, not a fabricated AI response. No AI API key is needed.

## Project structure

```text
src/
  app/                 App Router pages, metadata and API routes
    api/auth/          Supabase/local authentication
    api/data/          User-scoped Drizzle CRUD
    api/health/        Platform healthcheck
    [section]/         Module routes
    login/
  components/
    dashboard/         Dashboard, task/project rows, charts
    LifeApp.tsx        Workspace shell, loading, search, quick capture
    EntryEditor.tsx    Validated record forms and exercise editor
    ModulePage.tsx     Module views and filters
    ProfilePage.tsx    Settings, export, installation
    AuthForm.tsx       Signup/login
  db/                  Drizzle connection and schema
  lib/                 Types, config, auth, seeds, statistics and insights
  proxy.ts             App route session gate
public/                PWA manifest, service worker, icons, offline screen
supabase/setup.sql     Supabase schema + RLS + grants
scripts/local-rls.ts    Local PostgreSQL RLS initialization
```

## Build and deploy to Vercel

```sh
npx next typegen
npm exec tsc -- --noEmit --pretty false
npm run build
```

1. Push the project to a private Git repository and import it into Vercel.
2. Use the Next.js preset; install command `npm install`, build command `npm run build`.
3. Configure the environment variables above for production and preview as appropriate.
4. Apply `supabase/setup.sql` once before first deployment. Do not run destructive schema syncs on each deployment. Version future migrations with Drizzle Kit and back up production data.
5. Update Supabase site/redirect URLs and verify email confirmation, two independent users and logout.
6. Vercel supplies HTTPS, required for service workers and Secure cookies. Check `/api/health` and install the app.

Never cache `/api/data` at the CDN. The API returns `Cache-Control: no-store`; the service worker does not cache API data or authenticated HTML.

## PWA installation

- iPhone/iPad: open in Safari → Share → Add to Home Screen.
- Android: Chrome menu → Install app / Add to Home screen.
- Desktop Chrome/Edge: browser install icon or Personal Settings → Install Life OS.

Manifest includes 192/512px icons, maskable artwork, standalone mode, theme/background colors and shortcuts. An offline page and static shell assets are cached. Private records are intentionally not cached offline. Existing open forms show an actionable save error while offline; no successful-save message is shown unless the server confirms the write. This is an installable, online-first PWA, not an offline-first sync engine.

## Current scope / follow-up TODOs

- Expand the included Playwright E2E tests and add a production distributed rate limiter. Local login throttling is process-local, not a substitute for upstream protection. Supabase Auth also applies its own rate limits. Run `npx playwright install --with-deps chromium` and `npx playwright test` against a running local-demo server (`TEST_BASE_URL` is optional). Included tests cover task persistence, responsive overflow, signup/login/logout, owner isolation, module CRUD and unique daily records.
- Add password recovery, email-change UI, optional OAuth, account deletion and guest-data import.
- Add a full append-only project activity timeline and multiple milestone entities; currently phase, related tasks and created/updated timestamps are implemented.
- Weekly stats show the current week, not immutable snapshots for every historical review.
- Add recurring tasks, time-zone preferences, budget per category and richer sleep/training comparisons.
- Add encrypted offline storage / queued writes, conflict resolution and push reminders only after privacy and synchronization design.
- For large datasets, add pagination and server aggregation; the personal workspace currently loads all the current user's records.
- Harden JSONB schema versioning, add DB-level field checks/normalized columns when reporting needs grow, and add an exercise catalog.
- Session/guest cleanup should run as a scheduled production job.

No external AI service is used. The application is deployable and functional, while the above items remain explicit future enhancements rather than placeholder buttons.
