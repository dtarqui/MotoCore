# Plan de pruebas y validación

Estrategia de verificación del sistema y matriz de trazabilidad **requisito → caso de prueba → evidencia**. Materializa RNF-202 —toda regla de aislamiento y de negocio tiene prueba automatizada—, sostiene el objetivo específico 4 —validar el aislamiento frente a la línea base— y especifica cómo se ejecutan los objetivos complementarios 5 y 6 ([anteproyecto/01](../anteproyecto/01-definicion-y-alcance.md) §1.7).

> Requisitos: [02-requisitos.md](02-requisitos.md) · Contrato verificado: [10-contrato-api.md](10-contrato-api.md) · Políticas: [05-modelo-datos.md](05-modelo-datos.md) · Cronograma: [08-plan-trabajo.md](08-plan-trabajo.md) · Diseño de la investigación: [anteproyecto](../anteproyecto/04-anteproyecto-integrado.md) §15–§18
>
> **Este documento especifica la verificación, no reporta resultados.** Define qué debe probarse y con qué criterio se da por probado. La ejecución y sus resultados son evidencia de la fase de validación (F4).

---

## 1. Estrategia

### 1.1 Qué gobierna la selección de pruebas

El sistema no se prueba de manera uniforme: se concentra el esfuerzo donde un fallo es **irreversible o silencioso**. Una regla de aislamiento que falla no produce un error visible —produce una fuga que nadie observa—, y por eso el aislamiento recibe un nivel propio, con dos vías independientes y una línea base contra la que se contrasta.

1. **Todo requisito `Must` con alcance `Sí` tiene al menos un caso ejecutable** (RNF-202). Lo que no se puede ejecutar no se declara cumplido.
2. **El aislamiento se prueba por duplicado**, una vez por cada capa de defensa (ADR-002), y **frente a la línea base** (condición C0).
3. **Lo no ejecutable se declara como tal.** Los requisitos que se comprueban por inspección se marcan explícitamente.

### 1.2 Estrategia multinivel

| Nivel | Nivel equivalente de la guía | Qué verifica | Herramienta | Qué necesita | Cuándo corre |
|---|---|---|---|---|---|
| **N0 · Inspección** | Auditorías | Ausencia de secretos, decisiones registradas, configuración por entorno | Revisión y búsqueda de secretos | Repositorio y configuración | Por hito |
| **N1 · Unitaria** | Unitarias | Reglas puras: esquemas de validación, cálculo de existencias, resolución de permisos por rol | Vitest | Nada externo | En cada integración |
| **N2 · Contrato HTTP** | Integración con base simulada | La interfaz **antes** de tocar la base: credencial, contexto obligatorio, forma del error, validación de entrada | Vitest | La aplicación en memoria | En cada integración |
| **N3 · Integración** | Integración | Flujo completo contra base de datos y proveedor de identidad reales | Vitest | Entorno de *staging* con migraciones aplicadas | En cada integración con credenciales; siempre antes de cada hito |
| **N4 · Aislamiento** | — *(específico del proyecto)* | Condiciones C0 a C3 por las dos vías | Vitest con cliente HTTP y cliente PostgreSQL con identidad ajena | Proyecto de validación desechable | Antes de cada hito; tres corridas en I8 |
| **N5 · Usabilidad** | — *(objetivo complementario 5)* | Cambio de contexto frente al cambio de cuenta | Guion de tareas, cronómetro y cuestionario SUS | Entorno de producción y operadores | Una vez, en I8 |
| **N6 · Componente del cliente** | Componente UI | El contrato desde el cliente: cabeceras de contexto, regla de rutas y códigos de error | Vitest sobre DOM simulado | Nada externo | En cada integración |
| **N7 · Extremo a extremo** | E2E y auditorías | Flujos T1–T3, instalabilidad y diseño responsivo | Playwright | Cliente web e interfaz publicados en *staging* | Tras cada publicación en *staging*; un fallo bloquea la promoción a producción |

Además de estos niveles, la marca **CI** identifica las propiedades que verifica el propio pipeline: tipos, cobertura, auditoría de dependencias y bloqueo ante fallo.

### 1.3 Qué cubre N6, y qué deliberadamente no

N6 evalúa el **cumplimiento del contrato desde el lado del cliente**, que la evaluación con operadores no puede observar: un participante puede completar las tareas mientras el cliente envía una cabecera equivocada.

| Cubre | No cubre |
|---|---|
| Que cambiar de organización limpie el taller activo | Si la pantalla resulta comprensible — eso es N5 |
| Que `X-Org-Id` viaje siempre y `X-Workshop-Id` solo en endpoints de nivel taller | Diseño responsivo e instalabilidad — eso es N7 |
| Que el código de negocio del error sobreviva al cliente | Recorridos completos de usuario — eso es N7 |
| Regresión de la regla de rutas y del método de las bajas lógicas ([contrato](10-contrato-api.md) §2.3 y §2.6) | Rendimiento |

### 1.4 Qué cubre N7

N7 automatiza lo que se puede observar sin una persona: que los flujos T1–T3 **funcionan** de extremo a extremo, que la aplicación es instalable y que no desborda en anchos de escritorio y móvil. **No sustituye a N5**: que un flujo funcione no dice si un operador lo comprende.

### 1.5 Qué queda deliberadamente fuera

| Fuera del plan | Motivo |
|---|---|
| Pruebas de carga, estrés y rendimiento | El dominio no las justifica ([definición y alcance](../anteproyecto/01-definicion-y-alcance.md) §1.8.3); RNF-501 queda como criterio cualitativo |
| Pruebas de penetración | El alcance cubre el aislamiento entre inquilinos, no una evaluación ofensiva del despliegue |
| Mitigación del canal lateral temporal de la seguridad a nivel de fila | Amenaza documentada (marco teórico §3.3); su mitigación excede el objeto del proyecto |
| Evaluación de usabilidad de la interfaz completa | La evaluación se acota al cambio de contexto |

---

## 2. KPIs de calidad

| KPI | Umbral | Requisito | Caso | Nivel |
|---|---|---|---|---|
| Cobertura de líneas de los servicios de dominio del servidor | **≥ 80 %** | RNF-207 | CP-N207 | CI |
| Requisitos `Must` de alcance `Sí` con caso en verde | **100 %** | RNF-202 | CP-N202 | CI |
| Errores de verificación de tipos | **0** | RNF-201 | CP-N201 | CI |
| Vulnerabilidades críticas o altas en dependencias | **0** | RNF-208 | CP-N208 | CI |
| Integraciones al ramal principal con pipeline en verde | **100 %** | RNF-203 | CP-N203 | CI |
| Filas ajenas devueltas bajo C1, C2 y C3 | **0** | RNF-101, RNF-102 | CP-N101, CP-N102 | N4 |

---

## 3. Entorno y datos de prueba

### 3.1 Entornos

| Entorno | Niveles | Datos | Restricción |
|---|---|---|---|
| **Local y pipeline** | N1, N2, N6 | Ninguno persistente | — |
| **Staging** | N3, N7 | Generados por las pruebas | Nunca se deshabilitan políticas |
| **Proyecto de validación desechable** | N4 | Escenario sintético, reconstruido en cada ciclo | **Único entorno donde existe la condición C0** |
| **Producción** | N5 | Escenario sintético precargado para las sesiones | Sin datos reales de ninguna organización |

### 3.2 Escenario base

Todas las pruebas de N3 y N4 parten del mismo escenario, construido por el propio caso —nunca de datos preexistentes—:

```
Cuenta A ──owner──> Organización 1 ──> Taller 1.1
                        │            └── repuestos de 1.1
                        ├──> Taller 1.2
                        │       └── repuestos de 1.2
                        └── clientes de la Organización 1

Cuenta A ──owner──> Organización 2          (misma cuenta, otra organización)

Cuenta B ──owner──> Organización 3 ──> Taller 3.1
                        └── clientes de la Organización 3

Cuenta C  ── sin membresía en ninguna de las anteriores
```

Un solo montaje cubre las tres preguntas del aislamiento: **entre cuentas** (A frente a B), **entre organizaciones de la misma cuenta** (1 frente a 2) y **frente a quien no es miembro de ninguna** (C).

### 3.3 Escenario de línea base para la usabilidad

Para la condición de **cambio de cuenta** del objetivo 5, cada local del escenario se opera con una **cuenta propia**, dueña de una organización con un único taller: es la situación del software de un solo inquilino, reproducida con el mismo sistema (alternativa 1 de ADR-006).

### 3.4 Independencia entre ejecuciones

- Cada ejecución crea sus cuentas con correos irrepetibles; ninguna prueba depende del orden ni del rastro de otra.
- Ningún caso modifica datos que otro caso vaya a leer.
- La base de pruebas se reconstruye desde las migraciones versionadas (RNF-304).

---

## 4. Orden de escritura

**Las pruebas de aislamiento se escriben antes que la funcionalidad que protegen.** Es la mitigación del riesgo R1 del [plan de trabajo](08-plan-trabajo.md) y se apoya en el uso de la prueba como especificación ejecutable (Beck, 2002; marco teórico §3.2.5).

1. Se escribe el caso de aislamiento del módulo: una cuenta ajena **no** ve estos datos. Falla, porque el módulo no existe.
2. Se escriben los casos de contrato: sin credencial, sin contexto activo, con entrada inválida.
3. Se construye el módulo hasta que los tres pasan.
4. Se añaden los casos funcionales del requisito, con sus criterios *Dado–Cuando–Entonces*.

---

## 5. Matriz de trazabilidad

Identificación de casos: **CP-nnn**, donde `nnn` es el número del requisito que verifican; los sufijos `.1`, `.2` distinguen casos de un mismo requisito. Los casos de línea base se identifican como **CP-LB**, y los del costo, como **CP-O6**.

### 5.1 Identidad y cuentas

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-101 | CP-101.1 | N3 | Tras registrar, la cuenta tiene una organización, un taller y membresía `owner` |
| RF-101 | CP-101.2 | N3 | Un correo ya registrado se rechaza y **no** crea organización alguna |
| RF-101 | CP-101.3 | N3 | Si falla la creación de la organización, no queda cuenta ni registro huérfano (atomicidad, ADR-007) |
| RF-101 | CP-101.4 | N2 | Contraseña de menos de 8 caracteres: `400` con el campo señalado |
| RF-102 | CP-102 | N3 | Una credencial emitida por el proveedor es aceptada por la interfaz |
| RF-103 | CP-103.1 | N2 | Petición sin credencial a un recurso protegido: `401 auth.missing_token` |
| RF-103 | CP-103.2 | N2 | Credencial inválida: `401 auth.invalid_token` |
| RF-104 | CP-104 | N3 | Devuelve perfil y organizaciones con membresía **activa**, cada una con su rol |

### 5.2 Organizaciones y talleres

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-201 | CP-201 | N3 | La segunda organización aparece en el listado con rol `owner` |
| RF-202 | CP-202 | N3 | Un invitado ve la organización aunque no sea su creador; un removido deja de verla |
| RF-203 | CP-203.1 | N3 | El cambio devuelve la organización y el rol; las peticiones posteriores operan sobre ella |
| RF-203 | CP-203.2 | N3 | Activar una organización sin membresía: `403 organization.access_denied` |
| RF-204 | CP-204 | N3 | El `Owner` edita; un no-`Owner` recibe `403` |
| RF-301 | CP-301.1 | N3 | El taller creado aparece en el listado de la organización |
| RF-301 | CP-301.2 | N3 | Un no-`Owner` que intenta crear recibe `403` |
| RF-301 | CP-301.3 | N3 | La edición del taller se refleja en su ficha; un no-`Owner` que intenta editar recibe `403` |
| RF-302 | CP-302 | N3 | El listado devuelve **solo** talleres de la organización activa |
| RF-303 | CP-303.1 | N2 | Operación de nivel taller sin `X-Workshop-Id`: `400 workshop.missing_active_workshop` |
| RF-303 | CP-303.2 | N3 | Taller de otra organización en la cabecera: `404 workshop.not_found` |
| RF-304 | CP-304.1 | N3 | La asignación se registra y se puede retirar sin afectar la membresía |
| RF-304 | CP-304.2 | N3 | La asignación **no** altera lo que el miembro puede ver (ADR-006) |
| RF-305 | CP-305 | N3 | El taller desactivado deja de listarse como activo; sus datos siguen consultables |

### 5.3 Miembros y control de acceso

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-401 | CP-401.1 | N3 | Tras la invitación el invitado accede; antes recibía `403` |
| RF-401 | CP-401.2 | N3 | Correo sin cuenta: `404 member.not_found` |
| RF-401 | CP-401.3 | N3 | Reincorporar a alguien removido **reactiva** su membresía, no la duplica |
| RF-402 | CP-402.1 | N2 | Invitar con rol `owner`: rechazo por validación |
| RF-402 | CP-402.2 | **N4 · vía base de datos** | Una inserción directa de una segunda membresía activa con rol `owner` en la misma organización es rechazada por el motor |
| RF-403 | CP-403 | N3 | El cambio se refleja en el listado y surte efecto inmediato |
| RF-404 | CP-404 | N3 | El removido pierde el acceso de inmediato |
| RF-405 | CP-405 | N3 | Cambiar el rol del propietario o removerlo: `403 member.owner_protected` |
| RF-406 | CP-406 | N3 | Un `Mechanic` que intenta invitar: `403` |
| RF-407 | CP-407 | N3 | Cualquier miembro consulta el listado, con rol y estado |

### 5.4 Clientes — nivel organización

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-501 | CP-501 | N3 | El cliente creado se recupera por identificador |
| RF-502 | CP-502 | N3 | Un cliente creado con el taller A activo **se lista** con el taller B activo |
| RF-503 | CP-503.1 | N3 | Correo duplicado en la misma organización: `409 client.duplicate_email` |
| RF-503 | CP-503.2 | N3 | El mismo correo en otra organización se acepta |
| RF-504 | CP-504.1 | N3 | La baja conserva el registro y lo excluye de los listados activos |
| RF-504 | CP-504.2 | N3 | La búsqueda por nombre o correo opera dentro de la organización activa |
| RF-505 | CP-505 | N3 | Un `Mechanic` que intenta crear: `403`; consultar sí puede |

### 5.5 Inventario — nivel taller

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-601 | CP-601 | N3 | El repuesto queda asociado al taller activo |
| RF-602 | CP-602 | N3 | Un repuesto del taller A **no** aparece al operar con el taller B |
| RF-603 | CP-603.1 | N3 | Número de parte duplicado en el mismo taller: `409` |
| RF-603 | CP-603.2 | N3 | El mismo número de parte se acepta en otro taller |
| RF-604 | CP-604.1 | N3 | Cada movimiento deja registro con existencia anterior y posterior — un caso por cada uno de los cinco tipos directos |
| RF-604 | CP-604.2 | N2 | El tipo `transferencia` enviado directamente se rechaza |
| RF-604 | CP-604.3 | N3 | Los movimientos no admiten modificación ni borrado |
| RF-605 | CP-605 | N1 | Cálculo por tipo: `compra` y `devolucion` suman, `venta` y `merma` restan, `ajuste` fija valor absoluto |
| RF-606 | CP-606 | N3 | El movimiento que dejaría existencia negativa se rechaza y **no** altera el stock |
| RF-607 | CP-607 | N3 | El listado de bajo stock devuelve solo los que están en o bajo el mínimo |
| RF-608 | CP-608.1 | N3 | La transferencia descuenta en origen y suma en destino de forma consistente |
| RF-608 | CP-608.2 | N3 | Origen sin existencia suficiente: la operación se rechaza **completa** |
| RF-608 | CP-608.3 | N3 | Destino fuera de la organización: `403 inventory.cross_organization_transfer` |
| RF-609 | CP-609 | N3 | Un `Mechanic` que intenta crear o editar un repuesto: `403 inventory.insufficient_permissions`; consultar y registrar movimientos sí puede. Un `Receptionist` que intenta transferir: `403` |

### 5.6 Aislamiento y auditoría

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-701 | CP-701 | **N4 · vía interfaz** | Bajo C1, una cuenta sin membresía no obtiene dato alguno en ninguna operación —lectura y escritura—, respondiendo según §5 del [contrato](10-contrato-api.md) |
| RF-702 | CP-702 | **N4 · vía base de datos** | Bajo C3, consultas con la identidad de otra cuenta no devuelven filas ajenas |
| RF-703 | CP-703.1–.6 | N3 | Un caso por cada acción crítica: invitación, cambio de rol, remoción, modificación de la organización, desactivación de taller y baja de cliente |
| RF-703 | CP-703.7 | N3 | El registro persiste tras eliminar la entidad o la cuenta referenciada |
| RF-704 | CP-704.1 | N3 | `Mechanic` o `Receptionist` que consulta la auditoría: `403` |
| RF-704 | CP-704.2 | **N4 · vía base de datos** | Un miembro no propietario no lee el registro por acceso directo |

### 5.7 Línea base

Casos que **deben mostrar la fuga**: si no la muestran, la línea base no discrimina y el resultado de la hipótesis se declara no concluyente ([anteproyecto](../anteproyecto/04-anteproyecto-integrado.md) §10.3).

| Caso | Nivel | Condición | Criterio ejecutable |
|---|---|---|---|
| CP-LB1 | **N4 · vía base de datos** | C0 | Con las políticas deshabilitadas, la consulta con identidad ajena devuelve filas ajenas en **cada una** de las 7 tablas de negocio; se registra el recuento por tabla |
| CP-LB2 | **N4 · vía interfaz** | C0 | Con políticas deshabilitadas y verificación de membresía omitida, las operaciones de lectura sobre datos ajenos devuelven datos de la organización ajena; se registra el recuento por operación |

### 5.8 Requisitos no funcionales

| Req. | Caso | Nivel | Criterio |
|---|---|---|---|
| RNF-101 | CP-N101 | N4 · BD | Las 7 tablas de negocio tienen políticas activas; la consulta directa con otra identidad no devuelve filas ajenas en ninguna |
| RNF-102 | CP-N102 | N4 | Bajo C2, el acceso cruzado **sigue** sin producirse (§6.4) |
| RNF-103 | CP-N103 | N0 | Búsqueda de secretos sin resultados; la clave privilegiada solo se lee del entorno |
| RNF-104 | CP-N104 | N0 | Ninguna ruta de código recibe ni persiste contraseñas (ADR-004) |
| RNF-105 | CP-N105 | N3 | Para un mismo identificador, la respuesta de un recurso ajeno y la de uno inexistente son idénticas en estado, código y cuerpo |
| RNF-106 | CP-N106 | N0 | La búsqueda de cuentas por correo no es invocable desde el cliente |
| RNF-201 | CP-N201 | CI | La verificación de tipos finaliza sin errores |
| RNF-202 | CP-N202 | CI | Todo `Must` de alcance `Sí` figura en esta matriz con al menos un caso, y la suite pasa |
| RNF-203 | CP-N203 | CI | El pipeline corre en cada integración y un fallo bloquea la publicación |
| RNF-204 | CP-N204 | N2 | Toda respuesta de error sigue Problem Details con código `modulo.razon` |
| RNF-205 | CP-N205 | N2 | Cuerpo inválido: `400` con detalle por campo y **sin efectos secundarios** |
| RNF-206 | CP-N206 | N0 | Cada decisión estructural tiene su ADR con alternativas y consecuencias |
| RNF-207 | CP-N207 | CI | Cobertura de líneas de los servicios de dominio ≥ 80 % |
| RNF-208 | CP-N208 | CI | Auditoría de dependencias sin vulnerabilidades críticas ni altas |
| RNF-301 | CP-N301 | N0 | El despliegue se completa sin infraestructura propia que aprovisionar |
| RNF-302 | CP-N302 | N0 | Costo fijo por organización de USD 0 en capa gratuita; escalado a cero sin tráfico |
| RNF-303 | CP-N303 | N0 | Pasar de *staging* a producción solo requiere variables distintas |
| RNF-304 | CP-N304 | N0 | La base se reconstruye desde cero aplicando las migraciones en orden. Operativo: exige un proyecto desechable y se ejecuta antes de cada hito; su evidencia es el identificador de la última migración aplicada |
| RNF-305 | CP-N305 | N0 | `main` publica en *staging* y `release` en producción, ambas solo con pipeline aprobado |
| RNF-401 | CP-N401 | **N7** | Flujo T1: cambiar de organización sin cerrar sesión y ver los datos del nuevo contexto |
| RNF-401 | CP-N401.1 | **N6** | Cambiar de organización limpia el taller activo |
| ADR-005 | CP-N005 | **N6** | El cliente adjunta `X-Org-Id` siempre y `X-Workshop-Id` solo en endpoints de nivel taller |
| Contrato §2.3 | CP-N023 | **N6** | Ninguna llamada del cliente anida el identificador de organización en la ruta |
| Contrato §2.6 | CP-N026 | **N6** | Las bajas lógicas se invocan con `POST /…/deactivate`; la revocación de un vínculo, con `DELETE` |
| RNF-204 | CP-N204.1 | **N6** | El código de negocio del error sobrevive al cliente |
| RNF-402 | CP-N402 | **N7** | Sin desbordamiento horizontal a 360 px y 1280 px en las pantallas del corte vertical |
| RNF-403 | CP-N403 | **N7** | Manifiesto con nombre, iconos de 192 y 512 px, `start_url` y `display: standalone`; *service worker* registrado |
| RNF-404 | CP-N404.1 | **N5** | Tasa de éxito ≥ 80 % por tarea con el selector de contexto (§8.4) |
| RNF-404 | CP-N404.2 | **N5** | Puntuación SUS media ≥ 68 con el selector, contrastada con *t* de una muestra |
| RNF-404 | CP-N404.3 | **N5** | α de Cronbach > 0,8 en los ítems del SUS |

RNF-501 no aparece: está fuera de alcance como objetivo medible.

---

## 6. Verificación del aislamiento (objetivo específico 4)

Es el entregable central del proyecto. Se detalla aparte porque su diseño —no su cantidad— es lo que sostiene la tesis.

### 6.1 Condiciones experimentales

| Condición | Políticas del motor | Verificación de membresía | Vía | Resultado esperado |
|---|---|---|---|---|
| **C0 · Línea base** | Deshabilitadas | Omitida | Interfaz y base de datos | Filas ajenas devueltas (CP-LB1, CP-LB2) |
| **C1 · Arquitectura completa** | Activas | Activa | Interfaz | 0 datos ajenos; `403`/`404` según el contrato (CP-701) |
| **C2 · Sin verificación de aplicación** | Activas | Sustituida por una versión que concede | Interfaz | 0 filas ajenas (CP-N102) |
| **C3 · Acceso directo al motor** | Activas | No interviene | Base de datos | 0 filas ajenas (CP-702, CP-N101, CP-704.2) |

**Cómo se establece C0.** Solo en el proyecto de validación desechable: se deshabilita la seguridad a nivel de fila en las 7 tablas de negocio y se sustituye la verificación de membresía, reproduciendo un sistema cuyo único control es el filtro de la aplicación **cuando ese filtro falla**. Tras C0 se reconstruye el esquema desde las migraciones antes de ejecutar C1, C2 y C3. C0 **nunca** se aplica en *staging* ni en producción.

### 6.2 Vía 1 — a través de la interfaz de programación

Con las credenciales de la Cuenta C (sin membresía) y de la Cuenta B (miembro de otra organización), se intenta cada operación del contrato sobre datos de la Organización 1: lectura y escritura de clientes, repuestos, movimientos, miembros, talleres y auditoría, con contexto declarado (`X-Org-Id` de la Organización 1) y sin él.

**Criterio bajo C1**: ninguna operación devuelve datos de la Organización 1, y todas responden según §5 del [contrato](10-contrato-api.md) —`403` con contexto ajeno declarado, `404` con recurso ajeno desde contexto propio—.

### 6.3 Vía 2 — por acceso directo a la base de datos

Se establece una conexión con la identidad de la Cuenta B **sin pasar por la interfaz de programación**, y se consultan directamente las tablas de negocio de la Organización 1: `mt_clients`, `mt_parts`, `mt_part_movements`, `mt_workshops`, `mt_memberships`, `mt_workshop_assignments` y `mt_audit_log`.

**Criterio bajo C3**: las consultas se ejecutan sin error y devuelven **cero filas** de la organización ajena. Que no fallen es parte del resultado: la política no rechaza la consulta, la filtra. Una tabla sin política activa es una fuga, y solo esta vía la detecta.

### 6.4 La prueba que sostiene la inmutabilidad — C2

RNF-102 exige demostrar que las dos capas son **independientes**, no que ambas existen. No existe —ni debe existir— un interruptor en el código de producción que apague la verificación: la capa se anula **en el banco de pruebas**, sustituyendo las funciones de verificación por versiones que conceden sin comprobar. La petición atraviesa entonces la aplicación como si el solicitante fuera miembro, llega a la consulta y no devuelve nada, porque el cliente de datos está atado a su credencial y las políticas se evalúan sobre su identidad real.

Sin este caso, la defensa en profundidad de ADR-002 sería una afirmación de diseño; con él, y con la línea base que muestra qué ocurre sin las políticas, es un hecho verificado.

### 6.5 Repetición

El **ciclo completo C0 → C1 → C2 → C3** se repite **tres veces**, en momentos distintos y sobre entornos reconstruidos desde las migraciones (*test–retest*).

| Condición | Por qué |
|---|---|
| **Tres ejecuciones independientes** | Un fallo intermitente se manifiesta al repetir, no a la primera |
| **Momentos distintos** | Ejecutarlas seguidas comparte el estado del entorno |
| **Entorno reconstruido en cada ciclo** | Si el escenario se acumulara, la segunda corrida no probaría lo mismo que la primera |
| **Entorno dedicado** | Un proyecto de base de datos dedicado y desechable, no el equipo de desarrollo |

Se reporta el resultado de las **tres** ejecuciones, no el de la mejor.

### 6.6 Evidencia a conservar

Por ciclo: el guion de construcción del escenario, la salida de los casos CP-LB1, CP-LB2, CP-701, CP-702, CP-704.2, CP-N101 y CP-N102, y el identificador de la última migración aplicada.

La evidencia la producen **cuatro archivos de prueba**, uno por montaje: **integración** (C1, cliente HTTP), **acceso directo al motor** (C3 y la vía base de datos de C0, cliente PostgreSQL con identidad ajena), **independencia de capas** (C2, verificación sustituida) y **línea base por la interfaz** (C0, políticas deshabilitadas y verificación sustituida). Separarlos permite ejecutar una sola condición por vez.

---

## 7. Criterios de salida

### 7.1 Definición de terminado de una iteración

Una iteración no se cierra mientras no se cumplan las seis condiciones ([08-plan-trabajo.md](08-plan-trabajo.md) §1):

1. Verificación de tipos sin errores.
2. Todos los casos de esta matriz correspondientes a los requisitos de la iteración, en verde.
3. Cobertura de los servicios de dominio ≥ 80 %.
4. Auditoría de dependencias sin vulnerabilidades críticas ni altas.
5. Cada requisito abordado, trazado a su caso en §5 y con sus criterios *Dado–Cuando–Entonces* cumplidos.
6. Documentación actualizada — incluida esta matriz, si la iteración incorporó requisitos.

### 7.2 Cuando el entorno no está disponible

Los casos de N3 y N4 exigen credenciales de un entorno real. Cuando faltan, esos casos se **omiten**, no se dan por pasados. **Un caso omitido no cubre su requisito**, y un informe con casos omitidos en N3 o N4 **no** constituye evidencia de cumplimiento. Por eso la validación del objetivo 4 se ejecuta contra un entorno real antes de cada hito, no solo en el pipeline.

### 7.3 Cierre del proyecto

El criterio de cierre ([plan de trabajo](08-plan-trabajo.md) §9) exige, sobre las pruebas: que todo requisito `Must` de alcance `Sí` tenga su caso en verde; que el ciclo C0–C3 de §6 se haya ejecutado tres veces contra el proyecto de validación con su evidencia conservada; y que los objetivos complementarios 5 y 6 se hayan **ejecutado o descartado** según su criterio de continuidad (§8.1, §9.1).

---

## 8. Evaluación de usabilidad del cambio de contexto (objetivo complementario 5)

Responde a lo que las pruebas automatizadas no pueden responder: si el modelo jerárquico resulta **operable para quien debe usarlo**, comparado con el cambio de cuenta que impone el software de un solo inquilino.

### 8.1 Criterio de continuidad

| Condición | Fecha | Si se cumple | Si no se cumple |
|---|---|---|---|
| Al menos **30 operadores** confirmados para las sesiones de I8 | 23 de noviembre de 2026 (H3) | Se ejecuta la evaluación completa, con contraste inferencial | El objetivo se **descarta**; si se realizan sesiones con los confirmados, se reportan como hallazgo exploratorio, con estadística descriptiva y sin inferencia |

### 8.2 Participantes

| Elemento | Definición |
|---|---|
| **Población** | Operadores de organizaciones de servicio de motocicletas en Bolivia que administran —o planean administrar— más de una organización y/o más de un taller |
| **Muestra** | **30 participantes**; se reclutan **36** para compensar abandonos |
| **Muestreo** | No probabilístico **intencional**, por perfil |
| **Justificación del tamaño** | Permite el contraste intrasujeto de tiempos entre condiciones con la aproximación normal de la media de las diferencias; los primeros cinco participantes bastan además para detectar la mayoría de los problemas de uso (Nielsen & Landauer, 1993) |
| **Criterio de exclusión** | Haber participado en el desarrollo o conocer la aplicación antes de la sesión |

### 8.3 Diseño y tareas

**Intrasujeto y contrabalanceado**: cada participante realiza las tres tareas en las dos condiciones; la mitad empieza por el selector y la otra mitad por el cambio de cuenta.

| Condición | Descripción |
|---|---|
| **Selector de contexto** *(propuesta)* | Una sola cuenta con selectores de organización y taller activos |
| **Cambio de cuenta** *(línea base)* | Una cuenta por local (§3.3); cambiar de local exige cerrar sesión e iniciarla con la cuenta de ese local |

| # | Tarea | Qué pone a prueba |
|---|---|---|
| **T1** | Cambiar a otra organización y confirmar que los datos mostrados son los de esa organización | El nivel **organización** y la percepción del cambio de contexto (RNF-401) |
| **T2** | Situarse en un taller y registrar en él un repuesto | El nivel **taller** y que el inventario es local |
| **T3** | Localizar un cliente registrado en **otro** taller de la misma organización | El beneficio central: el cliente pertenece a la organización, no al local (RF-502) |

### 8.4 Instrumentos y métricas

| Instrumento | Métrica | Unidad | Umbral |
|---|---|---|---|
| Observación de tarea guiada | Tasa de éxito por tarea y condición | Porcentaje | **≥ 80 %** con el selector |
| Cronometraje | Tiempo por tarea y condición | Segundos | Contraste entre condiciones (§8.7) |
| Registro de incidencias | Errores por tarea y condición | Cantidad | Alimenta la lista de problemas |
| Cuestionario SUS (Brooke, 1996) | Puntuación por condición | 0 a 100 | **≥ 68** con el selector, según el baremo de Bangor et al. (2008) |
| Ítems del SUS | Consistencia interna | α de Cronbach | **> 0,8** |

### 8.5 Consideraciones éticas

Aquí **sí participan personas**, lo que impone los cuatro compromisos que declara el [anteproyecto](../anteproyecto/04-anteproyecto-integrado.md) §19.3, que es su fuente:

- **Consentimiento informado** firmado antes de la sesión, con explicación del propósito, del uso de los datos y del derecho a retirarse en cualquier momento sin dar motivo.
- **Anonimización**: resultados agregados y participantes identificados como P01…P30.
- **Confidencialidad de sus organizaciones**, que no se nombran ni se describen de modo que permita reconocerlas.
- **Se evalúa el sistema, no a la persona**, declarado al inicio de la sesión.

Ninguna sesión se graba en vídeo ni se registra dato alguno que permita identificar al participante.

### 8.6 Procedimiento

1. Explicación del propósito y firma del consentimiento informado.
2. Sesión individual —presencial o remota— sobre el entorno de producción con el escenario precargado.
3. T1, T2 y T3 en la primera condición asignada, sin asistencia; una intervención del observador se registra como **fallo** de la tarea.
4. Cuestionario SUS de esa condición.
5. T1, T2 y T3 en la segunda condición y su cuestionario SUS.
6. Comentario abierto sobre qué resultó confuso.

### 8.7 Análisis

| Análisis | Procedimiento |
|---|---|
| **Descriptivo** | Porcentaje de éxito por tarea y condición; media, desviación estándar, mediana y percentil 90 de los tiempos; media de SUS por condición |
| **Consistencia interna** | α de Cronbach de los diez ítems del SUS, por condición |
| **Contraste de tiempos** | *t* de Student pareada entre condiciones, α = 0,05; si la prueba de Shapiro-Wilk rechaza la normalidad de las diferencias, prueba de rangos con signo de Wilcoxon |
| **Contraste de satisfacción** | *t* de Student de una muestra de la puntuación SUS con el selector contra 68, α = 0,05 |
| **Herramientas** | Hoja de cálculo para la planilla; R con las funciones base `t.test`, `shapiro.test` y `wilcox.test` |

Un resultado por debajo de los umbrales **no invalida la tesis** —cuya hipótesis es sobre el aislamiento—, pero es un hallazgo que se declara y se discute.

### 8.8 Evidencia a conservar

Guion de tareas con el orden de condiciones asignado a cada participante, formularios de consentimiento, planilla por participante y condición (éxito, tiempo, errores), respuestas SUS individuales con su puntuación, salida de los contrastes en R y lista de problemas detectados ordenada por frecuencia.

---

## 9. Medición del costo operativo (objetivo complementario 6)

### 9.1 Criterio de continuidad

| Condición | Fecha | Si no se cumple |
|---|---|---|
| Los paneles de Supabase y Vercel exponen invocaciones, transferencia de datos y tamaño de base con granularidad diaria | 7 de diciembre de 2026 (H4) | El objetivo se descarta y el costo queda tratado solo en el análisis de viabilidad económica del [plan de trabajo](08-plan-trabajo.md) §8 |

### 9.2 Procedimiento

1. Cada día de I8 se registran, por entorno —*staging*, producción y validación—, las invocaciones de funciones, la transferencia de datos y el tamaño de la base.
2. Las peticiones a la interfaz se registran con el identificador de la organización activa, sin datos personales, y el consumo de cada día se **prorratea entre organizaciones** según su número de peticiones.
3. El consumo se valoriza con las tarifas publicadas de cada proveedor vigentes en la fecha de medición; dentro de la capa gratuita, el costo marginal es cero y se reporta además el **porcentaje del límite gratuito** consumido.
4. La **línea base** es la tarifa mensual publicada de un servidor dedicado de referencia capaz de ejecutar la interfaz y la base de datos, tomada en la misma fecha.

### 9.3 Casos y evidencia

| Caso | Criterio |
|---|---|
| CP-O6.1 | 14 de 14 lecturas diarias registradas, por entorno |
| CP-O6.2 | Costo mensual estimado por organización calculado para *staging* y producción, junto al porcentaje del límite gratuito consumido |
| CP-O6.3 | Costo mensual del servidor dedicado de referencia registrado con su fuente y fecha |

Evidencia: planilla de lecturas diarias, capturas de los paneles de consumo con su fecha y la tabla de tarifas usada.

---

## 10. Matriz preliminar de validación

El criterio se escribe como comportamiento observable; la métrica lleva siempre umbral numérico. El estado se actualiza al ejecutar.

| Módulo | Criterio de aceptación | Estrategia de prueba | Métrica / KPI | Estado |
|---|---|---|---|---|
| Identidad y registro | Dado un correo nuevo, cuando se registra, entonces existen cuenta, organización, taller y membresía `owner`, o ninguno | Integración (N3) | Atomicidad en el 100 % de los fallos simulados | Pendiente |
| Contexto activo | Dada una petición sin `X-Org-Id`, cuando exige contexto, entonces responde `400` | Contrato (N2) | 100 % de las rutas con contexto obligatorio | Pendiente |
| Organizaciones y miembros | Dado un `Mechanic`, cuando invita, entonces recibe `403` | Integración (N3) | 100 % de las reglas de rol | Pendiente |
| Clientes | Dado un cliente creado con el taller A activo, cuando se opera con el taller B, entonces se lista | Integración (N3) | 100 % de entidades de nivel organización visibles entre talleres | Pendiente |
| Inventario | Dado un movimiento que dejaría existencia negativa, cuando se registra, entonces se rechaza sin alterar el stock | Unitaria e integración (N1, N3) | Cobertura ≥ 80 % del servicio de inventario | Pendiente |
| Aislamiento | Dada la identidad de otra cuenta, cuando consulta las 7 tablas bajo C1–C3, entonces obtiene cero filas ajenas, frente a filas ajenas bajo C0 | Aislamiento (N4) | 0 filas ajenas en 3 corridas | Pendiente |
| Cambio de contexto | Dado un operador con dos organizaciones, cuando cambia de organización, entonces el taller activo se limpia y los datos corresponden a la nueva | Componente y extremo a extremo (N6, N7) | T1–T3 en verde tras cada publicación | Pendiente |
| Pipeline | Dada una integración al ramal principal, cuando falla una prueba, entonces no se publica | CI | 100 % de integraciones verificadas | Pendiente |

---

## 11. Limitaciones declaradas

| Limitación | Alcance real de la evidencia |
|---|---|
| N4 se ejecuta sobre un proyecto de capa gratuita, no productivo | Demuestra la corrección de las políticas y del contrato, no el comportamiento bajo carga |
| La línea base C0 se reproduce deshabilitando políticas en el propio sistema | Emula el aislamiento solo en la aplicación cuando su control falla; no mide un producto comercial concreto |
| El canal lateral temporal no se prueba | El aislamiento verificado es el de **contenido**, no el de metadatos inferibles por tiempo de ejecución |
| Las reglas alojadas en funciones del motor solo se prueban contra un motor real | Su cobertura depende del entorno; §7.2 fija cómo se reporta |
| La evaluación de usabilidad usa 30 operadores del servicio de motocicletas en Bolivia | Sostiene el contraste entre condiciones, no la representatividad del sector |
| La usabilidad evaluada es la del **cambio de contexto** | No se concluye nada sobre las demás pantallas |
| El costo se estima con tres organizaciones sintéticas durante 14 días | Es un orden de magnitud por organización, no una proyección a escala |
