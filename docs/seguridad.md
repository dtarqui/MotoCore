# Seguridad y Roles

## Lineamientos de seguridad

MotoCore contempla una base de seguridad orientada a aplicaciones SaaS:

- Autenticación basada en tokens.
- Control de acceso por roles (RBAC).
- Protección de endpoints de API.

## Roles del sistema

### Administrador

- Gestión global de operación del taller.
- Acceso a métricas y configuración.
- Supervisión de usuarios y permisos.

### Mecánico

- Gestión técnica de órdenes de trabajo.
- Registro de diagnósticos y mantenimientos.
- Actualización de estados de servicio.

### Recepcionista

- Registro de clientes y motocicletas.
- Apertura y seguimiento inicial de órdenes.
- Atención y coordinación operativa de ingreso/entrega.

## Recomendaciones para siguientes iteraciones

- Definir políticas de expiración y rotación de tokens.
- Registrar auditoría de acciones críticas.
- Añadir controles de hardening para API y base de datos.