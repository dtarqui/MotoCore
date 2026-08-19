-- MotoCore — alineación de la terminología con el glosario
-- ------------------------------------------------------------------
-- El glosario retiró «empresa» y «sucursal» en favor de **organización** y
-- **taller** (docs/ingenieria/01-glosario.md). Los identificadores del esquema
-- —`organizations`, `workshops`, `organization_id`, `workshop_id`— NO cambian:
-- nombran objetos del esquema y del contrato, y renombrarlos rompería a todos
-- los consumidores sin ganar nada.
--
-- Lo que sí cambia es el **texto que la base de datos genera y que el operador
-- acaba leyendo**: la nota que `transfer_stock` escribe en cada uno de los dos
-- movimientos de una transferencia. Ese texto sale por pantalla en el historial
-- de movimientos, de modo que decía «sucursales» en la interfaz.
--
-- Se corrige aquí y no editando 0005_inventory.sql porque esa migración ya
-- pudo aplicarse: reescribirla dejaría el texto viejo en los entornos donde ya
-- corrió. `create or replace` sí converge en ambos casos.
--
-- Los movimientos YA registrados conservan su nota original: `part_movements`
-- es historial inmutable (solo inserción) y reescribirlo contradiría la
-- garantía de que la existencia puede reconstruirse desde él.

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

  -- Una transferencia nunca cruza el límite de aislamiento.
  if v_from_org <> v_to_org then
    raise exception 'inventory.cross_organization_transfer' using errcode = 'P0001';
  end if;

  perform public.register_part_movement(
    p_from_part_id, 'sale', p_quantity, null, 'transfer-out', 'Transferencia entre talleres', p_performed_by
  );
  perform public.register_part_movement(
    p_to_part_id, 'transfer', p_quantity, null, 'transfer-in', 'Transferencia entre talleres', p_performed_by
  );
end;
$$;

-- `create or replace` restablece los privilegios por defecto: se vuelven a
-- restringir. La función se ejecuta con privilegios del creador y solo la
-- identidad del servidor puede invocarla (ADR-007).
revoke all on function public.transfer_stock(uuid, uuid, integer, uuid) from public, anon, authenticated;
grant execute on function public.transfer_stock(uuid, uuid, integer, uuid) to service_role;
