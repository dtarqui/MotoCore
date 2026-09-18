-- MotoCore — 0003 · Registro de auditoría
-- ============================================================================
--
-- Registro de las **seis acciones críticas** que enumera RF-703: invitación de
-- un miembro, cambio de rol, remoción, modificación de los datos de la
-- organización, desactivación de un taller y baja lógica de un cliente.
--
-- Es de nivel organización —debe poder revisarse de forma consolidada— con
-- referencia opcional al taller cuando la acción ocurrió en uno. Se conserva
-- mientras exista la organización (Requisitos, sección 5).
-- ============================================================================

create table if not exists public.mt_audit_log (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  workshop_id      uuid references public.mt_workshops (id) on delete set null,
  -- `performed_by` va SIN clave ajena a propósito: el registro debe sobrevivir
  -- al borrado de la cuenta que ejecutó la acción. Una auditoría que desaparece
  -- con su autor no es una auditoría.
  performed_by     uuid,
  action           text not null
                     check (action in ('member.invited', 'member.role_changed', 'member.removed',
                                       'organization.updated', 'workshop.deactivated',
                                       'client.deactivated')),
  entity           text not null,
  entity_id        uuid,
  details          jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists mt_audit_log_org_idx on public.mt_audit_log (organization_id, created_at desc);

alter table public.mt_audit_log enable row level security;

-- LA ÚNICA LECTURA DEL ESQUEMA RESERVADA A UN ROL (RF-704).
--
-- En todas las demás tablas basta con ser miembro; aquí hace falta ser
-- propietario. Y no se sostiene solo en la interfaz: la política lo aplica en
-- el motor, de modo que el acceso directo tampoco la eluda — es lo que el caso
-- CP-704.2 comprueba por la vía de base de datos.
drop policy if exists mt_audit_log_select_owner on public.mt_audit_log;
create policy mt_audit_log_select_owner on public.mt_audit_log
  for select using (public.mt_is_org_owner(organization_id));

-- SIN POLÍTICA DE INSERCIÓN, a propósito (RN-15, ADR-008).
--
-- La escritura de auditoría es una de las excepciones privilegiadas: ocurre
-- siempre con la credencial del servidor, que no evalúa políticas. Apoyar una
-- política de inserción en `mt_is_org_member` dejaría que un miembro insertara
-- entradas por acceso directo y falseara el registro, que es justamente lo que
-- RF-703 debe impedir.
--
-- Tampoco hay `update` ni `delete`: el registro es de solo inserción. La
-- ausencia de políticas es la primera de las dos capas que lo hacen inmutable;
-- la segunda son los permisos de la 0004.
