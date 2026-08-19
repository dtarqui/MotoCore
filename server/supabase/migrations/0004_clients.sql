-- MotoCore — clientes: entidad de NIVEL EMPRESA (RF-501..505)
--
-- La mitad "organización" del corte vertical. La tabla NO lleva workshop_id: el
-- cliente pertenece a la organización y se atiende en cualquiera de sus talleres.
-- Centralizarlo es justamente el beneficio de administrar varios locales, y
-- fragmentarlo por taller anularia ese beneficio (ADR-006).
--
-- Unicidad por (organization_id, email): dos organizaciones distintas pueden tener
-- al mismo cliente; dos talleres de la MISMA organización, no — es el mismo.

create table if not exists public.clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  first_name       text not null,
  last_name        text not null,
  email            text,
  phone            text,
  document_id      text,
  address          text,
  notes            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index if not exists clients_org_id_idx on public.clients (organization_id);

-- RF-503. Indice unico parcial en vez de UNIQUE: el email es opcional, y un
-- UNIQUE normal permitiria varios NULL pero tambien complicaria la baja
-- logica. Aqui la restriccion aplica solo a los clientes con email.
create unique index if not exists clients_org_email_unique
  on public.clients (organization_id, lower(email))
  where email is not null;

-- ------------------------------------------------------------------
-- Row Level Security — sobre organization_id, el unico criterio del esquema
-- ------------------------------------------------------------------
alter table public.clients enable row level security;

drop policy if exists clients_select_member on public.clients;
create policy clients_select_member on public.clients
  for select using (public.is_org_member(organization_id));

drop policy if exists clients_insert_member on public.clients;
create policy clients_insert_member on public.clients
  for insert with check (public.is_org_member(organization_id));

drop policy if exists clients_update_member on public.clients;
create policy clients_update_member on public.clients
  for update using (public.is_org_member(organization_id));

-- Sin politica de DELETE: la baja es logica (is_active), para no perder el
-- historial del cliente.
