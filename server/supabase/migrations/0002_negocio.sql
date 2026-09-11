-- MotoCore — 0002 · Corte vertical de negocio
-- ============================================================================
--
-- Las dos entidades que **demuestran el alcance por nivel**, que es el aporte
-- que la tesis somete a prueba:
--
--   * `mt_clients`      — nivel **organización**: visible desde cualquier taller.
--   * `mt_parts`        — nivel **taller**: acotada a su local.
--   * `mt_part_movements` — nivel taller, historial **inmutable**.
--
-- Se eligen estas dos porque no dependen de ningún otro módulo de negocio y
-- porque su asimetría es exactamente la que la arquitectura debe sostener: unas
-- entidades acompañan al cliente y otras a la existencia física de un local.
--
-- Las de nivel taller portan **`organization_id` además de `workshop_id`**: la
-- política se evalúa siempre sobre el mismo criterio, y la pertenencia del
-- taller a la organización activa se valida en la capa de aplicación. Eso
-- mantiene las políticas simples y auditables (ADR-006).
-- ============================================================================


-- ============================================================================
-- 1. Clientes — nivel organización
-- ============================================================================

create table if not exists public.mt_clients (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
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
create index if not exists mt_clients_org_id_idx on public.mt_clients (organization_id);

-- Correo único **por organización** (RF-503): dos organizaciones distintas
-- pueden tener el mismo cliente; dos talleres de la misma, no — es el mismo
-- cliente, y no fragmentarlo es el beneficio de centralizar. Índice parcial y
-- sobre `lower(email)`: el correo es opcional y no distingue mayúsculas.
create unique index if not exists mt_clients_org_email_unique
  on public.mt_clients (organization_id, lower(email))
  where email is not null;


-- ============================================================================
-- 2. Inventario — nivel taller
-- ============================================================================

create table if not exists public.mt_parts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  workshop_id      uuid not null references public.mt_workshops (id) on delete cascade,
  part_number      text not null,
  name             text not null,
  description      text,
  brand            text,
  category         text,
  current_stock    integer not null default 0 check (current_stock >= 0),
  minimum_stock    integer not null default 0 check (minimum_stock >= 0),
  maximum_stock    integer check (maximum_stock is null or maximum_stock >= minimum_stock),
  unit_cost        numeric(12, 2),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz,
  -- Número de parte único **por taller** (RF-603): la misma pieza existe en
  -- varios locales, cada uno con su propia existencia.
  unique (workshop_id, part_number)
);
create index if not exists mt_parts_org_workshop_idx on public.mt_parts (organization_id, workshop_id);

-- Historial inmutable: solo inserción. Nunca se actualiza ni se borra, de modo
-- que la existencia siempre pueda reconstruirse desde sus movimientos.
create table if not exists public.mt_part_movements (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.mt_organizations (id) on delete cascade,
  workshop_id      uuid not null references public.mt_workshops (id) on delete cascade,
  part_id          uuid not null references public.mt_parts (id) on delete cascade,
  movement_type    text not null
                     check (movement_type in ('purchase', 'sale', 'adjustment',
                                              'return', 'transfer', 'damaged')),
  quantity         integer not null check (quantity >= 0),
  previous_stock   integer not null,
  new_stock        integer not null,
  unit_cost        numeric(12, 2),
  total_cost       numeric(12, 2),
  reference        text,
  notes            text,
  performed_by     uuid,
  created_at       timestamptz not null default now()
);
create index if not exists mt_part_movements_part_idx on public.mt_part_movements (part_id, created_at desc);
create index if not exists mt_part_movements_workshop_idx on public.mt_part_movements (workshop_id, created_at desc);


-- ============================================================================
-- 3. Operaciones atómicas
-- ============================================================================
--
-- Viven en el motor y no en la aplicación porque **exigen atomicidad** y el
-- cliente de datos no admite transacciones que abarquen varias sentencias
-- (ADR-007). Sin una transacción, dos ventas simultáneas del mismo repuesto
-- leerían la misma existencia previa y dejarían el stock por encima del real,
-- con dos movimientos que no explican el saldo. El `for update` del §3.1
-- serializa esa concurrencia bloqueando la fila mientras dura la operación.
--
-- Los errores se levantan con el mismo catálogo `modulo.razon` del contrato,
-- para que la respuesta no dependa de en qué capa se aplicó la regla.

create or replace function public.mt_register_part_movement(
  p_part_id        uuid,
  p_movement_type  text,
  p_quantity       integer,
  p_unit_cost      numeric default null,
  p_reference      text default null,
  p_notes          text default null,
  p_performed_by   uuid default null
)
returns public.mt_part_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part      public.mt_parts%rowtype;
  v_previous  integer;
  v_new       integer;
  v_movement  public.mt_part_movements%rowtype;
begin
  select * into v_part from public.mt_parts where id = p_part_id for update;
  if not found then
    raise exception 'inventory.part_not_found' using errcode = 'P0002';
  end if;

  if p_quantity < 0 then
    raise exception 'inventory.invalid_quantity' using errcode = 'P0001';
  end if;

  v_previous := v_part.current_stock;

  -- RF-605: compra, devolución y transferencia de entrada suman; venta y merma
  -- restan; el ajuste **fija** un valor absoluto.
  v_new := case p_movement_type
             when 'purchase'   then v_previous + p_quantity
             when 'return'     then v_previous + p_quantity
             when 'transfer'   then v_previous + p_quantity
             when 'sale'       then v_previous - p_quantity
             when 'damaged'    then v_previous - p_quantity
             when 'adjustment' then p_quantity
             else null
           end;

  if v_new is null then
    raise exception 'inventory.invalid_movement_type' using errcode = 'P0001';
  end if;

  if v_new < 0 then
    raise exception 'inventory.insufficient_stock' using errcode = 'P0001';
  end if;

  insert into public.mt_part_movements (
    organization_id, workshop_id, part_id, movement_type, quantity,
    previous_stock, new_stock, unit_cost, total_cost, reference, notes, performed_by
  ) values (
    v_part.organization_id, v_part.workshop_id, p_part_id, p_movement_type, p_quantity,
    v_previous, v_new, p_unit_cost,
    case when p_unit_cost is null then null else p_unit_cost * p_quantity end,
    p_reference, p_notes, p_performed_by
  )
  returning * into v_movement;

  update public.mt_parts
     set current_stock = v_new,
         updated_at    = now()
   where id = p_part_id;

  return v_movement;
end;
$$;

-- Transferencia entre talleres de la **misma** organización (RF-608): dos
-- movimientos vinculados en una sola transacción. El tipo `transfer` no se
-- acepta directamente en la operación anterior — lo genera esta.
create or replace function public.mt_transfer_stock(
  p_from_part_id  uuid,
  p_to_part_id    uuid,
  p_quantity      integer,
  p_performed_by  uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_org  uuid;
  v_to_org    uuid;
begin
  if p_quantity <= 0 then
    raise exception 'inventory.invalid_quantity' using errcode = 'P0001';
  end if;

  if p_from_part_id = p_to_part_id then
    raise exception 'inventory.same_workshop_transfer' using errcode = 'P0001';
  end if;

  select organization_id into v_from_org from public.mt_parts where id = p_from_part_id;
  select organization_id into v_to_org   from public.mt_parts where id = p_to_part_id;

  if v_from_org is null or v_to_org is null then
    raise exception 'inventory.part_not_found' using errcode = 'P0002';
  end if;

  -- El aislamiento también aquí: no se transfiere fuera de la organización.
  if v_from_org <> v_to_org then
    raise exception 'inventory.cross_organization_transfer' using errcode = 'P0001';
  end if;

  perform public.mt_register_part_movement(
    p_from_part_id, 'sale', p_quantity, null, 'transfer-out', 'Transferencia entre talleres', p_performed_by
  );
  perform public.mt_register_part_movement(
    p_to_part_id, 'transfer', p_quantity, null, 'transfer-in', 'Transferencia entre talleres', p_performed_by
  );
end;
$$;

revoke all on function public.mt_register_part_movement(uuid, text, integer, numeric, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.mt_register_part_movement(uuid, text, integer, numeric, text, text, uuid)
  to service_role;

revoke all on function public.mt_transfer_stock(uuid, uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.mt_transfer_stock(uuid, uuid, integer, uuid) to service_role;


-- ============================================================================
-- 4. Seguridad a nivel de fila
-- ============================================================================
--
-- Sin `delete` en ninguna: los clientes y los repuestos se dan de baja de forma
-- lógica (`is_active`) y el historial de movimientos no se borra nunca. Que la
-- política no exista es la primera de las dos capas que lo impiden; la segunda
-- son los permisos de la 0004.

alter table public.mt_clients        enable row level security;
alter table public.mt_parts          enable row level security;
alter table public.mt_part_movements enable row level security;

drop policy if exists mt_clients_select_member on public.mt_clients;
create policy mt_clients_select_member on public.mt_clients
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_clients_insert_member on public.mt_clients;
create policy mt_clients_insert_member on public.mt_clients
  for insert with check (public.mt_is_org_member(organization_id));

drop policy if exists mt_clients_update_member on public.mt_clients;
create policy mt_clients_update_member on public.mt_clients
  for update using (public.mt_is_org_member(organization_id));

drop policy if exists mt_parts_select_member on public.mt_parts;
create policy mt_parts_select_member on public.mt_parts
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_parts_insert_member on public.mt_parts;
create policy mt_parts_insert_member on public.mt_parts
  for insert with check (public.mt_is_org_member(organization_id));

drop policy if exists mt_parts_update_member on public.mt_parts;
create policy mt_parts_update_member on public.mt_parts
  for update using (public.mt_is_org_member(organization_id));

drop policy if exists mt_part_movements_select_member on public.mt_part_movements;
create policy mt_part_movements_select_member on public.mt_part_movements
  for select using (public.mt_is_org_member(organization_id));

drop policy if exists mt_part_movements_insert_member on public.mt_part_movements;
create policy mt_part_movements_insert_member on public.mt_part_movements
  for insert with check (public.mt_is_org_member(organization_id));
