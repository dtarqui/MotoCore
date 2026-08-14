# Requisitos

Requisitos funcionales (RF) y no funcionales (RNF) del proyecto. Cada requisito tiene identificador estable, prioridad, criterio de verificación y trazabilidad al objetivo específico que lo sustenta ([tesis/01-definicion-y-alcance.md](tesis/01-definicion-y-alcance.md) §1.7).

> Terminología: [glosario.md](glosario.md) · Modelo de datos: [modelo-datos.md](modelo-datos.md) · Historias de usuario: [historias-usuario.md](historias-usuario.md)

## Convenciones

- **Prioridad** — `Must`: sin esto el proyecto no cumple su objetivo · `Should`: importante, no bloqueante · `Could`: deseable si sobra tiempo.
- **Alcance** — dentro (`✔`) o fuera (`✘`) del alcance del proyecto de grado (§1.8). Los requisitos fuera de alcance se documentan porque definen el producto completo y dan contexto al diseño, pero no se implementan en este período.
- **Nivel** — si el dato que gobierna el requisito es de **empresa** o de **sucursal**.

---

## 1. Requisitos funcionales

### RF-100 · Identidad y cuentas

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-101 | El sistema permite registrar una cuenta con email y contraseña, creando en el mismo acto su primera empresa, su primera sucursal y la membresía `Owner`. | Must | ✔ | Prueba de integración: tras el registro, `GET /api/auth/me` devuelve una empresa con rol `owner`. |
| RF-102 | El sistema permite iniciar sesión y renovar la sesión sin intervención del usuario. | Must | ✔ | Login devuelve token válido; el token expirado se renueva de forma transparente. |
| RF-103 | El sistema verifica el token en cada petición y rechaza las peticiones sin credenciales válidas. | Must | ✔ | Petición sin token devuelve `401`; con token inválido, `401`. |
| RF-104 | El sistema permite consultar el perfil de la cuenta autenticada junto con las empresas a las que pertenece y su rol en cada una. | Must | ✔ | `GET /api/auth/me` devuelve perfil + lista de empresas con rol. |

### RF-200 · Empresas (organizaciones)

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-201 | Una cuenta puede crear empresas adicionales, quedando como `Owner` de cada una. | Must | ✔ | Tras crear una segunda empresa, aparece en el listado con rol `owner`. |
| RF-202 | El sistema lista las empresas de la cuenta **según su membresía activa**, no según quién las creó. | Must | ✔ | Un miembro invitado ve la empresa en su listado aunque no sea su creador. |
| RF-203 | El usuario puede seleccionar la empresa activa sobre la que opera. | Must | ✔ | El cambio devuelve la empresa y el rol; las peticiones posteriores operan sobre ella. |
| RF-204 | El `Owner` puede editar los datos de su empresa. | Should | ✔ | Un no-`Owner` recibe `403` al intentarlo. |

### RF-300 · Sucursales (talleres)

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-301 | El `Owner` puede crear sucursales dentro de su empresa. | Must | ✔ | Empresa | La sucursal creada aparece en el listado de la empresa. |
| RF-302 | El sistema lista las sucursales de la empresa activa. | Must | ✔ | Empresa | Solo devuelve sucursales de la empresa activa. |
| RF-303 | El usuario puede seleccionar la sucursal activa, y el sistema rechaza una sucursal que no pertenezca a la empresa activa. | Must | ✔ | Empresa | Enviar el identificador de una sucursal ajena devuelve error de autorización. |
| RF-304 | El `Owner` puede asignar miembros a una o varias sucursales, sin que ello altere sus permisos. | Should | ✔ | Empresa | La asignación se registra; el acceso a datos sigue determinado por el rol. |
| RF-305 | El `Owner` puede desactivar una sucursal sin eliminar su historial. | Should | ✔ | Empresa | La sucursal desactivada deja de listarse como activa; sus datos siguen consultables. |

### RF-400 · Miembros y control de acceso

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-401 | El `Owner` puede invitar a una cuenta existente a su empresa, asignándole rol `Mechanic` o `Receptionist`. | Must | ✔ | Tras la invitación, el invitado accede a la empresa; antes recibía `403`. |
| RF-402 | El sistema impide invitar a alguien directamente como `Owner`. | Must | ✔ | La petición con rol `owner` es rechazada por validación. |
| RF-403 | El `Owner` puede cambiar el rol de un miembro. | Must | ✔ | El cambio se refleja en el listado de miembros. |
| RF-404 | El `Owner` puede remover a un miembro de la empresa. | Must | ✔ | El removido pierde el acceso inmediatamente. |
| RF-405 | El sistema impide cambiar el rol del `Owner` de la empresa o removerlo. | Must | ✔ | Ambas operaciones devuelven error de negocio específico. |
| RF-406 | Solo el `Owner` puede gestionar miembros; los demás roles reciben error de permisos. | Must | ✔ | Un `Mechanic` que intenta invitar recibe `403`. |
| RF-407 | El sistema lista los miembros de la empresa con su rol y estado. | Should | ✔ | Cualquier miembro puede consultarlo. |

### RF-500 · Clientes *(corte vertical — nivel empresa)*

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-501 | El sistema permite registrar clientes en la empresa activa. | Must | ✔ | Empresa | El cliente creado se recupera por identificador. |
| RF-502 | Los clientes son visibles desde **cualquier sucursal** de la empresa. | Must | ✔ | Empresa | Un cliente creado con la sucursal A activa se lista con la sucursal B activa. |
| RF-503 | El email del cliente es único dentro de la empresa, y no colisiona entre empresas distintas. | Must | ✔ | Empresa | Email duplicado en la misma empresa falla; el mismo email en otra empresa se acepta. |
| RF-504 | El sistema permite editar, buscar y dar de baja lógica a un cliente. | Must | ✔ | Empresa | La baja conserva el registro y lo excluye de los listados activos. |
| RF-505 | `Owner` y `Receptionist` pueden crear y editar clientes; `Mechanic` solo consultarlos. | Should | ✔ | Empresa | Un `Mechanic` que intenta crear recibe `403`. |

### RF-600 · Inventario *(corte vertical — nivel sucursal)*

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-601 | El sistema permite registrar repuestos en la sucursal activa. | Must | ✔ | Sucursal | El repuesto queda asociado a la sucursal donde se creó. |
| RF-602 | El inventario de una sucursal **no** se mezcla con el de otra de la misma empresa. | Must | ✔ | Sucursal | Un repuesto creado en la sucursal A no aparece al operar con la sucursal B. |
| RF-603 | El número de parte es único **por sucursal**. | Must | ✔ | Sucursal | El mismo número de parte se acepta en dos sucursales distintas. |
| RF-604 | El sistema registra movimientos de stock (compra, venta, ajuste, devolución, transferencia, merma) como historial inmutable. | Must | ✔ | Sucursal | Cada movimiento deja registro con existencia anterior y posterior. |
| RF-605 | El sistema recalcula la existencia según el tipo de movimiento: el ajuste fija un valor absoluto, el resto suma o resta. | Must | ✔ | Sucursal | Pruebas por cada tipo de movimiento. |
| RF-606 | El sistema rechaza un movimiento que dejaría la existencia en negativo. | Must | ✔ | Sucursal | La operación devuelve error de negocio y no altera el stock. |
| RF-607 | El sistema señala los repuestos cuya existencia está en o por debajo del mínimo. | Should | ✔ | Sucursal | El listado de bajo stock devuelve solo los que cumplen la condición. |
| RF-608 | El sistema permite transferir existencias entre sucursales de la misma empresa. | Could | ✔ | Sucursal | La transferencia descuenta en origen y suma en destino de forma consistente. |

### RF-700 · Aislamiento y auditoría

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-701 | Una cuenta sin membresía activa en una empresa no puede leer ni escribir ninguno de sus datos. | Must | ✔ | Prueba de aislamiento vía API: devuelve `403`. |
| RF-702 | El aislamiento se cumple **también** cuando se accede a la base de datos sin pasar por la API. | Must | ✔ | Prueba con cliente de base de datos autenticado como otro usuario: las consultas no devuelven filas ajenas. |
| RF-703 | El sistema registra las acciones críticas (cambios de rol, remoción de miembros, bajas) con autor, acción y fecha. | Should | ✔ | El registro persiste aunque se elimine la entidad referenciada. |

### RF-800 · Fuera del alcance del proyecto de grado

Documentados para dar contexto al diseño; su implementación es trabajo posterior (ver [roadmap-competitivo.md](roadmap-competitivo.md)).

| ID | Requisito | Prioridad | Alcance |
|---|---|---|---|
| RF-801 | Gestión de motocicletas asociadas a clientes (nivel empresa). | Must | ✘ |
| RF-802 | Órdenes de trabajo con estados y numeración correlativa por sucursal (nivel sucursal). | Must | ✘ |
| RF-803 | Historial de mantenimiento consolidado por motocicleta (nivel empresa). | Should | ✘ |
| RF-804 | Presupuestos con aprobación del cliente mediante enlace. | Must | ✘ |
| RF-805 | Emisión de factura electrónica del SIN (CUIS/CUFD/CUF, XML firmado). | Must | ✘ |
| RF-806 | Mensajería con el cliente por WhatsApp Business API. | Must | ✘ |
| RF-807 | Agendamiento de citas y portal del cliente. | Should | ✘ |
| RF-808 | Panel de métricas con consolidado por empresa y filtro por sucursal. | Should | ✘ |

---

## 2. Requisitos no funcionales

Cada RNF define un **criterio verificable**: si no se puede comprobar, no es un requisito, es un deseo.

### RNF-100 · Seguridad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-101 | El aislamiento entre empresas se aplica en el motor de base de datos, no solo en la aplicación. | Existen políticas de Row-Level Security activas en todas las tablas de negocio; una consulta directa a la base de datos con la identidad de otro usuario no devuelve filas ajenas. | ✔ |
| RNF-102 | El aislamiento se aplica en dos capas independientes (defensa en profundidad). | Deshabilitar la verificación de la capa de aplicación no produce fuga de datos: RLS lo impide. Se comprueba con una prueba dedicada. | ✔ |
| RNF-103 | Las credenciales privilegiadas no se exponen al cliente ni al repositorio. | Búsqueda en el repositorio sin resultados de claves; la clave de servicio solo se lee de variables de entorno del servidor. | ✔ |
| RNF-104 | La contraseña nunca se almacena ni se transmite en texto plano. | La gestión de credenciales está delegada en el proveedor de identidad; el sistema nunca recibe ni persiste contraseñas. | ✔ |
| RNF-105 | Los mensajes de error no revelan la existencia de recursos de otras empresas. | Un recurso de otra empresa devuelve el mismo error que uno inexistente. | ✔ |
| RNF-106 | La búsqueda de cuentas por email (para invitar) no es explotable como mecanismo de enumeración. | La función solo es ejecutable desde el servidor con credenciales privilegiadas. | ✔ |

### RNF-200 · Calidad y mantenibilidad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-201 | El código está tipado estáticamente y sin errores de tipo. | `npm run typecheck` finaliza sin errores. | ✔ |
| RNF-202 | Toda regla de aislamiento y de negocio tiene prueba automatizada. | La suite cubre los RF marcados `Must` con alcance `✔`; ejecuta en verde. | ✔ |
| RNF-203 | Cada integración al ramal principal ejecuta verificación de tipos y pruebas de forma automatizada. | El pipeline de CI corre en cada push y pull request; un fallo bloquea la integración. | ✔ |
| RNF-204 | Los errores se devuelven en un formato uniforme y con códigos estables. | Todas las respuestas de error siguen ProblemDetails (RFC 7807) con código `modulo.razon`. | ✔ |
| RNF-205 | La entrada de toda operación de escritura se valida antes de tocar la base de datos. | Petición con cuerpo inválido devuelve `400` con el detalle por campo, sin efectos secundarios. | ✔ |
| RNF-206 | Las decisiones de arquitectura quedan registradas con alternativas y consecuencias. | Existe un ADR por cada decisión estructural tomada. | ✔ |

### RNF-300 · Despliegue y operación

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-301 | El backend se despliega sin administrar servidores. | Despliegue exitoso como funciones serverless; no existe infraestructura propia que aprovisionar. | ✔ |
| RNF-302 | El costo de infraestructura es proporcional al uso, sin costo fijo por empresa. | El modelo de despliegue elegido escala a cero cuando no hay tráfico. | ✔ |
| RNF-303 | La configuración por entorno se realiza sin modificar el código. | Cambiar de entorno solo requiere variables de entorno distintas. | ✔ |
| RNF-304 | El esquema de base de datos evoluciona mediante migraciones versionadas. | Cada cambio de esquema es un archivo de migración aplicable de forma reproducible. | ✔ |

### RNF-400 · Usabilidad y compatibilidad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-401 | El cambio de empresa y de sucursal está disponible de forma explícita, sin cerrar sesión. | El usuario cambia de contexto y los datos mostrados corresponden al nuevo contexto. | ✔ |
| RNF-402 | La interfaz es utilizable en navegador de escritorio y móvil. | Diseño responsivo verificado en ambos anchos. | ✔ |
| RNF-403 | La aplicación es instalable como PWA. | El manifiesto permite la instalación desde el navegador. | Should ✔ |

### RNF-500 · Rendimiento *(fuera de alcance como objetivo medible)*

| ID | Requisito | Nota | Alcance |
|---|---|---|---|
| RNF-501 | Las operaciones habituales responden en un tiempo aceptable para uso interactivo. | No se establece un umbral formal ni se realizan pruebas de carga: quedó excluido del alcance (§1.8.3). Se documenta como criterio cualitativo. | ✘ |

---

## 3. Trazabilidad requisito → objetivo

| # | Objetivo específico ([§1.7](tesis/01-definicion-y-alcance.md)) | Requisitos que lo materializan |
|---|---|---|
| 1 | **Analizar** estrategias de aislamiento multi-tenant | — (fundamenta RNF-101 y RNF-102) |
| 2 | **Comparar** soluciones con presencia en Bolivia | — (fundamenta el alcance funcional y los RF-800) |
| 3 | **Diseñar** el modelo de datos jerárquico | RF-301, RF-302, RF-502, RF-602, RF-603, RNF-304 |
| 4 | **Especificar** las políticas de aislamiento | RF-303, RF-701, RF-702, RNF-101, RNF-105, RNF-106, RNF-206 |
| 5 | **Implementar** identidad, jerarquía y control de acceso | RF-101 a RF-104, RF-201 a RF-204, RF-304, RF-305, RF-401 a RF-407, RNF-204, RNF-205, RNF-301 a RNF-303, RNF-401 |
| 6 | **Desarrollar** el corte vertical de demostración | RF-501 a RF-505, RF-601 a RF-608, RF-703, RNF-402 |
| 7 | **Automatizar** la integración continua | RNF-201, RNF-202, RNF-203 |
| 8 | **Validar** el aislamiento con evidencia reproducible | RF-701, RF-702, RNF-102, RNF-103, RNF-104 |
