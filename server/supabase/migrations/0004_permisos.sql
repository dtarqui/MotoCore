-- MotoCore — 0004 · Permisos de esquema y de tabla
-- ============================================================================
--
-- Va la última porque concede sobre las tablas que crean las tres anteriores.
--
-- POR QUÉ EXISTE ESTE ARCHIVO.
--
-- Un proyecto Supabase recién creado trae por defecto `usage` sobre `public` y
-- privilegios que conceden cada tabla nueva a `anon`, `authenticated` y
-- `service_role`. Esos valores **no son parte del esquema**: son configuración
-- del proyecto. Un esquema que se apoye en ellos no es reconstruible en
-- cualquier base — donde no estén, todo responde `permission denied for schema
-- public` en la primera petición.
--
-- RNF-304 exige que la base se reconstruya desde las migraciones de forma
-- reproducible. Lo que el esquema necesita, el esquema lo declara.
--
-- ============================================================================
-- Permisos y políticas son cosas distintas
-- ============================================================================
--
-- Conceder `select` a `authenticated` NO le deja ver filas ajenas: los permisos
-- dicen a qué tablas puede dirigirse un rol; las políticas deciden qué filas
-- obtiene de ellas. El aislamiento sigue donde estaba (ADR-002).
--
-- `service_role` necesita permiso igualmente: saltarse RLS no es lo mismo que
-- tener privilegios sobre la tabla.

-- ----------------------------------------------------------------------------
-- Esquema
-- ----------------------------------------------------------------------------
-- `anon` recibe `usage` pero ninguna tabla: puede llegar al esquema y no tocar
-- nada. El sistema no admite acceso anónimo a datos de negocio (RF-103), y esta
-- asimetría lo hace cumplir también a nivel de permisos.
grant usage on schema public to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Tablas con estado mutable
-- ----------------------------------------------------------------------------
-- Sin `delete`: el modelo conserva historial mediante baja lógica (`is_active`),
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
-- Vínculos
-- ----------------------------------------------------------------------------
-- La asignación de un miembro a un taller es el único vínculo que se retira de
-- verdad, y por eso la única tabla con `delete` (§2.6 del contrato).
grant select, insert, delete on public.mt_workshop_assignments to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Historial inmutable
-- ----------------------------------------------------------------------------
-- Solo inserción y lectura. Las políticas ya no definen `update` ni `delete`
-- para estas dos tablas; negarlo también en los permisos hace que la
-- inmutabilidad no dependa de una sola capa.
grant select, insert on public.mt_part_movements to authenticated, service_role;
grant select, insert on public.mt_audit_log      to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Al añadir una tabla de negocio
-- ----------------------------------------------------------------------------
-- No se fijan privilegios por defecto a propósito: se conceden tabla por tabla,
-- de modo que añadir una obligue a decidir explícitamente qué puede hacerse con
-- ella. Una tabla sin su `grant` falla de inmediato y de forma visible, que es
-- preferible a heredar permisos que nadie eligió.
