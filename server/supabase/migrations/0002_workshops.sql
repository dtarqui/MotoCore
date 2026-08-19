-- MotoCore — jerarquia organización -> talleres (ADR-006)
--
-- Añade el segundo nivel del modelo multitenant. La organización (organizations)
-- sigue siendo el UNICO limite de aislamiento; el taller (workshops) indica
-- DONDE ocurre una operacion, no QUIEN puede verla.
--
-- Por eso las politicas de estas tablas se evaluan sobre organization_id, igual
-- que las de nivel organización: un solo criterio en todo el esquema, que es lo que
-- mantiene las politicas simples y auditables (economia del mecanismo).
--
-- Migracion aditiva: no modifica 0001 (RNF-304).

-- ------------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------------
create table if not exists public.workshops (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  address          text,
  phone            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  -- RF-305: la baja es logica; el historial de el taller se conserva.
  unique (organization_id, name)
);
create index if not exists workshops_org_id_idx on public.workshops (organization_id);

-- Asignacion operativa de un miembro a un taller (RF-304). NO otorga ni
-- restringe permisos: los permisos vienen del rol de la membresia (ADR-006).
create table if not exists public.workshop_assignments (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid not null references public.memberships (id) on delete cascade,
  workshop_id    uuid not null references public.workshops (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (membership_id, workshop_id)
);
create index if not exists workshop_assignments_workshop_idx
  on public.workshop_assignments (workshop_id);

-- ------------------------------------------------------------------
-- Helper: la organizacion a la que pertenece un taller.
-- SECURITY DEFINER para que las politicas de workshop_assignments puedan
-- resolver la organizacion sin quedar atrapadas por el RLS de workshops.
-- ------------------------------------------------------------------
create or replace function public.workshop_org(ws uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select w.organization_id from public.workshops w where w.id = ws;
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.workshops            enable row level security;
alter table public.workshop_assignments enable row level security;

-- workshops: cualquier miembro de la organización ve todas sus talleres
-- (el taller no es frontera de seguridad); solo el Owner las administra.
drop policy if exists workshops_select_member on public.workshops;
create policy workshops_select_member on public.workshops
  for select using (public.is_org_member(organization_id));

drop policy if exists workshops_insert_owner on public.workshops;
create policy workshops_insert_owner on public.workshops
  for insert with check (public.is_org_owner(organization_id));

drop policy if exists workshops_update_owner on public.workshops;
create policy workshops_update_owner on public.workshops
  for update using (public.is_org_owner(organization_id));

drop policy if exists workshops_delete_owner on public.workshops;
create policy workshops_delete_owner on public.workshops
  for delete using (public.is_org_owner(organization_id));

-- workshop_assignments: se resuelve la organización a traves de el taller.
drop policy if exists workshop_assignments_select_member on public.workshop_assignments;
create policy workshop_assignments_select_member on public.workshop_assignments
  for select using (public.is_org_member(public.workshop_org(workshop_id)));

drop policy if exists workshop_assignments_insert_owner on public.workshop_assignments;
create policy workshop_assignments_insert_owner on public.workshop_assignments
  for insert with check (public.is_org_owner(public.workshop_org(workshop_id)));

drop policy if exists workshop_assignments_delete_owner on public.workshop_assignments;
create policy workshop_assignments_delete_owner on public.workshop_assignments
  for delete using (public.is_org_owner(public.workshop_org(workshop_id)));
