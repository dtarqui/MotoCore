-- MotoCore — jerarquia organización -> talleres (ADR-006)
--
-- Añade el segundo nivel del modelo multitenant. La organización (mt_organizations)
-- sigue siendo el UNICO limite de aislamiento; el taller (mt_workshops) indica
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
create table if not exists public.mt_workshops (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  name             text not null,
  address          text,
  phone            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  -- RF-305: la baja es logica; el historial de el taller se conserva.
  unique (organization_id, name)
);
create index if not exists mt_workshops_org_id_idx on public.mt_workshops (organization_id);

-- Asignacion operativa de un miembro a un taller (RF-304). NO otorga ni
-- restringe permisos: los permisos vienen del rol de la membresia (ADR-006).
create table if not exists public.mt_workshop_assignments (
  id             uuid primary key default gen_random_uuid(),
  membership_id  uuid not null references public.mt_memberships (id) on delete cascade,
  workshop_id    uuid not null references public.mt_workshops (id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (membership_id, workshop_id)
);
create index if not exists mt_workshop_assignments_workshop_idx
  on public.mt_workshop_assignments (workshop_id);

-- ------------------------------------------------------------------
-- Helper: la organizacion a la que pertenece un taller.
-- SECURITY DEFINER para que las politicas de mt_workshop_assignments puedan
-- resolver la organizacion sin quedar atrapadas por el RLS de mt_workshops.
-- ------------------------------------------------------------------
create or replace function public.mt_workshop_org(ws uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select w.organization_id from public.mt_workshops w where w.id = ws;
$$;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.mt_workshops            enable row level security;
alter table public.mt_workshop_assignments enable row level security;

-- mt_workshops: cualquier miembro de la organización ve todas sus talleres
-- (el taller no es frontera de seguridad); solo el Owner las administra.
drop policy if exists mt_workshops_select_member on public.mt_workshops;
create policy mt_workshops_select_member on public.mt_workshops
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_workshops_insert_owner on public.mt_workshops;
create policy mt_workshops_insert_owner on public.mt_workshops
  for insert with check (public.mt_is_org_owner(organization_id));

drop policy if exists mt_workshops_update_owner on public.mt_workshops;
create policy mt_workshops_update_owner on public.mt_workshops
  for update using (public.mt_is_org_owner(organization_id));

drop policy if exists mt_workshops_delete_owner on public.mt_workshops;
create policy mt_workshops_delete_owner on public.mt_workshops
  for delete using (public.mt_is_org_owner(organization_id));

-- mt_workshop_assignments: se resuelve la organización a traves de el taller.
drop policy if exists mt_workshop_assignments_select_member on public.mt_workshop_assignments;
create policy mt_workshop_assignments_select_member on public.mt_workshop_assignments
  for select using (public.mt_is_org_member(public.mt_workshop_org(workshop_id)));

drop policy if exists mt_workshop_assignments_insert_owner on public.mt_workshop_assignments;
create policy mt_workshop_assignments_insert_owner on public.mt_workshop_assignments
  for insert with check (public.mt_is_org_owner(public.mt_workshop_org(workshop_id)));

drop policy if exists mt_workshop_assignments_delete_owner on public.mt_workshop_assignments;
create policy mt_workshop_assignments_delete_owner on public.mt_workshop_assignments
  for delete using (public.mt_is_org_owner(public.mt_workshop_org(workshop_id)));
