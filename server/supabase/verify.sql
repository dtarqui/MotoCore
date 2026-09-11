-- MotoCore · COMPROBACION DEL ESQUEMA
-- ============================================================================
--
-- Solo lectura: no modifica nada. Se ejecuta en el SQL Editor **despues** de
-- aplicar `migrations/0001…0004` y devuelve una fila por comprobacion.
--
-- Todos los objetos de MotoCore llevan el prefijo `mt_`, de modo que estas
-- consultas se acotan a el y no dependen de que `public` contenga o no otras
-- tablas: la decima fila lo hace explicito.
--
-- Para que la base sirva como entorno de validacion, las once filas deben
-- decir `OK`. Las tres primeras son las que sostienen el objetivo 3: sin las
-- siete tablas de negocio con RLS activo no hay aislamiento que medir
-- (RNF-101, CP-N101), y sin la politica de auditoria reservada al Owner el
-- caso CP-704.2 no puede pasar.
--
-- ============================================================================

with tablas as (
  select c.relname, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'mt\_%'
),
negocio (nombre) as (
  values ('mt_workshops'), ('mt_memberships'), ('mt_workshop_assignments'),
         ('mt_clients'), ('mt_parts'), ('mt_part_movements'), ('mt_audit_log')
),
esperadas (nombre) as (
  values ('mt_is_org_member'), ('mt_is_org_owner'), ('mt_workshop_org'),
         ('mt_handle_new_user'), ('mt_get_user_id_by_email'),
         ('mt_register_account'), ('mt_register_part_movement'),
         ('mt_transfer_stock')
)
select * from (

  select 1 as orden,
         'Tablas mt_ en public' as comprobacion,
         '9' as esperado,
         count(*)::text as obtenido,
         case when count(*) = 9 then 'OK' else 'REVISAR' end as estado
  from tablas

  union all
  select 2,
         'Tablas de negocio con RLS activo',
         '7',
         count(*)::text,
         case when count(*) = 7 then 'OK' else 'FALTA' end
  from tablas t
  join negocio n on n.nombre = t.relname
  where t.relrowsecurity

  union all
  select 3,
         'Lectura de mt_audit_log reservada al Owner',
         'mt_audit_log_select_owner',
         coalesce(string_agg(policyname, ', '), '(ninguna)'),
         case when count(*) = 1 then 'OK' else 'FALTA — aplicar 0003' end
  from pg_policies
  where schemaname = 'public'
    and tablename = 'mt_audit_log'
    and cmd = 'SELECT'

  union all
  select 4,
         'Politicas sobre tablas mt_',
         '28',
         count(*)::text,
         case when count(*) = 28 then 'OK' else 'REVISAR' end
  from pg_policies
  where schemaname = 'public' and tablename like 'mt\_%'

  union all
  select 5,
         'Funciones mt_ del esquema',
         '8',
         count(distinct p.proname)::text,
         case when count(distinct p.proname) = 8 then 'OK' else 'FALTA' end
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  join esperadas e on e.nombre = p.proname
  where ns.nspname = 'public'

  union all
  select 6,
         'Disparador mt_on_auth_user_created',
         '1',
         count(*)::text,
         case when count(*) = 1 then 'OK' else 'FALTA — aplicar 0001' end
  from pg_trigger
  where tgname = 'mt_on_auth_user_created' and not tgisinternal

  union all
  select 7,
         'usage sobre public para authenticated',
         'true',
         has_schema_privilege('authenticated', 'public', 'usage')::text,
         case when has_schema_privilege('authenticated', 'public', 'usage')
              then 'OK' else 'FALTA — aplicar 0004' end

  union all
  select 8,
         'Tablas mt_ con permisos para authenticated',
         '9',
         count(distinct table_name)::text,
         case when count(distinct table_name) = 9 then 'OK'
              else 'FALTA — aplicar 0004' end
  from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'authenticated'
    and table_name like 'mt\_%'

  union all
  select 9,
         'Restriccion de un solo propietario activo',
         'mt_memberships_single_owner_idx',
         coalesce((select indexname from pg_indexes
                   where schemaname = 'public'
                     and indexname = 'mt_memberships_single_owner_idx'), '(ninguna)'),
         case when exists (select 1 from pg_indexes
                           where schemaname = 'public'
                             and indexname = 'mt_memberships_single_owner_idx')
              then 'OK' else 'FALTA — aplicar 0001' end

  union all
  select 10,
         'Restos sin prefijo del esquema anterior',
         '0',
         count(*)::text,
         case when count(*) = 0 then 'OK'
              else 'quedan tablas viejas — ejecutar reset.sql' end
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('profiles','organizations','memberships','workshops',
                       'workshop_assignments','clients','parts','part_movements',
                       'audit_log')

  union all
  select 11,
         'Indices redundantes en mt_memberships',
         '0',
         count(*)::text,
         case when count(*) = 0 then 'OK'
              else 'sobran — no deberian existir' end
  from pg_indexes
  where schemaname = 'public'
    and indexname in ('mt_memberships_org_user_idx', 'mt_memberships_org_id_idx')

) c
order by orden;
