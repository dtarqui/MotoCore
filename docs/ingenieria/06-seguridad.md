# Seguridad y control de acceso

> Terminología: [Glosario](01-glosario.md). Arquitectura general: [Arquitectura](04-arquitectura.md). Modelos de seguridad que fundamentan este enfoque —principios de Saltzer y Schroeder, control de acceso basado en roles, confianza cero y defensa en profundidad—: [Marco teórico](../anteproyecto/03-marco-teorico-y-conceptual.md) §3.2.4.
>
> Este documento describe **el enfoque de seguridad a alto nivel**. Deliberadamente no incluye umbrales exactos, tiempos de expiración ni detalles de configuración que faciliten un ataque: esos viven en la configuración del despliegue.

## Lineamientos

- Autenticación basada en credenciales de sesión, delegada en un proveedor de identidad gestionado.
- Control de acceso basado en roles, definido **por organización**.
- Aislamiento de datos entre organizaciones garantizado en el motor de base de datos, no solo en el código.
- Credenciales de configuración fuera del código fuente: únicamente en variables de entorno del despliegue.
- Auditoría de acciones críticas.

## Modelo de propiedad y aislamiento

La jerarquía es **organización → talleres** ([Glosario](01-glosario.md)), pero el **límite de seguridad es uno solo: la organización**. De ahí se siguen las tres reglas que gobiernan el acceso:

- El acceso a los datos de una organización lo otorga una **membresía activa**, que define además el **rol** de esa cuenta *en esa organización*. Sin membresía no hay acceso, y ningún dato de negocio se comparte entre organizaciones.
- El **taller no restringe** quién puede ver un dato dentro de la organización; tampoco lo hace la asignación de un miembro a talleres, que es operativa. Modelarlo como segunda frontera de seguridad se evaluó y se descartó — ver [ADR-006](07-decisiones-diseno.md).
- El contexto activo se indica **explícitamente en cada petición**: el servidor nunca asume organización ni taller por defecto, y valida que el taller pertenezca a la organización activa ([ADR-005](07-decisiones-diseno.md)).

## Aislamiento en dos capas (defensa en profundidad)

| Capa | Mecanismo | Qué protege |
|---|---|---|
| Base de datos | **Seguridad a nivel de fila**: las políticas exigen que quien consulta tenga membresía activa en la organización propietaria del registro | Protege aunque la capa de aplicación tenga un error u omita un filtro |
| Aplicación | Verificación explícita de membresía —y de rol cuando la operación lo exige— antes de ejecutar cada operación | Permite denegar con un error de negocio específico y evita depender de una sola configuración |

Como todas las entidades —incluidas las de nivel taller— referencian a la organización, las políticas se evalúan siempre sobre el mismo criterio, sin importar el nivel jerárquico del dato. La pertenencia del taller a la organización activa se valida por separado, en la capa de aplicación.

**Qué hace que la primera capa actúe también en las peticiones a la interfaz.** Las políticas se evalúan sobre la identidad de quien consulta, de modo que solo intervienen si la consulta se hace con la credencial de quien llama. Por eso los datos de negocio se leen y escriben con ella, y no con la del servidor; el conjunto de operaciones que sí exigen privilegio está acotado y enumerado (ADR-008). Consultar con privilegio donde no corresponde no produce un error visible: **desactiva silenciosamente esta capa**, y es la forma más fácil de perderla sin notarlo.

**La verificación de la segunda capa es la excepción deliberada**: consulta con privilegio a propósito. Si dependiera de las políticas para funcionar, ambas capas dejarían de ser independientes, que es justamente la propiedad que se quiere demostrar.

Ambas capas están cubiertas por pruebas automatizadas que verifican que una cuenta no pueda acceder a datos de una organización donde no es miembro.

## Roles del sistema

El rol es **por organización**: la misma cuenta puede tener roles distintos en organizaciones distintas (ver [Glosario](01-glosario.md)).

### Owner
- Administra la organización y sus datos.
- Gestiona miembros: invitar, cambiar rol, remover.
- Único rol que puede realizar acciones administrativas sobre la organización.
- Único rol que puede **consultar el registro de auditoría** (RF-704).

### Mechanic
- Trabajo técnico sobre órdenes de trabajo: diagnóstico, avance de estado, cierre.

### Receptionist
- Registro de clientes y motocicletas.
- Apertura y seguimiento inicial de órdenes; coordinación de ingreso y entrega.

> Las tareas de `Mechanic` y `Receptionist` sobre **órdenes de trabajo y motocicletas** describen el producto completo; esos módulos están fuera del alcance del proyecto de grado (RF-801 y RF-802). En el corte vertical, ambos roles operan sobre **clientes e inventario** con las reglas de RF-505 y RF-609.

### Reglas de protección del Owner
- No se puede remover al Owner de su propia organización.
- No se puede cambiar el rol del Owner.
- No se puede invitar a alguien directamente como Owner: el Owner es quien crea la organización.
- **Una organización tiene un solo propietario activo.** Es consecuencia de las tres reglas anteriores, y no se confía a ellas: la base de datos la hace cumplir con un índice único parcial sobre la organización, restringido a las membresías activas con rol `owner`. Una regla crítica que solo viviera en el código se perdería entera con un descuido en una consulta — que es el patrón de fallo contra el que se diseñó ADR-002.

## Autenticación

La gestión de identidad —registro, inicio de sesión, renovación de sesión, confirmación de correo y recuperación de contraseña— se delega en un proveedor gestionado. La capa de aplicación no emite credenciales: únicamente **verifica** la recibida y resuelve la identidad de la cuenta.

Delegar la identidad reduce la superficie de código sensible del sistema y permite que el identificador del usuario autenticado esté disponible dentro del motor de base de datos, condición necesaria para que las políticas de aislamiento puedan evaluarlo (ver [07-decisiones-diseno.md](07-decisiones-diseno.md), ADR-004).

## Manejo de errores

Los errores se devuelven en un formato uniforme y normalizado, con códigos estables. Los errores de autorización no revelan si el recurso existe cuando ello permitiría inferir datos de otra organización (RNF-105). La regla que decide entre denegar y declarar inexistente, con el catálogo completo de códigos, está en el [Contrato de la interfaz de programación](10-contrato-api.md): el catálogo en §4 y la regla de no divulgación en §5.

## Protección de datos sensibles

- Las credenciales privilegiadas de la base de datos se emplean **únicamente en el servidor**; nunca se exponen al cliente ni se versionan (RNF-103).
- La búsqueda de cuentas por correo, necesaria para invitar miembros, se restringe al servidor para no exponer un mecanismo de enumeración de cuentas (RNF-106).

## Verificación del aislamiento

El cumplimiento del aislamiento se comprueba mediante pruebas automatizadas que operan por dos vías independientes y se contrastan con una línea base (objetivo específico 4):

1. **A través de la interfaz de programación**: una cuenta sin membresía en una organización recibe error de autorización en cualquier operación sobre sus datos.
2. **Mediante acceso directo a la base de datos**, prescindiendo de la capa de aplicación: las consultas ejecutadas con la identidad de otra cuenta no devuelven registros ajenos.

La segunda vía es la que demuestra que el aislamiento se sostiene cuando se prescinde por completo de la interfaz — es decir, que es **inmutable**: ninguna decisión tomada en la capa de aplicación puede apagarlo. A ellas se suma una tercera comprobación, que es la que verifica la **independencia** de las dos capas: anular el control de membresía de la aplicación —en el banco de pruebas, nunca con un interruptor en producción— y comprobar que las políticas siguen filtrando (RNF-102, caso CP-N102).

Las tres se contrastan con la **línea base**: el mismo escenario con las políticas deshabilitadas y el control de aplicación omitido —solo en el proyecto de validación desechable—, que debe mostrar la fuga que las otras condiciones impiden.

El diseño completo —condiciones C0 a C3, escenario, tablas cubiertas y evidencia a conservar— está en el [Plan de pruebas](11-plan-pruebas.md) §6.

## Transporte y superficie de exposición

- **Transporte**: todo el tráfico entre cliente web, interfaz de programación, proveedor de identidad y base de datos viaja sobre TLS. Los datos en reposo los cifra el proveedor de datos.
- **Orígenes permitidos**: la interfaz solo acepta peticiones de navegador desde los orígenes del cliente web en *staging* y producción.
- **Superficie pública**: el registro de cuenta y la comprobación de disponibilidad. Todo lo demás exige credencial.
- **Superficie interna**: la búsqueda de cuentas por correo y las funciones atómicas del motor solo son invocables por el servidor.
- **Retención**: el registro de auditoría se conserva mientras exista la organización.

La especificación verificable de estos puntos está en [Requisitos](02-requisitos.md) §5.

## Fuera del alcance

Se identifican como líneas de refuerzo posterior: autenticación de doble factor, políticas formales de rotación de credenciales, un **límite de tasa propio sobre el registro** —que en funciones efímeras exige un almacén de estado compartido que el proyecto no incorpora— y auditoría extendida a la totalidad de las entidades de negocio. Esta última exclusión es la misma que registra el alcance del proyecto ([anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.8.3): se audita el conjunto acotado de seis acciones críticas que enumera RF-703, no toda operación del sistema.
