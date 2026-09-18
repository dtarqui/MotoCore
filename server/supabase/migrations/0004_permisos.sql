-- MotoCore — 0004 · Permisos de esquema y de tabla
-- ============================================================================
--
-- Va la última porque concede sobre las tablas que crean las tres anteriores.
--
-- POR QUÉ EXISTE ESTE ARCHIVO.
--
-- Un proyecto Supabase trae privilegios por defecto que conceden **todo** sobre
-- cada tabla nueva de `public` a `anon`, `authenticated` y `service_role`. Esos
-- valores no son parte del esquema: son configuración del proyecto. Un esquema
-- que se apoye en ellos no es reconstruible en cualquier base (RNF-304), y uno
-- que los herede sin revisarlos concede lo que nadie eligió.
--
-- Por eso el archivo **retira primero** todo privilegio sobre las tablas `mt_`
-- y después concede, tabla por tabla, lo que cada rol necesita. Lo que el
-- esquema necesita, el esquema lo declara.
--
-- ============================================================================
-- Permisos y políticas son cosas distintas
-- ============================================================================
--
-- Conceder `select` a `authenticated` NO le deja ver filas ajenas: los permisos
-- dicen a qué tablas y columnas puede dirigirse un rol; las políticas deciden
-- qué filas obtiene de ellas. El aislamiento sigue donde estaba (ADR-002).
--
-- `service_role` salta las políticas, pero no los permisos: saltarse RLS no es
-- lo mismo que tener privilegios sobre la tabla. Recibe solo lo que usan las
-- excepciones enumeradas de ADR-008.

-- ----------------------------------------------------------------------------
-- Punto de partida: ningún privilegio heredado
-- ----------------------------------------------------------------------------
revoke all on
  public.mt_profiles,
  public.mt_organizations,
  public.mt_memberships,
  public.mt_workshops,
  public.mt_workshop_assignments,
  public.mt_clients,
  public.mt_parts,
  public.mt_part_movements,
  public.mt_audit_log
from anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Esquema
-- ----------------------------------------------------------------------------
-- `anon` recibe `usage` pero ninguna tabla: puede llegar al esquema y no tocar
-- nada. El sistema no admite acceso anónimo a datos de negocio (RF-103), y esta
-- asimetría lo hace cumplir también a nivel de permisos.
grant usage on schema public to anon, authenticated, service_role;


-- ============================================================================
-- authenticated — la credencial de la petición
-- ============================================================================

-- Identidad. El perfil lo crea el disparador; la cuenta solo corrige su nombre.
grant select on public.mt_profiles to authenticated;
grant update (first_name, last_name, updated_at) on public.mt_profiles to authenticated;

-- La organización la crea `mt_create_organization`; el owner edita sus datos.
grant select on public.mt_organizations to authenticated;
grant update (name, description, address, phone, email, updated_at) on public.mt_organizations
  to authenticated;

-- Sin `delete`: el modelo conserva historial mediante baja lógica (`is_active`),
-- de modo que ninguna de estas filas se borra nunca.
grant select, insert, update on
  public.mt_workshops,
  public.mt_memberships,
  public.mt_clients
to authenticated;

-- Repuestos: permisos **por columna**. `current_stock` no figura ni en la
-- inserción ni en la actualización, de modo que la existencia nace en cero y
-- solo la cambian las funciones atómicas de la 0002 (RN-11, RN-12). Sin esto,
-- un miembro podría fijar la existencia por acceso directo sin un movimiento
-- que la explique.
grant select on public.mt_parts to authenticated;
grant insert (organization_id, workshop_id, part_number, name, description, brand, category,
              minimum_stock, maximum_stock, unit_cost)
  on public.mt_parts to authenticated;
grant update (name, description, brand, category, minimum_stock, maximum_stock, unit_cost,
              is_active, updated_at)
  on public.mt_parts to authenticated;

-- La asignación de un miembro a un taller es el único vínculo que se retira de
-- verdad, y por eso la única tabla con `delete` (§2.6 del contrato).
grant select, insert, delete on public.mt_workshop_assignments to authenticated;

-- Historial inmutable: solo lectura con la credencial de la petición. Los
-- movimientos los escriben las funciones atómicas y la auditoría el servidor
-- (RN-11, RN-15). Negarlo también en los permisos hace que la inmutabilidad no
-- dependa de una sola capa.
grant select on public.mt_part_movements to authenticated;
grant select on public.mt_audit_log      to authenticated;


-- ============================================================================
-- service_role — las excepciones de ADR-008, y nada más
-- ============================================================================
--
-- Las funciones atómicas (excepciones 2, 3, 5 y 6) se ejecutan con los
-- privilegios de su creador y no necesitan permisos de tabla: su `execute` se
-- concede junto a cada una, en la 0001 y la 0002.

-- 1. Verificación de membresía y de pertenencia del taller, de la capa de
--    aplicación. 2. Lectura de lo que el registro acaba de crear.
grant select on public.mt_memberships, public.mt_workshops, public.mt_organizations to service_role;

-- 4. Perfiles de los demás miembros de la organización (RF-407).
grant select on public.mt_profiles to service_role;

-- 7. Escritura del registro de auditoría: solo inserción.
grant insert on public.mt_audit_log to service_role;

-- ----------------------------------------------------------------------------
-- Al añadir una tabla de negocio
-- ----------------------------------------------------------------------------
-- No se fijan privilegios por defecto a propósito: se conceden tabla por tabla,
-- de modo que añadir una obligue a decidir explícitamente qué puede hacerse con
-- ella. Hay que sumarla también a la lista del `revoke` inicial: si no, heredará
-- los privilegios por defecto del proyecto.
