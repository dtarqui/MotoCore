-- MotoCore — esquema base multitenancy ERP (una cuenta -> varias organizaciones)
-- Ejecutar en Supabase (SQL Editor o `supabase db push`).
--
-- Modelo:
--   auth.users            -> identidad global (gestionada por Supabase Auth)
--   mt_profiles              -> datos de perfil 1:1 con auth.users
--   mt_organizations         -> organización/compania (era "workshop")
--   mt_memberships           -> auth.users <-> mt_organizations (rol por organizacion)
--
-- Aislamiento por tenant: Row Level Security. Un usuario solo ve/gestiona filas
-- de organizaciones donde tiene una membership activa. Las funciones helper son
-- SECURITY DEFINER para evitar recursion de RLS al consultar mt_memberships.

-- ------------------------------------------------------------------
-- Extensiones
-- ------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ------------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------------
create table if not exists public.mt_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null default '',
  first_name   text not null default '',
  last_name    text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create table if not exists public.mt_organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  address      text,
  phone        text,
  email        text,
  owner_id     uuid not null references auth.users (id) on delete restrict,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);
create index if not exists mt_organizations_owner_id_idx on public.mt_organizations (owner_id);

create table if not exists public.mt_memberships (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             text not null default 'receptionist'
                     check (role in ('owner', 'mechanic', 'receptionist')),
  is_active        boolean not null default true,
  joined_at        timestamptz not null default now(),
  updated_at       timestamptz,
  unique (organization_id, user_id)
);
create index if not exists mt_memberships_user_id_idx on public.mt_memberships (user_id);
create index if not exists mt_memberships_org_id_idx on public.mt_memberships (organization_id);

-- ------------------------------------------------------------------
-- Helpers (SECURITY DEFINER para saltar RLS al consultar mt_memberships)
-- ------------------------------------------------------------------
create or replace function public.mt_is_org_member(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.mt_memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.is_active
  );
$$;

create or replace function public.mt_is_org_owner(org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.mt_memberships m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.is_active
      and m.role = 'owner'
  );
$$;

-- ------------------------------------------------------------------
-- Trigger: crear profile al registrarse un usuario (incluye OAuth)
-- ------------------------------------------------------------------
create or replace function public.mt_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mt_profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists mt_on_auth_user_created on auth.users;
create trigger mt_on_auth_user_created
  after insert on auth.users
  for each row execute function public.mt_handle_new_user();

-- ------------------------------------------------------------------
-- RPC: buscar user_id por email (para invitaciones).
-- SECURITY DEFINER + solo ejecutable por service_role (la API la llama
-- con la service key, tras verificar que quien invita es Owner). No se
-- expone a usuarios autenticados para evitar enumeracion de emails.
-- ------------------------------------------------------------------
create or replace function public.mt_get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.mt_get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.mt_get_user_id_by_email(text) to service_role;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.mt_profiles      enable row level security;
alter table public.mt_organizations enable row level security;
alter table public.mt_memberships   enable row level security;

-- mt_profiles: cada quien gestiona el suyo
drop policy if exists mt_profiles_select_own on public.mt_profiles;
create policy mt_profiles_select_own on public.mt_profiles
  for select using (id = auth.uid());

drop policy if exists mt_profiles_upsert_own on public.mt_profiles;
create policy mt_profiles_upsert_own on public.mt_profiles
  for insert with check (id = auth.uid());

drop policy if exists mt_profiles_update_own on public.mt_profiles;
create policy mt_profiles_update_own on public.mt_profiles
  for update using (id = auth.uid());

-- mt_organizations: miembros ven; el owner inserta la suya; owner del taller edita/borra
drop policy if exists mt_organizations_select_member on public.mt_organizations;
create policy mt_organizations_select_member on public.mt_organizations
  for select using (public.mt_is_org_member(id));

drop policy if exists mt_organizations_insert_owner on public.mt_organizations;
create policy mt_organizations_insert_owner on public.mt_organizations
  for insert with check (owner_id = auth.uid());

drop policy if exists mt_organizations_update_owner on public.mt_organizations;
create policy mt_organizations_update_owner on public.mt_organizations
  for update using (public.mt_is_org_owner(id));

drop policy if exists mt_organizations_delete_owner on public.mt_organizations;
create policy mt_organizations_delete_owner on public.mt_organizations
  for delete using (public.mt_is_org_owner(id));

-- mt_memberships: miembros ven las de su org; solo el owner gestiona
drop policy if exists mt_memberships_select_member on public.mt_memberships;
create policy mt_memberships_select_member on public.mt_memberships
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_memberships_insert_owner on public.mt_memberships;
create policy mt_memberships_insert_owner on public.mt_memberships
  for insert with check (public.mt_is_org_owner(organization_id));

drop policy if exists mt_memberships_update_owner on public.mt_memberships;
create policy mt_memberships_update_owner on public.mt_memberships
  for update using (public.mt_is_org_owner(organization_id));

drop policy if exists mt_memberships_delete_owner on public.mt_memberships;
create policy mt_memberships_delete_owner on public.mt_memberships
  for delete using (public.mt_is_org_owner(organization_id));
