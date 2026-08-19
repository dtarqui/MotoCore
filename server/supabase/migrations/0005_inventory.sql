-- MotoCore — inventario: entidad de NIVEL SUCURSAL (RF-601..608)
--
-- La mitad "taller" del corte vertical. Cada local tiene existencias fisicas
-- propias, asi que estas tablas llevan workshop_id ADEMAS de organization_id.
--
-- Punto clave del diseño (ADR-006): las politicas RLS se evaluan sobre
-- organization_id, NO sobre workshop_id. La pertenencia de el taller a la
-- organización activa la valida la aplicacion. Asi todo el esquema conserva un solo
-- criterio de aislamiento y las politicas siguen siendo inspeccionables.

-- ------------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------------
create table if not exists public.parts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  workshop_id      uuid not null references public.workshops (id) on delete cascade,
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
  -- RF-603: el numero de parte es unico POR SUCURSAL. La misma pieza puede
  -- existir en varios locales, cada uno con su propia existencia.
  unique (workshop_id, part_number)
);
create index if not exists parts_org_workshop_idx on public.parts (organization_id, workshop_id);

-- RF-604: historial inmutable. Solo se inserta; nunca se actualiza ni se borra.
create table if not exists public.part_movements (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  workshop_id      uuid not null references public.workshops (id) on delete cascade,
  part_id          uuid not null references public.parts (id) on delete cascade,
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
  -- Sin FK: el movimiento debe sobrevivir al borrado de la cuenta que lo hizo.
  performed_by     uuid,
  created_at       timestamptz not null default now()
);
create index if not exists part_movements_part_idx on public.part_movements (part_id, created_at desc);
create index if not exists part_movements_workshop_idx on public.part_movements (workshop_id, created_at desc);

-- ------------------------------------------------------------------
-- Movimiento de existencias — atomico (RF-604, RF-605, RF-606; ADR-007)
--
-- La insercion del movimiento y la actualizacion de la existencia deben
-- ocurrir juntas o no ocurrir: si se hicieran en dos llamadas, una caida
-- entre ambas dejaria el stock desalineado de su historial, y el historial es
-- justamente lo que deberia permitir reconstruirlo.
--
-- Aritmetica (RF-605): purchase/return/transfer suman, sale/damaged restan, y
-- adjustment FIJA un valor absoluto — no suma ni resta.
-- ------------------------------------------------------------------
create or replace function public.register_part_movement(
  p_part_id        uuid,
  p_movement_type  text,
  p_quantity       integer,
  p_unit_cost      numeric default null,
  p_reference      text default null,
  p_notes          text default null,
  p_performed_by   uuid default null
)
returns public.part_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_part      public.parts%rowtype;
  v_previous  integer;
  v_new       integer;
  v_movement  public.part_movements%rowtype;
begin
  -- FOR UPDATE serializa los movimientos concurrentes sobre el mismo repuesto:
  -- sin el bloqueo, dos ventas simultaneas podrian leer la misma existencia
  -- previa y dejar el stock por encima de lo real.
  select * into v_part from public.parts where id = p_part_id for update;

  if not found then
    raise exception 'inventory.part_not_found' using errcode = 'P0002';
  end if;

  if p_quantity < 0 then
    raise exception 'inventory.invalid_quantity' using errcode = 'P0001';
  end if;

  v_previous := v_part.current_stock;

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

  -- RF-606: la operacion se rechaza entera; no se altera el stock.
  if v_new < 0 then
    raise exception 'inventory.insufficient_stock' using errcode = 'P0001';
  end if;

  insert into public.part_movements (
    organization_id, workshop_id, part_id, movement_type, quantity,
    previous_stock, new_stock, unit_cost, total_cost, reference, notes, performed_by
  ) values (
    v_part.organization_id, v_part.workshop_id, p_part_id, p_movement_type, p_quantity,
    v_previous, v_new, p_unit_cost,
    case when p_unit_cost is null then null else p_unit_cost * p_quantity end,
    p_reference, p_notes, p_performed_by
  )
  returning * into v_movement;

  update public.parts
     set current_stock = v_new,
         updated_at    = now()
   where id = p_part_id;

  return v_movement;
end;
$$;

-- ------------------------------------------------------------------
-- Transferencia entre talleres (RF-608)
-- Dos movimientos vinculados en la misma transaccion, ambos dentro de la
-- MISMA organización: una transferencia nunca cruza el limite de aislamiento.
-- ------------------------------------------------------------------
create or replace function public.transfer_stock(
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

  select organization_id into v_from_org from public.parts where id = p_from_part_id;
  select organization_id into v_to_org   from public.parts where id = p_to_part_id;

  if v_from_org is null or v_to_org is null then
    raise exception 'inventory.part_not_found' using errcode = 'P0002';
  end if;

  if v_from_org <> v_to_org then
    raise exception 'inventory.cross_organization_transfer' using errcode = 'P0001';
  end if;

  perform public.register_part_movement(
    p_from_part_id, 'sale', p_quantity, null, 'transfer-out', 'Transferencia entre sucursales', p_performed_by
  );
  perform public.register_part_movement(
    p_to_part_id, 'transfer', p_quantity, null, 'transfer-in', 'Transferencia entre sucursales', p_performed_by
  );
end;
$$;

revoke all on function public.register_part_movement(uuid, text, integer, numeric, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.register_part_movement(uuid, text, integer, numeric, text, text, uuid)
  to service_role;

revoke all on function public.transfer_stock(uuid, uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.transfer_stock(uuid, uuid, integer, uuid) to service_role;

-- ------------------------------------------------------------------
-- Row Level Security — sobre organization_id (ADR-006)
-- ------------------------------------------------------------------
alter table public.parts          enable row level security;
alter table public.part_movements enable row level security;

drop policy if exists parts_select_member on public.parts;
create policy parts_select_member on public.parts
  for select using (public.is_org_member(organization_id));

drop policy if exists parts_insert_member on public.parts;
create policy parts_insert_member on public.parts
  for insert with check (public.is_org_member(organization_id));

drop policy if exists parts_update_member on public.parts;
create policy parts_update_member on public.parts
  for update using (public.is_org_member(organization_id));

-- Movimientos: se leen e insertan, nunca se modifican ni se borran. La
-- ausencia de politicas de update y delete es lo que hace inmutable la tabla.
drop policy if exists part_movements_select_member on public.part_movements;
create policy part_movements_select_member on public.part_movements
  for select using (public.is_org_member(organization_id));

drop policy if exists part_movements_insert_member on public.part_movements;
create policy part_movements_insert_member on public.part_movements
  for insert with check (public.is_org_member(organization_id));
