# Requisitos

Requisitos funcionales (RF) y no funcionales (RNF) del proyecto. Cada requisito tiene identificador estable, prioridad, criterio de verificación y trazabilidad al objetivo específico que lo sustenta ([anteproyecto/01-definicion-y-alcance.md](../anteproyecto/01-definicion-y-alcance.md) §1.7).

> Terminología: [Glosario](01-glosario.md) · Modelo de datos: [Modelo de datos](05-modelo-datos.md) · Historias de usuario: [Historias de usuario](03-historias-usuario.md)
>
> La columna **Verificación** enuncia el criterio; los casos de prueba que lo ejecutan, con su nivel y su evidencia, están en el [Plan de pruebas](11-plan-pruebas.md). La interfaz por la que se ejercen estos requisitos está fijada en el [Contrato de la interfaz de programación](10-contrato-api.md).

## Convenciones

- **Prioridad** — `Must`: sin esto el proyecto no cumple su objetivo · `Should`: importante, no bloqueante · `Could`: deseable si sobra tiempo.
- **Alcance** — dentro (`Sí`) o fuera (`No`) del alcance del proyecto de grado (§1.8). Los requisitos fuera de alcance se documentan porque definen el producto completo y dan contexto al diseño, pero no se implementan en este período.
- **Nivel** — si el dato que gobierna el requisito es de **organización** o de **taller**. La columna aparece solo en los bloques cuyo nivel debe declararse explícitamente porque el corte vertical lo demuestra (RF-300, RF-500, RF-600); los de identidad, organizaciones, miembros y aislamiento (RF-100, RF-200, RF-400, RF-700) son siempre de nivel **organización** y por eso no la llevan.

---

## 1. Requisitos funcionales

### RF-100 · Identidad y cuentas

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-101 | El sistema permite registrar una cuenta con email y contraseña, creando en el mismo acto su primera organización, su primer taller y la membresía `Owner`. | Must | Sí | Prueba de integración: tras el registro, `GET /api/auth/me` devuelve una organización con rol `owner`. |
| RF-102 | El sistema permite iniciar sesión y renovar la sesión sin intervención del usuario. | Must | Sí | Login devuelve token válido; el token expirado se renueva de forma transparente. |
| RF-103 | El sistema verifica el token en cada petición y rechaza las peticiones sin credenciales válidas. | Must | Sí | Petición sin token devuelve `401`; con token inválido, `401`. |
| RF-104 | El sistema permite consultar el perfil de la cuenta autenticada junto con las organizaciones a las que pertenece y su rol en cada una. | Must | Sí | `GET /api/auth/me` devuelve perfil + lista de organizaciones con rol. |

### RF-200 · Organizaciones

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-201 | Una cuenta puede crear organizaciones adicionales, quedando como `Owner` de cada una. | Must | Sí | Tras crear una segunda organización, aparece en el listado con rol `owner`. |
| RF-202 | El sistema lista las organizaciones de la cuenta **según su membresía activa**, no según quién las creó. | Must | Sí | Un miembro invitado ve la organización en su listado aunque no sea su creador. |
| RF-203 | El usuario puede seleccionar la organización activa sobre la que opera. | Must | Sí | El cambio devuelve la organización y el rol; las peticiones posteriores operan sobre ella. |
| RF-204 | El `Owner` puede editar los datos de su organización. | Should | Sí | Un no-`Owner` recibe `403` al intentarlo. |

### RF-300 · Talleres

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-301 | El `Owner` puede crear talleres dentro de su organización y editar sus datos. | Must | Sí | Organización | El taller creado aparece en el listado de la organización; la edición se refleja en su ficha y un no-`Owner` que intenta crear o editar recibe `403`. |
| RF-302 | El sistema lista los talleres de la organización activa. | Must | Sí | Organización | Solo devuelve talleres de la organización activa. |
| RF-303 | El usuario puede seleccionar el taller activo, y el sistema rechaza un taller que no pertenezca a la organización activa. | Must | Sí | Organización | Enviar el identificador de un taller ajeno se trata como inexistente: devuelve `404 workshop.not_found` (regla de no divulgación, RNF-105). |
| RF-304 | El `Owner` puede asignar miembros a uno o varios talleres, sin que ello altere sus permisos. | Should | Sí | Organización | La asignación se registra; el acceso a datos sigue determinado por el rol. |
| RF-305 | El `Owner` puede desactivar un taller sin eliminar su historial. | Should | Sí | Organización | El taller desactivado deja de listarse como activo; sus datos siguen consultables. |

### RF-400 · Miembros y control de acceso

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-401 | El `Owner` puede invitar a una cuenta existente a su organización, asignándole rol `Mechanic` o `Receptionist`. | Must | Sí | Tras la invitación, el invitado accede a la organización; antes recibía `403`. |
| RF-402 | El sistema impide invitar a alguien directamente como `Owner`, de modo que cada organización conserve **un solo propietario activo**. | Must | Sí | La petición con rol `owner` es rechazada por validación; además, una inserción directa en la base de datos que crearía un segundo propietario activo es rechazada por el motor. |
| RF-403 | El `Owner` puede cambiar el rol de un miembro. | Must | Sí | El cambio se refleja en el listado de miembros. |
| RF-404 | El `Owner` puede remover a un miembro de la organización. | Must | Sí | El removido pierde el acceso inmediatamente. |
| RF-405 | El sistema impide cambiar el rol del `Owner` de la organización o removerlo. | Must | Sí | Ambas operaciones devuelven error de negocio específico. |
| RF-406 | Solo el `Owner` puede gestionar miembros; los demás roles reciben error de permisos. | Must | Sí | Un `Mechanic` que intenta invitar recibe `403`. |
| RF-407 | El sistema lista los miembros de la organización con su rol y estado. | Should | Sí | Cualquier miembro puede consultarlo. |

### RF-500 · Clientes *(corte vertical — nivel organización)*

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-501 | El sistema permite registrar clientes en la organización activa. | Must | Sí | Organización | El cliente creado se recupera por identificador. |
| RF-502 | Los clientes son visibles desde **cualquier taller** de la organización. | Must | Sí | Organización | Un cliente creado con el taller A activo se lista con el taller B activo. |
| RF-503 | El email del cliente es único dentro de la organización, y no colisiona entre organizaciones distintas. | Must | Sí | Organización | Email duplicado en la misma organización falla; el mismo email en otra organización se acepta. |
| RF-504 | El sistema permite editar, buscar y dar de baja lógica a un cliente. | Must | Sí | Organización | La baja conserva el registro y lo excluye de los listados activos. |
| RF-505 | `Owner` y `Receptionist` pueden crear y editar clientes; `Mechanic` solo consultarlos. | Should | Sí | Organización | Un `Mechanic` que intenta crear recibe `403`. |

### RF-600 · Inventario *(corte vertical — nivel taller)*

| ID | Requisito | Prioridad | Alcance | Nivel | Verificación |
|---|---|---|---|---|---|
| RF-601 | El sistema permite registrar repuestos en el taller activo. | Must | Sí | Taller | El repuesto queda asociado al taller donde se creó. |
| RF-602 | El inventario de un taller **no** se mezcla con el de otro de la misma organización. | Must | Sí | Taller | Un repuesto creado en el taller A no aparece al operar con el taller B. |
| RF-603 | El número de parte es único **por taller**. | Must | Sí | Taller | El mismo número de parte se acepta en dos talleres distintos. |
| RF-604 | El sistema registra movimientos de stock como historial inmutable. Los tipos registrables por el usuario son compra, venta, ajuste, devolución y merma; el tipo *transferencia* no se registra de forma directa, lo genera RF-608. | Must | Sí | Taller | Cada movimiento deja registro con existencia anterior y posterior. La parte `Must` de este requisito se verifica con los cinco tipos directos, de modo que no depende de RF-608 (`Could`). |
| RF-605 | El sistema recalcula la existencia según el tipo de movimiento: el ajuste fija un valor absoluto, el resto suma o resta. | Must | Sí | Taller | Pruebas por cada tipo de movimiento. |
| RF-606 | El sistema rechaza un movimiento que dejaría la existencia en negativo. | Must | Sí | Taller | La operación devuelve error de negocio y no altera el stock. |
| RF-607 | El sistema señala los repuestos cuya existencia está en o por debajo del mínimo. | Should | Sí | Taller | El listado de bajo stock devuelve solo los que cumplen la condición. |
| RF-608 | El sistema permite transferir existencias entre talleres de la misma organización. | Could | Sí | Taller | La transferencia descuenta en origen y suma en destino de forma consistente. |
| RF-609 | `Owner` y `Receptionist` pueden crear y editar el catálogo de repuestos; la transferencia entre talleres queda reservada al `Owner`. Cualquier miembro puede consultar el inventario y registrar movimientos. | Should | Sí | Taller | Un `Mechanic` que intenta crear o editar un repuesto recibe `403`; consultar y registrar movimientos sí puede. La cláusula sobre la transferencia solo se ejerce si RF-608 llega a implementarse (`Could`), de modo que este requisito **no depende de él**: su parte `Should` queda cubierta con el reparto de permisos sobre el catálogo. |

### RF-700 · Aislamiento y auditoría

| ID | Requisito | Prioridad | Alcance | Verificación |
|---|---|---|---|---|
| RF-701 | Una cuenta sin membresía activa en una organización no puede leer ni escribir ninguno de sus datos. | Must | Sí | Prueba de aislamiento vía API: `403 organization.access_denied` cuando se declara el contexto ajeno y `404` del módulo cuando se referencia un recurso ajeno desde el contexto propio (§5 del [Contrato](10-contrato-api.md)). |
| RF-702 | El aislamiento se cumple **también** cuando se accede a la base de datos sin pasar por la API. | Must | Sí | Prueba con cliente de base de datos autenticado como otro usuario: las consultas no devuelven filas ajenas. |
| RF-703 | El sistema registra las acciones críticas con autor, acción y fecha. Son acciones críticas: la invitación de un miembro, el cambio de rol, la remoción de un miembro, la modificación de los datos de la organización (RF-204), la desactivación de un taller (RF-305) y la baja lógica de un cliente (RF-504). | Should | Sí | El registro persiste aunque se elimine la entidad referenciada. Existe una prueba por cada una de las seis acciones. |
| RF-704 | La consulta del registro de auditoría está reservada al `Owner` de la organización. | Should | Sí | Un `Mechanic` o `Receptionist` que intenta consultarlo recibe `403`; la restricción se aplica también por acceso directo a la base de datos. |

### RF-800 · Fuera del alcance del proyecto de grado

Documentados para dar contexto al diseño; su implementación es trabajo posterior (ver [Análisis del mercado](09-analisis-mercado.md)).

| ID | Requisito | Prioridad | Alcance |
|---|---|---|---|
| RF-801 | Gestión de motocicletas asociadas a clientes (nivel organización). | Must | No |
| RF-802 | Órdenes de trabajo con estados y numeración correlativa por taller (nivel taller). | Must | No |
| RF-803 | Historial de mantenimiento consolidado por motocicleta (nivel organización). | Should | No |
| RF-804 | Presupuestos con aprobación del cliente mediante enlace. | Must | No |
| RF-805 | Emisión de factura electrónica del SIN (CUIS/CUFD/CUF, XML firmado). | Must | No |
| RF-806 | Mensajería con el cliente por WhatsApp Business API. | Must | No |
| RF-807 | Agendamiento de citas y portal del cliente. | Should | No |
| RF-808 | Panel de métricas con consolidado por organización y filtro por taller. | Should | No |

---

## 2. Requisitos no funcionales

Cada RNF define un **criterio verificable**: si no se puede comprobar, no es un requisito, es un deseo.

Las tablas de esta sección no llevan columna de prioridad porque el reparto es uniforme: **todos los RNF de alcance `Sí` son `Must`, salvo RNF-403 y RNF-404, que son `Should`**. RNF-501 queda fuera de alcance y por eso no recibe prioridad.

RNF-404 es `Should` de forma deliberada: la hipótesis del proyecto es sobre el **aislamiento**, no sobre la interfaz. Un resultado de usabilidad por debajo de sus umbrales es un hallazgo que debe reportarse y discutirse, no un incumplimiento que invalide la tesis.

### RNF-100 · Seguridad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-101 | El aislamiento entre organizaciones se aplica en el motor de base de datos, no solo en la aplicación. | Existen políticas de Row-Level Security activas en las **siete tablas de negocio** censadas en el [Modelo de datos](05-modelo-datos.md); una consulta directa a la base de datos con la identidad de otro usuario no devuelve filas ajenas en ninguna de ellas. | Sí |
| RNF-102 | El aislamiento se aplica en dos capas independientes (defensa en profundidad). | Deshabilitar la verificación de la capa de aplicación no produce fuga de datos: RLS lo impide. Se comprueba con una prueba dedicada. | Sí |
| RNF-103 | Las credenciales privilegiadas no se exponen al cliente ni al repositorio. | Búsqueda en el repositorio sin resultados de claves; la clave de servicio solo se lee de variables de entorno del servidor. | Sí |
| RNF-104 | La contraseña nunca se almacena ni se transmite en texto plano. | La gestión de credenciales está delegada en el proveedor de identidad; el sistema nunca recibe ni persiste contraseñas. | Sí |
| RNF-105 | Los mensajes de error no revelan la existencia de recursos de otras organizaciones. | Un recurso de otra organización devuelve el mismo error que uno inexistente. | Sí |
| RNF-106 | La búsqueda de cuentas por email (para invitar) no es explotable como mecanismo de enumeración. | La función solo es ejecutable desde el servidor con credenciales privilegiadas. | Sí |

### RNF-200 · Calidad y mantenibilidad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-201 | El código está tipado estáticamente y sin errores de tipo. | `npm run typecheck` finaliza sin errores. | Sí |
| RNF-202 | Toda regla de aislamiento y de negocio tiene prueba automatizada. | La suite cubre los RF marcados `Must` con alcance `Sí`; ejecuta en verde. | Sí |
| RNF-203 | Cada integración al ramal principal ejecuta verificación de tipos y pruebas de forma automatizada. | El pipeline de CI corre en cada push y pull request; un fallo bloquea la integración. | Sí |
| RNF-204 | Los errores se devuelven en un formato uniforme y con códigos estables. | Todas las respuestas de error siguen Problem Details (RFC 9457, que sustituye al RFC 7807) con código `modulo.razon`. | Sí |
| RNF-205 | La entrada de toda operación de escritura se valida antes de tocar la base de datos. | Petición con cuerpo inválido devuelve `400` con el detalle por campo, sin efectos secundarios. | Sí |
| RNF-206 | Las decisiones de arquitectura quedan registradas con alternativas y consecuencias. | Existe un ADR por cada decisión estructural tomada. | Sí |

### RNF-300 · Despliegue y operación

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-301 | El backend se despliega sin administrar servidores. | Despliegue exitoso como funciones serverless; no existe infraestructura propia que aprovisionar. | Sí |
| RNF-302 | El costo de infraestructura es proporcional al uso, sin costo fijo por organización. | El modelo de despliegue elegido escala a cero cuando no hay tráfico. | Sí |
| RNF-303 | La configuración por entorno se realiza sin modificar el código. | Cambiar de entorno solo requiere variables de entorno distintas. | Sí |
| RNF-304 | El esquema de base de datos evoluciona mediante migraciones versionadas. | Cada cambio de esquema es un archivo de migración aplicable de forma reproducible. | Sí |

### RNF-400 · Usabilidad y compatibilidad

| ID | Requisito | Criterio de aceptación | Alcance |
|---|---|---|---|
| RNF-401 | El cambio de organización y de taller está disponible de forma explícita, sin cerrar sesión. | El usuario cambia de contexto y los datos mostrados corresponden al nuevo contexto. | Sí |
| RNF-402 | La interfaz es utilizable en navegador de escritorio y móvil. | Diseño responsivo verificado en ambos anchos. | Sí |
| RNF-403 | La aplicación es instalable como PWA. | El manifiesto permite la instalación desde el navegador. | Sí |
| RNF-404 | El cambio de contexto entre organizaciones y talleres resulta operable por un usuario del rubro sin formación previa. | Evaluación con operadores mediante tareas guiadas: **tasa de éxito ≥ 80 %** por tarea y **puntuación SUS ≥ 68** en la escala de Brooke (1996), umbral que corresponde al promedio de la industria según el baremo de Bangor et al. (2008). | Sí |

### RNF-500 · Rendimiento *(fuera de alcance como objetivo medible)*

| ID | Requisito | Nota | Alcance |
|---|---|---|---|
| RNF-501 | Las operaciones habituales responden en un tiempo aceptable para uso interactivo. | No se establece un umbral formal ni se realizan pruebas de carga: quedó excluido del alcance (§1.8.3). Se documenta como criterio cualitativo. | No |

---

## 3. Trazabilidad requisito → objetivo

| # | Objetivo específico ([§1.7](../anteproyecto/01-definicion-y-alcance.md)) | Requisitos que lo materializan |
|---|---|---|
| 1 | **Analizar** las estrategias de aislamiento y la oferta boliviana | — (fundamenta RNF-101 y RNF-102, el alcance funcional y los RF-800) |
| 2 | **Diseñar** el modelo jerárquico y **especificar** las políticas de aislamiento | RF-301, RF-302, RF-303, RF-502, RF-602, RF-603, RF-701, RF-702, RNF-101, RNF-105, RNF-106, RNF-206, RNF-304 |
| 3 | **Implementar** la arquitectura y **automatizar** su verificación | RF-101 a RF-104, RF-201 a RF-204, RF-304, RF-305, RF-401 a RF-407, RF-501 a RF-505, RF-601 a RF-609, RF-703, RF-704, RNF-103, RNF-104, RNF-201 a RNF-205, RNF-301 a RNF-303, RNF-401 a RNF-403 |
| 4 | **Validar** el aislamiento con evidencia reproducible y **evaluar** la usabilidad del cambio de contexto | RF-701, RF-702, RNF-102, RNF-404 |

Todo requisito con alcance `Sí` aparece al menos en una fila de esta tabla. Cinco aparecen en dos, porque un objetivo los **especifica** y otro los **materializa**: RF-502, RF-602 y RF-603 se diseñan en el objetivo 2 —son las reglas de alcance por nivel— y se implementan en el 3; RF-701 y RF-702 se especifican en el objetivo 2 y se validan en el 4. RNF-501 no aparece por estar fuera de alcance.
