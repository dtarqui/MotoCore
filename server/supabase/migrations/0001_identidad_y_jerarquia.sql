-- MotoCore — 0001 · Identidad y jerarquía organizacional
-- ============================================================================
--
-- Cuenta → organización → taller, con las membresías que otorgan el acceso y
-- las políticas que lo hacen cumplir dentro del motor.
--
-- El **límite de aislamiento es uno solo: la organización** (ADR-006). El
-- taller determina *dónde* ocurre una operación, no *quién* puede verla, y por
-- eso toda tabla de negocio —incluidas las de nivel taller— porta
-- `organization_id`: las políticas se evalúan siempre sobre el mismo criterio.
--
-- Todos los objetos llevan el prefijo `mt_` para poder convivir en `public`
-- con otro esquema sin colisionar.
--
-- Orden del archivo: tablas → funciones → disparador → RLS → políticas. No es
-- estético: las políticas invocan las funciones, y las funciones consultan las
-- tablas. Los permisos de tabla se conceden en la 0004.
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()


-- ============================================================================
-- 1. Tablas
-- ============================================================================

-- Perfil, 1:1 con la cuenta de Supabase. Lo crea el disparador del §3. Es
-- identidad, no negocio: no lleva `organization_id` y queda fuera del censo.
create table if not exists public.mt_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null default '',
  first_name   text not null default '',
  last_name    text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

-- La organización es el inquilino. `on delete restrict` sobre `owner_id`: una
-- cuenta propietaria no se borra dejando su organización huérfana.
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

-- La membresía es lo que autoriza: sin una activa no hay acceso. El rol es
-- **de la relación cuenta-organización**, no del usuario: la misma cuenta puede
-- ser propietaria en una organización y mecánica en otra.
create table if not exists public.mt_memberships (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  role             text not null default 'receptionist'
                     check (role in ('owner', 'mechanic', 'receptionist')),
  is_active        boolean not null default true,
  joined_at        timestamptz not null default now(),
  updated_at       timestamptz,
  unique (organization_id, user_id),
  -- Destino de la clave ajena compuesta de `mt_workshop_assignments` (§1): es
  -- lo que impide asignar a un taller la membresía de OTRA organización.
  unique (id, organization_id)
);

-- ÍNDICES DE mt_memberships — leer antes de añadir uno.
--
-- La restricción `unique (organization_id, user_id)` de arriba **ya crea** un
-- índice B-tree sobre esas dos columnas en ese orden. Ese índice es el que
-- resuelve la comprobación de membresía, que es la consulta más ejecutada del
-- sistema: la evalúan las funciones del §2 en toda política, sobre cada fila y
-- en cada petición. No hace falta declarar un compuesto, y un índice sobre
-- `organization_id` a secas sería un prefijo del mismo: redundante.
--
-- `user_id` sí necesita el suyo: es la **segunda** columna de esa clave, y un
-- B-tree no se recorre por el sufijo. Lo usa «las organizaciones de esta
-- cuenta» (RF-202).
create index if not exists mt_memberships_user_id_idx on public.mt_memberships (user_id);

-- Un solo propietario activo por organización (RF-402, RF-405). La regla vive
-- también en la capa de aplicación, pero confiarla solo a ella la perdería
-- entera con un descuido en una consulta: es la defensa en profundidad de
-- ADR-002 aplicada a una regla de negocio. Índice y no disparador porque
-- **declara** la restricción en lugar de esconderla en código imperativo, y el
-- motor la hace cumplir incluso ante inserciones concurrentes.
--
-- El predicado incluye `is_active` a propósito: lo único que debe ser único es
-- el propietario **vigente**, de modo que un eventual traspaso de propiedad no
-- chocaría con la membresía histórica.
create unique index if not exists mt_memberships_single_owner_idx
  on public.mt_memberships (organization_id)
  where role = 'owner' and is_active;

-- El taller: local físico dentro de la organización. No es unidad de
-- aislamiento (ADR-006).
create table if not exists public.mt_workshops (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  name             text not null,
  address          text,
  phone            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  unique (organization_id, name),
  -- Destino de las claves ajenas compuestas de las tablas de nivel taller.
  unique (id, organization_id)
);
create index if not exists mt_workshops_org_id_idx on public.mt_workshops (organization_id);

-- Asignación operativa de un miembro a un taller (RF-304). **No otorga ni
-- restringe permisos**: los permisos vienen del rol de la membresía (ADR-006).
--
-- Porta `organization_id` como toda tabla de negocio (Modelo de datos,
-- principio rector). Es redundante en términos de integridad —membresía y
-- taller ya pertenecen a la organización— y deliberadamente no lo es en
-- términos de aislamiento: sin ella, la política tendría que resolver el
-- inquilino navegando hasta `mt_workshops`, con una función auxiliar más.
--
-- Esa redundancia se hace **consistente** con las dos claves ajenas
-- compuestas: el motor rechaza una fila cuya membresía o cuyo taller sean de
-- otra organización, aunque llegue por acceso directo.
create table if not exists public.mt_workshop_assignments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  membership_id    uuid not null,
  workshop_id      uuid not null,
  created_at       timestamptz not null default now(),
  unique (membership_id, workshop_id),
  foreign key (membership_id, organization_id)
    references public.mt_memberships (id, organization_id) on delete cascade,
  foreign key (workshop_id, organization_id)
    references public.mt_workshops (id, organization_id) on delete cascade
);
create index if not exists mt_workshop_assignments_workshop_idx
  on public.mt_workshop_assignments (workshop_id);


-- ============================================================================
-- 2. Funciones auxiliares de las políticas
-- ============================================================================
--
-- `security definer` para evitar recursión: consultan `mt_memberships`, que
-- está protegida por políticas que a su vez las invocan.

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

-- Las políticas se evalúan con los privilegios de quien consulta, de modo que
-- `authenticated` necesita ejecutarlas. `anon` no: no tiene permisos sobre
-- ninguna tabla (0004) y nunca llega a evaluar una política.
revoke all on function public.mt_is_org_member(uuid) from public, anon;
revoke all on function public.mt_is_org_owner(uuid)  from public, anon;
grant execute on function public.mt_is_org_member(uuid) to authenticated;
grant execute on function public.mt_is_org_owner(uuid)  to authenticated;


-- ============================================================================
-- 3. Alta de cuenta y de organización
-- ============================================================================

-- El perfil se crea por disparador, no desde la aplicación: así existe siempre,
-- venga la cuenta del registro propio o de cualquier otra vía de Supabase Auth.
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

-- El disparador no necesita que nadie pueda invocar la función a mano.
revoke all on function public.mt_handle_new_user() from public, anon, authenticated;

-- Organización y membresía propietaria —y, en el registro, el primer taller—,
-- o nada (RF-101, RF-201, ADR-007).
--
-- Una sola función para las dos vías porque es la misma operación: la creación
-- de una organización exige escribir la membresía propietaria, que ninguna
-- política puede autorizar todavía —el solicitante aún no es miembro— (ADR-008,
-- excepción 3). Sin transacción, una interrupción entre los pasos dejaría una
-- organización sin propietario, y en un entorno de funciones efímeras el
-- proceso puede terminar antes de compensar.
--
-- `p_workshop_name` nulo: la organización se crea sin taller (RF-201). El
-- registro lo pasa siempre, porque la cuenta nueva debe poder operar sin
-- configuración adicional (HU-01).
create or replace function public.mt_create_organization(
  p_owner_id       uuid,
  p_name           text,
  p_workshop_name  text default null,
  p_description    text default null,
  p_address        text default null,
  p_phone          text default null,
  p_email          text default null
)
returns table (
  organization_id  uuid,
  workshop_id      uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id       uuid;
  v_workshop_id  uuid;
begin
  insert into public.mt_organizations (name, description, address, phone, email, owner_id)
  values (p_name, p_description, p_address, p_phone, p_email, p_owner_id)
  returning id into v_org_id;

  insert into public.mt_memberships (organization_id, user_id, role)
  values (v_org_id, p_owner_id, 'owner');

  if nullif(btrim(p_workshop_name), '') is not null then
    insert into public.mt_workshops (organization_id, name)
    values (v_org_id, btrim(p_workshop_name))
    returning id into v_workshop_id;
  end if;

  return query select v_org_id, v_workshop_id;
end;
$$;

-- Búsqueda de cuenta por correo, necesaria para invitar. Reservada al servidor
-- para no ofrecer un mecanismo de enumeración de cuentas (RNF-106).
create or replace function public.mt_get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
stable
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- Las funciones privilegiadas se conceden **solo** a la identidad del servidor,
-- nunca a usuarios autenticados (ADR-007).
revoke all on function public.mt_get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.mt_get_user_id_by_email(text) to service_role;

revoke all on function public.mt_create_organization(uuid, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.mt_create_organization(uuid, text, text, text, text, text, text)
  to service_role;


-- ============================================================================
-- 4. Seguridad a nivel de fila
-- ============================================================================
--
-- Ninguna tabla de este archivo tiene política de `delete` salvo las
-- asignaciones: organizaciones, talleres y membresías se dan de baja de forma
-- lógica. Que la política no exista es la primera de las dos capas que lo
-- impiden; la segunda son los permisos de la 0004.

alter table public.mt_profiles             enable row level security;
alter table public.mt_organizations        enable row level security;
alter table public.mt_memberships          enable row level security;
alter table public.mt_workshops            enable row level security;
alter table public.mt_workshop_assignments enable row level security;

-- mt_profiles: cada cuenta ve y edita el suyo. Lo crea el disparador, de modo
-- que nadie necesita insertarlo.
drop policy if exists mt_profiles_select_own on public.mt_profiles;
create policy mt_profiles_select_own on public.mt_profiles
  for select using (id = auth.uid());

drop policy if exists mt_profiles_update_own on public.mt_profiles;
create policy mt_profiles_update_own on public.mt_profiles
  for update using (id = auth.uid());

-- mt_organizations: la lee quien tiene membresía activa (RF-202); la modifica
-- el owner (RF-204). No hay política de inserción: toda organización nace de
-- `mt_create_organization`, con su membresía propietaria en la misma
-- transacción.
drop policy if exists mt_organizations_select_member on public.mt_organizations;
create policy mt_organizations_select_member on public.mt_organizations
  for select using (public.mt_is_org_member(id));

drop policy if exists mt_organizations_update_owner on public.mt_organizations;
create policy mt_organizations_update_owner on public.mt_organizations
  for update using (public.mt_is_org_owner(id));

-- mt_memberships: el listado lo lee cualquier miembro (RF-407); el alta, el
-- cambio de rol y la baja son administrativos.
drop policy if exists mt_memberships_select_member on public.mt_memberships;
create policy mt_memberships_select_member on public.mt_memberships
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_memberships_insert_owner on public.mt_memberships;
create policy mt_memberships_insert_owner on public.mt_memberships
  for insert with check (public.mt_is_org_owner(organization_id));

drop policy if exists mt_memberships_update_owner on public.mt_memberships;
create policy mt_memberships_update_owner on public.mt_memberships
  for update using (public.mt_is_org_owner(organization_id));

-- mt_workshops: lo lee cualquier miembro (RF-302); lo administra el owner.
drop policy if exists mt_workshops_select_member on public.mt_workshops;
create policy mt_workshops_select_member on public.mt_workshops
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_workshops_insert_owner on public.mt_workshops;
create policy mt_workshops_insert_owner on public.mt_workshops
  for insert with check (public.mt_is_org_owner(organization_id));

drop policy if exists mt_workshops_update_owner on public.mt_workshops;
create policy mt_workshops_update_owner on public.mt_workshops
  for update using (public.mt_is_org_owner(organization_id));

-- mt_workshop_assignments: el mismo criterio que el resto, sobre su propio
-- `organization_id`. La asignación es el único vínculo que se retira de verdad.
drop policy if exists mt_workshop_assignments_select_member on public.mt_workshop_assignments;
create policy mt_workshop_assignments_select_member on public.mt_workshop_assignments
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_workshop_assignments_insert_owner on public.mt_workshop_assignments;
create policy mt_workshop_assignments_insert_owner on public.mt_workshop_assignments
  for insert with check (public.mt_is_org_owner(organization_id));

drop policy if exists mt_workshop_assignments_delete_owner on public.mt_workshop_assignments;
create policy mt_workshop_assignments_delete_owner on public.mt_workshop_assignments
  for delete using (public.mt_is_org_owner(organization_id));
