# Seguridad y Roles

## Lineamientos de seguridad

MotoCore contempla una base de seguridad orientada a aplicaciones SaaS:

- Autenticación basada en tokens.
- Control de acceso por roles (RBAC).
- Protección de endpoints de API.
- Aislamiento de datos por taller (tenant isolation).

## Modelo de propiedad y aislamiento

- Cada `Owner` administra su propio taller.
- Un taller puede tener múltiples `Mechanic` y múltiples `Receptionist`.
- Los clientes, motocicletas, órdenes, inventario e historial pertenecen al taller del `Owner`.
- No existe compartición de clientes ni motocicletas entre talleres distintos.

## Roles del sistema

### Owner

- Gestión global de operación del taller.
- Acceso a métricas y configuración.
- Supervisión de usuarios y permisos.

### Mechanic

- Gestión técnica de órdenes de trabajo.
- Registro de diagnósticos y mantenimientos.
- Actualización de estados de servicio.

### Receptionist

- Registro de clientes y motocicletas.
- Apertura y seguimiento inicial de órdenes.
- Atención y coordinación operativa de ingreso/entrega.

## Recomendaciones para siguientes iteraciones

- Definir políticas de expiración y rotación de tokens.
- ~~Registrar auditoría de acciones críticas.~~ Implementado para cambios de rol y remoción de miembros/talleres (`/api/audit-logs`, solo Owner); pendiente extenderlo a otras entidades (clientes, motocicletas, inventario) si se necesita trazabilidad más amplia.
- Rate limiting en endpoints de autenticación: implementado en `/api/auth/*` (umbral configurable por despliegue).
- Añadir controles de hardening adicionales para API y base de datos (2FA, rotación de secretos, WAF).