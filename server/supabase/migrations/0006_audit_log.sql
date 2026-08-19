-- MotoCore — registro de auditoria (RF-703)
--
-- Nivel EMPRESA, con referencia opcional a el taller: la auditoria debe
-- poder revisarse de forma consolidada, sin importar en que local ocurrio.
--
-- Historial inmutable: solo insercion, como part_movements.

create table if not exists public.audit_log (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  workshop_id      uuid references public.workshops (id) on delete set null,
  -- Deliberadamente SIN clave foranea: el registro debe sobrevivir al borrado
  -- de la cuenta que ejecuto la accion. Una FK con cascada borraria justo la
  -- evidencia de lo que hizo alguien antes de irse.
  performed_by     uuid,
  action           text not null,
  entity           text not null,
  entity_id        uuid,
  details          jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists audit_log_org_idx on public.audit_log (organization_id, created_at desc);

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select_member on public.audit_log;
create policy audit_log_select_member on public.audit_log
  for select using (public.is_org_member(organization_id));

drop policy if exists audit_log_insert_member on public.audit_log;
create policy audit_log_insert_member on public.audit_log
  for insert with check (public.is_org_member(organization_id));

-- Sin update ni delete: es lo que hace inmutable el registro.
