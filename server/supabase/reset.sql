-- MotoCore · LIMPIEZA DE LA BASE
-- ============================================================================
--
-- ⚠  DESTRUCTIVO E IRREVERSIBLE para los datos de MotoCore.
--
-- Esto NO es una migracion, y por eso no vive en `migrations/`: si estuviera
-- ahi, `supabase db push` lo aplicaria y vaciaria la base en cada despliegue.
--
-- Borra **solo lo de MotoCore**, en sus dos generaciones de nombres:
--
--   * las nueve tablas, con prefijo `mt_` y sin el —el esquema anterior al
--     prefijo—, con todo lo que dependa de ellas;
--   * sus ocho funciones;
--   * su disparador sobre `auth.users`;
--   * las cuentas de `auth.users` que tenian perfil en MotoCore.
--
-- **No toca nada mas.** Ni otros esquemas, ni las tablas de `public` ajenas a
-- MotoCore, ni `storage`, ni `realtime`, ni la configuracion del proyecto:
-- las claves de API y la URL siguen siendo las mismas, de modo que el `.env`
-- no cambia. Ese acotamiento es el que hace viable el prefijo `mt_`: MotoCore
-- puede convivir en `public` con otro sistema sin pisarlo.
--
-- USO: pegar entero en el SQL Editor y ejecutar UNA vez. Despues aplicar
-- `migrations/0001…0011` en orden y comprobar con `verify.sql`.
--
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Recordar que cuentas son de MotoCore, antes de perder su perfil
-- ----------------------------------------------------------------------------
-- La pertenencia se deduce de la tabla de perfiles, no del dominio del correo:
-- deducirla del correo daria por buena cualquier cuenta que alguien registre
-- manana con otro dominio, y borraria de mas.
create temp table mt_cuentas_a_borrar (id uuid primary key);

do $$
begin
  if to_regclass('public.mt_profiles') is not null then
    insert into mt_cuentas_a_borrar select id from public.mt_profiles
    on conflict do nothing;
  end if;
  if to_regclass('public.profiles') is not null then
    insert into mt_cuentas_a_borrar select id from public.profiles
    on conflict do nothing;
  end if;
end $$;


-- ----------------------------------------------------------------------------
-- 2. El disparador que MotoCore instala fuera de `public`
-- ----------------------------------------------------------------------------
-- `auth.users` es de Supabase y la comparte todo el proyecto: su disparador se
-- retira por nombre, nunca borrando la tabla.
drop trigger if exists mt_on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created    on auth.users;


-- ----------------------------------------------------------------------------
-- 3. Las funciones
-- ----------------------------------------------------------------------------
-- Se recorren por nombre en lugar de escribir cada `drop function` con su
-- firma: una firma que cambie dejaria la funcion viva y el `drop` silenciado.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (array[
        'mt_is_org_member','mt_is_org_owner','mt_workshop_org','mt_handle_new_user',
        'mt_get_user_id_by_email','mt_register_account','mt_register_part_movement',
        'mt_transfer_stock',
        'is_org_member','is_org_owner','workshop_org','handle_new_user',
        'get_user_id_by_email','register_account','register_part_movement',
        'transfer_stock'])
  loop
    execute format('drop function if exists %s cascade', r.firma);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 4. Las tablas
-- ----------------------------------------------------------------------------
-- `cascade` arrastra indices, politicas y claves ajenas. Se nombran una a una
-- —no se borra el esquema— para no llevarse por delante lo que no es nuestro.
drop table if exists
  public.mt_audit_log,
  public.mt_part_movements,
  public.mt_parts,
  public.mt_clients,
  public.mt_workshop_assignments,
  public.mt_workshops,
  public.mt_memberships,
  public.mt_organizations,
  public.mt_profiles,
  public.audit_log,
  public.part_movements,
  public.parts,
  public.clients,
  public.workshop_assignments,
  public.workshops,
  public.memberships,
  public.organizations,
  public.profiles
cascade;


-- ----------------------------------------------------------------------------
-- 5. Las cuentas
-- ----------------------------------------------------------------------------
-- Va DESPUES del paso 4, y el orden no es casual: mientras exista la tabla de
-- organizaciones, su clave ajena `owner_id … on delete restrict` **bloquea**
-- el borrado de cualquier usuario que sea propietario de una. Intentarlo antes
-- falla con un error de integridad referencial.
delete from auth.users u
where exists (select 1 from mt_cuentas_a_borrar b where b.id = u.id);

drop table mt_cuentas_a_borrar;
