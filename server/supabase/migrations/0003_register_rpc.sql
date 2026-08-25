-- MotoCore — registro atomico de cuenta (RF-101, ADR-007)
--
-- El registro debe crear, en un solo acto: la primera organización, su primera
-- taller y la membresia Owner. Hacerlo en tres llamadas desde la aplicacion
-- deja estados intermedios visibles y obliga a compensar a mano si una falla.
--
-- El cliente de Supabase no admite transacciones multi-sentencia, asi que la
-- operacion vive aqui: una funcion plpgsql es una sola transaccion implicita.
-- Si cualquier paso falla, no queda nada a medias.
--
-- La cuenta en auth.users se crea antes, desde la aplicacion, porque solo la
-- API de administracion de Supabase puede hacerlo. Es el unico paso que queda
-- fuera de la transaccion, y por eso la aplicacion lo revierte si esto falla.

create or replace function public.mt_register_account(
  p_user_id        uuid,
  p_org_name       text,
  p_workshop_name  text
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
  insert into public.mt_organizations (name, owner_id)
  values (p_org_name, p_user_id)
  returning id into v_org_id;

  insert into public.mt_workshops (organization_id, name)
  values (v_org_id, coalesce(nullif(btrim(p_workshop_name), ''), p_org_name))
  returning id into v_workshop_id;

  insert into public.mt_memberships (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'owner');

  return query select v_org_id, v_workshop_id;
end;
$$;

-- Solo la API (service_role) puede registrar cuentas. Exponerla a usuarios
-- autenticados permitiria crear organizaciones a nombre de terceros.
revoke all on function public.mt_register_account(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mt_register_account(uuid, text, text) to service_role;
