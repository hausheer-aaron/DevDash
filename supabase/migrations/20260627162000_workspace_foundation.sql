-- DevDash workspace foundation.
-- Safe to run via Supabase SQL Editor or Supabase CLI.
-- This migration intentionally does not create project/task/note tables.

create extension if not exists pgcrypto;

do $$
begin
  create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspace_members_user_id on public.workspace_members(user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Members can read their workspaces" on public.workspaces;
drop policy if exists "Authenticated users can create owned workspaces" on public.workspaces;
drop policy if exists "Owners and admins can manage workspace settings" on public.workspaces;
drop policy if exists "Members can read membership data for their workspace" on public.workspace_members;
drop policy if exists "Owners and admins can manage workspace members" on public.workspace_members;
drop policy if exists "Users can create their initial owner membership" on public.workspace_members;

create policy "Users can read their own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "Users can create their own profile"
on public.profiles
for insert
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Members can read their workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

create policy "Authenticated users can create owned workspaces"
on public.workspaces
for insert
with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Owners and admins can manage workspace settings"
on public.workspaces
for update
using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

create policy "Members can read membership data for their workspace"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

create policy "Owners and admins can manage workspace members"
on public.workspace_members
for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy "Users can create their initial owner membership"
on public.workspace_members
for insert
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and role = 'owner'
  and public.is_workspace_owner(workspace_id)
);
