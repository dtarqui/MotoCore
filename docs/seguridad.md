# Seguridad y Roles

> Terminología: [glosario.md](glosario.md). Arquitectura general: [arquitectura.md](arquitectura.md).
>
> Este documento describe **el enfoque de seguridad a alto nivel**. Deliberadamente no incluye umbrales exactos, tiempos de expiración ni detalles de configuración que faciliten un ataque: esos viven en la configuración del despliegue.

## Lineamientos

- Autenticación basada en tokens, delegada en un proveedor de identidad gestionado (Supabase Auth).
- Control de acceso basado en roles (RBAC), **por organización**.
- Aislamiento de datos entre organizaciones garantizado en la base de datos, no solo en el código.
- Secretos fuera del repositorio: solo en variables de entorno del proveedor.
- Auditoría de acciones críticas.

## Modelo de propiedad y aislamiento

La jerarquía es **organización → talleres**, pero el **límite de seguridad es uno solo: la organización**.

- Una **cuenta** puede crear y pertenecer a **varias organizaciones**.
- El acceso a los datos de una organización lo otorga una **membresía activa**, que define además el **rol** de esa cuenta *en esa organización*.
- Todos los datos de negocio (clientes, motocicletas, órdenes, inventario, historial) pertenecen a una organización y **no se comparten entre organizaciones**.
- Una organización puede tener **varios talleres** (sucursales). El taller indica *dónde* ocurre una operación; **no** restringe quién puede verla dentro de la organización. Modelarlo como segunda frontera de seguridad se evaluó y se descartó — ver [ADR-006](decisiones-arquitectura.md).
- La asignación de un miembro a uno o varios talleres es **operativa** (en qué sucursal trabaja), no un mecanismo de permisos.
- La organización y el taller sobre los que se opera se indican explícitamente en cada request; el servidor nunca asume ninguno por defecto, y valida que el taller pertenezca a la organización activa.

## Aislamiento en dos capas (defensa en profundidad)

| Capa | Mecanismo | Qué protege |
|---|---|---|
| Base de datos | **Row-Level Security (RLS)** en PostgreSQL: las políticas exigen que quien consulta tenga membresía activa en la organización dueña de la fila | Protege aunque el código de aplicación tenga un error u omita un filtro |
| API | Verificación explícita de membresía (y de rol cuando la operación lo exige) al inicio de cada handler | Permite denegar con un error de negocio específico y no depender de una sola configuración |

Como todas las tablas —incluidas las de nivel taller— llevan `organization_id`, las políticas RLS se evalúan siempre sobre el mismo criterio, sin importar el nivel jerárquico del dato. La pertenencia del taller a la organización activa se valida aparte, en la API.

Ambas capas están cubiertas por pruebas automatizadas que verifican que una cuenta no pueda acceder a datos de una organización donde no es miembro.

## Roles del sistema

El rol es **por organización**: la misma cuenta puede tener roles distintos en organizaciones distintas. Se escriben en inglés (ver [glosario.md](glosario.md)).

### Owner
- Administra la organización y sus datos.
- Gestiona miembros: invitar, cambiar rol, remover.
- Único rol que puede realizar acciones administrativas sobre la organización.

### Mechanic
- Trabajo técnico sobre órdenes de trabajo: diagnóstico, avance de estado, cierre.

### Receptionist
- Registro de clientes y motocicletas.
- Apertura y seguimiento inicial de órdenes; coordinación de ingreso y entrega.

### Reglas de protección del Owner
- No se puede remover al Owner de su propia organización.
- No se puede cambiar el rol del Owner.
- No se puede invitar a alguien directamente como Owner: el Owner es quien crea la organización.

## Autenticación

La gestión de identidad (registro, inicio de sesión, renovación de sesión, confirmación de email, recuperación de contraseña y OAuth) está delegada en **Supabase Auth**. La API no emite credenciales: únicamente **verifica** el token recibido y resuelve la identidad de la cuenta.

Esto reemplaza el esquema de JWT propio del backend legacy, en el que el envío de correos era un stub no funcional (ver [decisiones-arquitectura.md](decisiones-arquitectura.md), ADR-004).

## Manejo de errores

Los errores se devuelven en formato **ProblemDetails** (RFC 7807) con códigos `modulo.razon`. Los errores de autorización no revelan si el recurso existe o no cuando eso permitiría inferir datos de otra organización.

## Protección de datos sensibles

- La clave de servicio (*service role*) de la base de datos se usa **solo en el servidor** y nunca se expone al cliente ni se versiona.
- La búsqueda de usuarios por email (necesaria para invitar miembros) está restringida al servidor, para no exponer un mecanismo de enumeración de cuentas.

## Pendientes de endurecimiento

- Autenticación de dos factores (2FA).
- Políticas formales de rotación de secretos.
- Extender la auditoría a todas las entidades de negocio conforme se porten los módulos.
- Pruebas de seguridad dirigidas (intento deliberado de acceso cruzado entre organizaciones saltándose la API) como evidencia formal del aislamiento.
