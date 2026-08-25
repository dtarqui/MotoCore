-- MotoCore — un solo propietario activo por organizacion
-- ============================================================================
--
-- La regla ya existia, pero **solo en la capa de aplicacion**: RF-402 impide
-- invitar a alguien como `owner` y RF-405 impide promover a otro miembro o
-- remover al propietario. La base, en cambio, aceptaba sin protestar dos
-- membresias activas con rol `owner` en la misma organizacion.
--
-- Eso contradice ADR-002, que es el eje del proyecto: las reglas criticas se
-- aplican en **dos capas independientes**, de modo que el fallo de una no
-- comprometa el sistema. Una regla que solo vive en el codigo se pierde entera
-- con un solo descuido en una consulta — exactamente el patron que la tesis
-- viene a evitar.
--
-- ============================================================================
-- Por que un indice unico parcial y no un disparador
-- ============================================================================
--
-- Un disparador podria comprobar lo mismo, pero se ejecuta por fila y hay que
-- leerlo para saber que garantiza. El indice **declara** la restriccion: es
-- inspeccionable de un vistazo y el propio motor la hace cumplir, incluso ante
-- inserciones concurrentes. Es el principio de economia del mecanismo de
-- Saltzer y Schroeder (1975) aplicado aqui: una proteccion que no puede
-- inspeccionarse con confianza deja de proteger.
--
-- El predicado incluye `is_active` a proposito. Lo que debe ser unico es el
-- propietario **vigente**, no el historico: si algun dia se admitiera traspasar
-- la propiedad, la membresia anterior quedaria inactiva y esta restriccion no
-- lo impediria. Restringir por `role` a secas cerraria esa puerta sin necesidad.

create unique index if not exists mt_memberships_single_owner_idx
  on public.mt_memberships (organization_id)
  where role = 'owner' and is_active;

-- ----------------------------------------------------------------------------
-- Relacion con `mt_organizations.owner_id`
-- ----------------------------------------------------------------------------
-- La columna `owner_id` nombra al propietario y esta restriccion garantiza que
-- no haya dos membresias que reclamen ese papel. Que ambas coincidan lo sostiene
-- el registro de la cuenta, que crea organizacion y membresia en la misma
-- transaccion (ADR-007): no hay camino por el que una exista sin la otra.
