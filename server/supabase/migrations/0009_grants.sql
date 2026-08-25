-- MotoCore — permisos de esquema y de tabla para los roles de Supabase
-- ============================================================================
--
-- CORRECCION DE PORTABILIDAD.
--
-- Las migraciones anteriores crean las tablas y sus politicas, pero nunca
-- declaran los permisos que los roles de la API necesitan para alcanzarlas. En
-- un proyecto Supabase recien creado eso pasa desapercibido, porque el proyecto
-- trae por defecto `usage` sobre `public` y privilegios por defecto que
-- conceden cada tabla nueva a `anon`, `authenticated` y `service_role`.
--
-- Esos valores por defecto **no son parte del esquema**: son configuracion del
-- proyecto, y un proyecto donde se hayan revocado —o donde otra herramienta los
-- haya alterado— deja el mismo esquema inservible, con `permission denied for
-- schema public` en la primera peticion.
--
-- RNF-304 exige que la base se reconstruya desde las migraciones de forma
-- reproducible. Depender de un valor por defecto del proveedor lo incumple: lo
-- que el esquema necesita, el esquema lo declara.
--
-- ============================================================================
-- Permisos y politicas son cosas distintas
-- ============================================================================
--
-- Conceder `select` a `authenticated` NO le deja ver filas ajenas: los permisos
-- dicen a que tablas puede dirigirse un rol, y las politicas deciden que filas
-- obtiene de ellas. El aislamiento sigue estando donde estaba (ADR-002).
--
-- `service_role` requiere permiso igualmente: saltarse RLS no es lo mismo que
-- tener privilegios sobre la tabla.

-- ----------------------------------------------------------------------------
-- Esquema
-- ----------------------------------------------------------------------------
-- `anon` recibe `usage` pero ninguna tabla: puede llegar al esquema y no tocar
-- nada. El sistema no admite acceso anonimo a datos de negocio (RF-103), y esta
-- asimetria lo hace cumplir tambien a nivel de permisos.
grant usage on schema public to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Tablas con estado mutable
-- ----------------------------------------------------------------------------
-- Sin `delete`: el modelo conserva historial mediante baja logica (`is_active`),
-- de modo que ninguna de estas filas se borra nunca.
grant select, insert, update on
  public.mt_profiles,
  public.mt_organizations,
  public.mt_workshops,
  public.mt_memberships,
  public.mt_clients,
  public.mt_parts
to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Vinculos
-- ----------------------------------------------------------------------------
-- La asignacion de un miembro a un taller es el unico vinculo que se retira de
-- verdad, y por eso es la unica tabla con `delete` (§2.6 del contrato).
grant select, insert, delete on public.mt_workshop_assignments to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Historial inmutable
-- ----------------------------------------------------------------------------
-- Solo insercion y lectura. Las politicas ya no definen `update` ni `delete`
-- para estas dos tablas; negarlo tambien en los permisos hace que la
-- inmutabilidad no dependa de una sola capa.
grant select, insert on public.mt_part_movements to authenticated, service_role;
grant select, insert on public.mt_audit_log to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Al anadir una tabla de negocio
-- ----------------------------------------------------------------------------
-- No se fijan privilegios por defecto a proposito: se conceden tabla por tabla,
-- de modo que anadir una obligue a decidir explicitamente que puede hacerse con
-- ella. Una tabla sin su `grant` falla de inmediato y de forma visible, que es
-- preferible a heredar permisos que nadie eligio.
