-- MotoCore — la lectura de la auditoria se reserva al Owner (RF-704)
--
-- CORRECCION DE CONFORMIDAD con la especificacion.
--
-- La migracion 0006 creo la politica de lectura de audit_log con
-- `is_org_member`, de modo que cualquier miembro de la organización podia leer el
-- registro de auditoria consultando la base de datos directamente. La
-- especificacion exige lo contrario:
--
--   RF-704  "La consulta del registro de auditoria esta reservada al Owner de
--            la organización. [...] la restriccion se aplica tambien por acceso
--            directo a la base de datos."
--
--   05-modelo-datos.md  "Lectura del registro de auditoria: is_org_owner() —
--                        es la unica tabla cuya lectura no basta con ser
--                        miembro (RF-704)."
--
-- Restringirlo solo en la capa de aplicacion no cumple el requisito: RF-704
-- pide explicitamente que la restriccion se sostenga cuando se prescinde de
-- la API, que es justamente lo que verifica el caso CP-704.2 del plan de
-- pruebas. Sin esta politica, ese caso no puede pasar.

drop policy if exists audit_log_select_member on public.audit_log;
drop policy if exists audit_log_select_owner on public.audit_log;

create policy audit_log_select_owner on public.audit_log
  for select using (public.is_org_owner(organization_id));

-- La insercion se mantiene como estaba: la escribe la API con la service key,
-- que no pasa por RLS. La politica de insercion solo gobierna el acceso
-- directo de una sesion autenticada.
