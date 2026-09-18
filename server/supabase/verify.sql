-- MotoCore · COMPROBACION DEL ESQUEMA
-- ============================================================================
--
-- Solo lectura: no modifica nada. Se ejecuta en el SQL Editor —o con
-- `npm run db:verify`— **despues** de aplicar `migrations/0001…0004`, y
-- devuelve una fila por comprobacion.
--
-- Todos los objetos de MotoCore llevan el prefijo `mt_`, de modo que estas
-- consultas se acotan a el y no dependen de que `public` contenga o no otras
-- tablas.
--
-- Para que la base sirva como entorno de validacion, todas las filas deben
-- decir `OK`. Las tres primeras sostienen el objetivo 4: sin las siete tablas
-- de negocio con RLS activo no hay aislamiento que medir (RNF-101, CP-N101), y
-- sin la politica de auditoria reservada al Owner el caso CP-704.2 no puede
-- pasar. Las ultimas comprueban lo que el esquema **niega**, que es tan
-- verificable como lo que concede.
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
  values ('mt_is_org_member'), ('mt_is_org_owner'), ('mt_handle_new_user'),
         ('mt_get_user_id_by_email'), ('mt_create_organization'),
         ('mt_register_part_movement'), ('mt_transfer_stock')
),
negocio_sin_org as (
  -- Principio rector del modelo de datos: toda tabla de negocio porta
  -- `organization_id`, tambien las de nivel taller y la de asignaciones.
  select n.nombre
  from negocio n
  where not exists (
    select 1 from information_schema.columns col
    where col.table_schema = 'public'
      and col.table_name = n.nombre
      and col.column_name = 'organization_id'
  )
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
         case when count(*) = 1 and bool_and(policyname = 'mt_audit_log_select_owner')
              then 'OK' else 'FALTA — aplicar 0003' end
  from pg_policies
  where schemaname = 'public'
    and tablename = 'mt_audit_log'
    and cmd = 'SELECT'

  union all
  select 4,
         'Politicas sobre tablas mt_',
         '21',
         count(*)::text,
         case when count(*) = 21 then 'OK' else 'REVISAR' end
  from pg_policies
  where schemaname = 'public' and tablename like 'mt\_%'

  union all
  select 5,
         'Funciones mt_ del esquema',
         '7',
         count(distinct p.proname)::text,
         case when count(distinct p.proname) = 7 then 'OK' else 'FALTA' end
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
         'Tablas mt_ legibles por authenticated',
         '9',
         count(*)::text,
         case when count(*) = 9 then 'OK' else 'FALTA — aplicar 0004' end
  from tablas t
  where has_table_privilege('authenticated', format('public.%I', t.relname), 'SELECT')

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
         'Tablas de negocio sin organization_id',
         '(ninguna)',
         coalesce((select string_agg(nombre, ', ') from negocio_sin_org), '(ninguna)'),
         case when not exists (select 1 from negocio_sin_org)
              then 'OK' else 'FALTA — aplicar 0001 y 0002' end

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

  union all
  select 12,
         'Privilegios de anon sobre tablas mt_',
         '0',
         count(*)::text,
         case when count(*) = 0 then 'OK' else 'SOBRAN — aplicar 0004' end
  from tablas t
  where has_table_privilege('anon', format('public.%I', t.relname),
                            'SELECT, INSERT, UPDATE, DELETE')

  union all
  select 13,
         'Escritura del historial inmutable por authenticated',
         'false',
         (has_table_privilege('authenticated', 'public.mt_audit_log', 'INSERT, UPDATE, DELETE')
          or has_table_privilege('authenticated', 'public.mt_part_movements', 'INSERT, UPDATE, DELETE'))::text,
         case when not (has_table_privilege('authenticated', 'public.mt_audit_log', 'INSERT, UPDATE, DELETE')
                        or has_table_privilege('authenticated', 'public.mt_part_movements', 'INSERT, UPDATE, DELETE'))
              then 'OK' else 'SOBRA — aplicar 0004' end

  union all
  select 14,
         'Existencia modificable sin movimiento (current_stock)',
         'false',
         (has_column_privilege('authenticated', 'public.mt_parts', 'current_stock', 'INSERT')
          or has_column_privilege('authenticated', 'public.mt_parts', 'current_stock', 'UPDATE'))::text,
         case when not (has_column_privilege('authenticated', 'public.mt_parts', 'current_stock', 'INSERT')
                        or has_column_privilege('authenticated', 'public.mt_parts', 'current_stock', 'UPDATE'))
              then 'OK' else 'SOBRA — aplicar 0004' end

  union all
  select 15,
         'Funciones privilegiadas invocables por authenticated',
         '0',
         count(*)::text,
         case when count(*) = 0 then 'OK' else 'SOBRAN — revisar grants de 0001 y 0002' end
  from pg_proc p
  join pg_namespace ns on ns.oid = p.pronamespace
  where ns.nspname = 'public'
    and p.proname in ('mt_get_user_id_by_email', 'mt_create_organization',
                      'mt_register_part_movement', 'mt_transfer_stock', 'mt_handle_new_user')
    and has_function_privilege('authenticated', p.oid, 'EXECUTE')

) c
order by orden;
