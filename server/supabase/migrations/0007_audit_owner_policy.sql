-- MotoCore — la lectura de la auditoria se reserva al Owner (RF-704)
--
-- CORRECCION DE CONFORMIDAD con la especificacion.
--
-- La migracion 0006 creo la politica de lectura de mt_audit_log con
-- `mt_is_org_member`, de modo que cualquier miembro de la organización podia leer el
-- registro de auditoria consultando la base de datos directamente. La
-- especificacion exige lo contrario:
--
--   RF-704  "La consulta del registro de auditoria esta reservada al Owner de
--            la organización. [...] la restriccion se aplica tambien por acceso
--            directo a la base de datos."
--
--   05-modelo-datos.md  "Lectura del registro de auditoria: mt_is_org_owner() —
--                        es la unica tabla cuya lectura no basta con ser
--                        miembro (RF-704)."
--
-- Restringirlo solo en la capa de aplicacion no cumple el requisito: RF-704
-- pide explicitamente que la restriccion se sostenga cuando se prescinde de
-- la API, que es justamente lo que verifica el caso CP-704.2 del plan de
-- pruebas. Sin esta politica, ese caso no puede pasar.

drop policy if exists mt_audit_log_select_member on public.mt_audit_log;
drop policy if exists mt_audit_log_select_owner on public.mt_audit_log;

create policy mt_audit_log_select_owner on public.mt_audit_log
  for select using (public.mt_is_org_owner(organization_id));

-- La insercion se mantiene como estaba: la escribe la API con la service key,
-- que no pasa por RLS. La politica de insercion solo gobierna el acceso
-- directo de una sesion autenticada.
