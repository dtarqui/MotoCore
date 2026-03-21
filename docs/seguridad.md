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
- Registrar auditoría de acciones críticas.
- Añadir controles de hardening para API y base de datos.