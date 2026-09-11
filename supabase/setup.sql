-- Life OS database for Supabase PostgreSQL.
-- Run in the Supabase SQL editor. Use DATABASE_URL for Drizzle on the server.
-- Authentication is handled by Supabase Auth, NOT by the browser database client.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key default gen_random_uuid(), email text unique,
 display_name text not null default '朋友', password_hash text,
 budget text not null default '5000', guest text not null default 'false',
 created_at timestamp not null default now()
);
create table if not exists public.life_sessions (
 id text primary key, user_id uuid not null references public.profiles(id) on delete cascade,
 expires_at timestamp not null
);
-- The stable relational envelope enforces identity, ownership, dates and timestamps.
-- Module-specific data is stored as versionable JSONB, validated by the server field schema.
-- Fitness exercise items are embedded in fitness_sessions.data.exercises for atomic writes.
do $$
declare table_name text;
begin
 foreach table_name in array array['projects','tasks','fitness_sessions','sleep_logs','finance_records','daily_reviews','weekly_reviews','study_entries'] loop
  execute format('create table if not exists public.%I (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, date text not null, data jsonb not null check (jsonb_typeof(data) = ''object''), created_at timestamp not null default now(), updated_at timestamp not null default now())',table_name);
  execute format('create index if not exists %I on public.%I(user_id)',table_name||'_owner_idx',table_name);
 end loop;
 foreach table_name in array array['sleep_logs','daily_reviews','weekly_reviews'] loop
  execute format('create unique index if not exists %I on public.%I(user_id,date)',table_name||'_date_unique',table_name);
 end loop;
end $$;
-- Browser/PostgREST requests use auth.uid(). Server Drizzle transactions set app.user_id
-- only AFTER verifying Supabase's access token with auth.getUser(). Browser roles cannot
-- set this transaction-local database setting through the exposed REST API.
create or replace function public.life_user_id() returns uuid
language sql stable security invoker set search_path = '' as $$
 select coalesce(auth.uid(),nullif(current_setting('app.user_id',true),'')::uuid)
$$;
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
drop policy if exists profile_owner on public.profiles;
create policy profile_owner on public.profiles for all to authenticated
 using (auth.uid() = id) with check (auth.uid() = id);
-- Session hashes and local password hashes must never be browser-accessible.
alter table public.life_sessions enable row level security;
alter table public.life_sessions force row level security;
revoke all on public.life_sessions from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select(id,email,display_name,budget,guest,created_at) on public.profiles to authenticated;
grant update(display_name,budget) on public.profiles to authenticated;
do $$
declare table_name text;
begin
 foreach table_name in array array['projects','tasks','fitness_sessions','sleep_logs','finance_records','daily_reviews','weekly_reviews','study_entries'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('alter table public.%I force row level security',table_name);
  execute format('drop policy if exists owner_isolation on public.%I',table_name);
  execute format('create policy owner_isolation on public.%I for all using (public.life_user_id() = user_id) with check (public.life_user_id() = user_id)',table_name);
  execute format('revoke all on public.%I from anon',table_name);
  execute format('grant select,insert,update,delete on public.%I to authenticated',table_name);
 end loop;
end $$;
-- Do not disable RLS. Server DB credentials remain server-side. Never use service_role
-- or a database password in a NEXT_PUBLIC_* variable.
