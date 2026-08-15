# Seguridad y control de acceso

> Terminología: [Glosario](01-glosario.md). Arquitectura general: [Arquitectura](04-arquitectura.md).
>
> Este documento describe **el enfoque de seguridad a alto nivel**. Deliberadamente no incluye umbrales exactos, tiempos de expiración ni detalles de configuración que faciliten un ataque: esos viven en la configuración del despliegue.

## Lineamientos

- Autenticación basada en credenciales de sesión, delegada en un proveedor de identidad gestionado.
- Control de acceso basado en roles, definido **por empresa**.
- Aislamiento de datos entre empresas garantizado en el motor de base de datos, no solo en el código.
- Credenciales de configuración fuera del código fuente: únicamente en variables de entorno del despliegue.
- Auditoría de acciones críticas.

## Modelo de propiedad y aislamiento

La jerarquía es **empresa → sucursales**, pero el **límite de seguridad es uno solo: la empresa**.

- Una **cuenta** puede crear y pertenecer a **varias organizaciones**.
- El acceso a los datos de una organización lo otorga una **membresía activa**, que define además el **rol** de esa cuenta *en esa organización*.
- Todos los datos de negocio (clientes, motocicletas, órdenes, inventario, historial) pertenecen a una organización y **no se comparten entre organizaciones**.
- Una organización puede tener **varios talleres** (sucursales). El taller indica *dónde* ocurre una operación; **no** restringe quién puede verla dentro de la organización. Modelarlo como segunda frontera de seguridad se evaluó y se descartó — ver [ADR-006](07-decisiones-diseno.md).
- La asignación de un miembro a uno o varios talleres es **operativa** (en qué sucursal trabaja), no un mecanismo de permisos.
- La organización y el taller sobre los que se opera se indican explícitamente en cada request; el servidor nunca asume ninguno por defecto, y valida que el taller pertenezca a la organización activa.

## Aislamiento en dos capas (defensa en profundidad)

| Capa | Mecanismo | Qué protege |
|---|---|---|
| Base de datos | **Seguridad a nivel de fila**: las políticas exigen que quien consulta tenga membresía activa en la empresa propietaria del registro | Protege aunque la capa de aplicación tenga un error u omita un filtro |
| Aplicación | Verificación explícita de membresía —y de rol cuando la operación lo exige— antes de ejecutar cada operación | Permite denegar con un error de negocio específico y evita depender de una sola configuración |

Como todas las entidades —incluidas las de nivel sucursal— referencian a la empresa, las políticas se evalúan siempre sobre el mismo criterio, sin importar el nivel jerárquico del dato. La pertenencia de la sucursal a la empresa activa se valida por separado, en la capa de aplicación.

Ambas capas están cubiertas por pruebas automatizadas que verifican que una cuenta no pueda acceder a datos de una organización donde no es miembro.

## Roles del sistema

El rol es **por empresa**: la misma cuenta puede tener roles distintos en empresas distintas (ver [Glosario](01-glosario.md)).

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

La gestión de identidad —registro, inicio de sesión, renovación de sesión, confirmación de correo y recuperación de contraseña— se delega en un proveedor gestionado. La capa de aplicación no emite credenciales: únicamente **verifica** la recibida y resuelve la identidad de la cuenta.

Delegar la identidad reduce la superficie de código sensible del sistema y permite que el identificador del usuario autenticado esté disponible dentro del motor de base de datos, condición necesaria para que las políticas de aislamiento puedan evaluarlo (ver [07-decisiones-diseno.md](07-decisiones-diseno.md), ADR-004).

## Manejo de errores

Los errores se devuelven en un formato uniforme y normalizado, con códigos estables. Los errores de autorización no revelan si el recurso existe cuando ello permitiría inferir datos de otra empresa (RNF-105).

## Protección de datos sensibles

- Las credenciales privilegiadas de la base de datos se emplean **únicamente en el servidor**; nunca se exponen al cliente ni se versionan (RNF-103).
- La búsqueda de cuentas por correo, necesaria para invitar miembros, se restringe al servidor para no exponer un mecanismo de enumeración de cuentas (RNF-106).

## Verificación del aislamiento

El cumplimiento del aislamiento se comprueba mediante pruebas automatizadas que operan por dos vías independientes (objetivo específico 8):

1. **A través de la interfaz de programación**: una cuenta sin membresía en una empresa recibe error de autorización en cualquier operación sobre sus datos.
2. **Mediante acceso directo a la base de datos**, prescindiendo de la capa de aplicación: las consultas ejecutadas con la identidad de otra cuenta no devuelven registros ajenos.

La segunda vía es la que demuestra que el aislamiento se sostiene aun cuando la capa de aplicación omita sus controles.

## Fuera del alcance

Se identifican como líneas de refuerzo posterior: autenticación de doble factor, políticas formales de rotación de credenciales y auditoría extendida a la totalidad de las entidades de negocio.
