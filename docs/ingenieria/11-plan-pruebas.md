# Plan de pruebas y validación

Estrategia de verificación del sistema y matriz de trazabilidad **requisito → caso de prueba → evidencia**. Materializa RNF-202 —toda regla de aislamiento y de negocio tiene prueba automatizada— y sostiene el objetivo específico 4: validar el aislamiento con evidencia reproducible ([anteproyecto/01](../anteproyecto/01-definicion-y-alcance.md) §1.7).

> Requisitos: [02-requisitos.md](02-requisitos.md) · Contrato verificado: [10-contrato-api.md](10-contrato-api.md) · Políticas: [05-modelo-datos.md](05-modelo-datos.md) · Cronograma: [08-plan-trabajo.md](08-plan-trabajo.md)
>
> **Este documento especifica la verificación, no reporta resultados.** Define qué debe probarse y con qué criterio se da por probado. La ejecución y sus resultados son evidencia de la fase de validación (F4).

---

## 1. Estrategia

### 1.1 Qué gobierna la selección de pruebas

El sistema no se prueba de manera uniforme: se concentra el esfuerzo donde un fallo es **irreversible o silencioso**. Una regla de aislamiento que falla no produce un error visible —produce una fuga que nadie observa—, y por eso el aislamiento recibe un nivel de prueba propio, con dos vías independientes.

De ahí tres reglas de selección:

1. **Todo requisito `Must` con alcance `Sí` tiene al menos un caso ejecutable** (RNF-202). Lo que no se puede ejecutar no se declara cumplido.
2. **El aislamiento se prueba por duplicado**, una vez por cada capa de defensa (ADR-002). Probarlo solo por la interfaz verificaría la capa de aplicación, no la del motor.
3. **Lo no ejecutable se declara como tal.** Los requisitos que se comprueban por inspección se marcan explícitamente en la matriz, en lugar de disfrazarse de prueba.

### 1.2 Niveles

| Nivel | Qué verifica | Qué necesita | Coste de ejecución |
|---|---|---|---|
| **N0 · Inspección** | Propiedades no ejecutables: ausencia de secretos, existencia de decisiones registradas, configuración por entorno | Revisión del repositorio y de la configuración | Manual, por hito |
| **N1 · Unitaria** | Reglas puras: esquemas de validación, cálculo de existencias, resolución de permisos por rol | Nada externo | Milisegundos |
| **N2 · Contrato HTTP** | La interfaz **antes** de tocar la base: credencial ausente o inválida, contexto activo obligatorio, forma del error, validación de entrada | La aplicación en memoria | Segundos |
| **N3 · Integración** | Flujo completo contra base de datos y proveedor de identidad reales: creación, unicidad por nivel, transiciones de estado, auditoría | Entorno con credenciales y migraciones aplicadas | Decenas de segundos |
| **N4 · Aislamiento** | Que una organización no accede a datos de otra, por interfaz **y** por acceso directo al motor | Igual que N3, más una identidad adicional | Decenas de segundos |
| **N5 · Usabilidad** | Que el cambio de contexto entre organizaciones y talleres resulta operable por un usuario del rubro (RNF-401, RNF-404) | Aplicación desplegada y operadores participantes | Sesión presencial o remota, por participante |
| **N6 · Contrato desde el cliente** | Que el contexto que el operador elige sea el que viaja en las cabeceras, y que el cliente respete la regla de rutas y el método de las bajas lógicas | Nada externo: DOM simulado | Segundos |

Además de estos siete niveles, la matriz de §4.7 emplea la marca **CI** para las propiedades que no verifica un caso de prueba sino el propio pipeline de integración continua (verificación de tipos, ejecución de la suite y bloqueo ante fallo).

N1, N2 y N6 corren siempre, en cada integración al ramal principal. N3 y N4 exigen credenciales; su tratamiento cuando faltan está en §6.2. N5 es **manual y no repetible en cada integración**: se ejecuta una vez, sobre la aplicación terminada, y su diseño está en §7.

### 1.3 Qué cubre N6, y qué deliberadamente no

N6 no evalúa la interfaz: evalúa el **cumplimiento del contrato desde el lado del cliente**, que es lo que la evaluación con operadores no puede observar. Un participante puede completar las tres tareas con éxito mientras el cliente envía una cabecera equivocada, y a la inversa.

| Cubre | No cubre |
|---|---|
| Que cambiar de organización limpie el taller activo | Si la pantalla resulta comprensible — eso es N5 |
| Que `X-Org-Id` viaje siempre y `X-Workshop-Id` solo en endpoints de nivel taller | Diseño responsivo (RNF-402) e instalabilidad (RNF-403), que son N0 |
| Que el código de negocio del error sobreviva al cliente | Recorridos completos de usuario extremo a extremo |
| Regresión de la regla de rutas y del método de las bajas lógicas ([contrato](10-contrato-api.md) §2.3 y §2.6) | Rendimiento y accesibilidad |

**N6 no sustituye a N5 ni relaja sus umbrales.** RNF-401 y RNF-404 siguen verificándose con operadores reales.

### 1.4 Qué queda deliberadamente fuera

| Fuera del plan | Motivo |
|---|---|
| Pruebas de carga y de rendimiento | Excluidas del alcance ([definición y alcance](../anteproyecto/01-definicion-y-alcance.md) §1.8.3); RNF-501 es criterio cualitativo, no objetivo medido |
| Pruebas automatizadas de **toda** la interfaz de usuario | El objeto de validación es la arquitectura de aislamiento, que reside en el servidor y en la base de datos. RNF-402 y RNF-403 se verifican por inspección (N0), y RNF-401 y RNF-404 con operadores reales (N5, §7). Lo que sí se automatiza es el subconjunto del nivel N6 (§1.3): el contrato visto desde el cliente |
| Evaluación de usabilidad de la interfaz completa | La evaluación se acota al **cambio de contexto** entre organizaciones y talleres, por ser la manifestación visible del aporte de la tesis. Las demás pantallas no se someten a prueba con usuarios |
| Pruebas de penetración | El alcance cubre el aislamiento entre inquilinos, no una evaluación de seguridad ofensiva del despliegue |
| Mitigación del canal lateral temporal de RLS | Amenaza reconocida y documentada (§3.3 del marco teórico); su mitigación excede el objeto del proyecto |

---

## 2. Entorno y datos de prueba

### 2.1 Escenario base

Todas las pruebas de N3 y N4 parten del mismo escenario, construido por el propio caso —nunca de datos preexistentes, para que la ejecución sea reproducible desde una base vacía:

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

Con este escenario, un solo montaje cubre las tres preguntas del aislamiento: **entre cuentas** (A frente a B), **entre organizaciones de la misma cuenta** (Organización 1 frente a Organización 2) y **frente a quien no es miembro de ninguna** (Cuenta C).

### 2.2 Aislamiento entre ejecuciones

- Cada ejecución crea sus cuentas con correos irrepetibles; ninguna prueba depende del orden ni del rastro de otra.
- Ningún caso modifica datos que otro caso vaya a leer.
- La base de pruebas se reconstruye desde las migraciones versionadas (RNF-304), de modo que el esquema probado sea exactamente el especificado.

---

## 3. Orden de escritura

**Las pruebas de aislamiento se escriben antes que la funcionalidad que protegen.** No es una preferencia metodológica: es la mitigación del riesgo R1 del [plan de trabajo](08-plan-trabajo.md), y se apoya en el uso de la prueba como especificación ejecutable (Beck, 2002; marco teórico §3.2.5).

En la práctica, cada módulo de negocio se construye en este orden:

1. Se escribe el caso de aislamiento del módulo: una cuenta ajena **no** ve estos datos. Falla, porque el módulo no existe.
2. Se escriben los casos de contrato: sin credencial, sin contexto activo, con entrada inválida.
3. Se implementa el módulo hasta que los tres pasan.
4. Se añaden los casos funcionales del requisito.

El paso 1 antes del 3 es lo que impide que el aislamiento se agregue "después", que es exactamente el modo en que se olvida.

---

## 4. Matriz de trazabilidad

Identificación de casos: **CP-nnn**, donde `nnn` es el número del requisito que verifican. Los sufijos `.1`, `.2` distinguen los casos de un mismo requisito.

### 4.1 Identidad y cuentas

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

### 4.2 Organizaciones y talleres

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-201 | CP-201 | N3 | La segunda organización aparece en el listado con rol `owner` |
| RF-202 | CP-202 | N3 | Un invitado ve la organización aunque no sea su creador; un removido deja de verla |
| RF-203 | CP-203.1 | N3 | El cambio devuelve la organización y el rol; las peticiones posteriores operan sobre ella |
| RF-203 | CP-203.2 | N3 | Activar una organización sin membresía: `403 organization.access_denied` |
| RF-204 | CP-204 | N3 | El `Owner` edita; un no-`Owner` recibe `403` |
| RF-301 | CP-301.1 | N3 | El taller creado aparece en el listado de la organización |
| RF-301 | CP-301.2 | N3 | Un no-`Owner` que intenta crear recibe `403` |
| RF-301 | CP-301.3 | N3 | La edición de los datos del taller se refleja en su ficha; un no-`Owner` que intenta editar recibe `403` |
| RF-302 | CP-302 | N3 | El listado devuelve **solo** talleres de la organización activa |
| RF-303 | CP-303.1 | N2 | Operación de nivel taller sin `X-Workshop-Id`: `400 workshop.missing_active_workshop` |
| RF-303 | CP-303.2 | N3 | Taller de otra organización en la cabecera: `404 workshop.not_found` |
| RF-304 | CP-304.1 | N3 | La asignación se registra y se puede retirar sin afectar la membresía |
| RF-304 | CP-304.2 | N3 | La asignación **no** altera lo que el miembro puede ver (ADR-006) |
| RF-305 | CP-305 | N3 | El taller desactivado deja de listarse como activo; sus datos siguen consultables |

### 4.3 Miembros y control de acceso

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-401 | CP-401.1 | N3 | Tras la invitación el invitado accede; antes recibía `403` |
| RF-401 | CP-401.2 | N3 | Correo sin cuenta: `404 member.not_found` |
| RF-401 | CP-401.3 | N3 | Reincorporar a alguien removido **reactiva** su membresía, no la duplica |
| RF-402 | CP-402.1 | N2 | Invitar con rol `owner`: rechazo por validación |
| RF-402 | CP-402.2 | **N4 · vía base de datos** | Una inserción directa de una segunda membresía activa con rol `owner` en la misma organización es rechazada por el motor, sin intervención de la aplicación |
| RF-403 | CP-403 | N3 | El cambio se refleja en el listado y surte efecto inmediato |
| RF-404 | CP-404 | N3 | El removido pierde el acceso de inmediato |
| RF-405 | CP-405 | N3 | Cambiar el rol del propietario o removerlo: error de negocio específico |
| RF-406 | CP-406 | N3 | Un `Mechanic` que intenta invitar: `403` |
| RF-407 | CP-407 | N3 | Cualquier miembro consulta el listado, con rol y estado |

### 4.4 Clientes — nivel organización

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-501 | CP-501 | N3 | El cliente creado se recupera por identificador |
| RF-502 | CP-502 | N3 | Un cliente creado con el taller A activo **se lista** con el taller B activo |
| RF-503 | CP-503.1 | N3 | Correo duplicado en la misma organización: `409 client.duplicate_email` |
| RF-503 | CP-503.2 | N3 | El mismo correo en otra organización se acepta |
| RF-504 | CP-504.1 | N3 | La baja conserva el registro y lo excluye de los listados activos |
| RF-504 | CP-504.2 | N3 | La búsqueda por nombre o correo opera dentro de la organización activa |
| RF-505 | CP-505 | N3 | Un `Mechanic` que intenta crear: `403`; consultar sí puede |

### 4.5 Inventario — nivel taller

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

### 4.6 Aislamiento y auditoría

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-701 | CP-701 | **N4 · vía interfaz** | Una cuenta sin membresía no obtiene dato alguno en ninguna operación — lectura y escritura —, respondiendo según §5 del [contrato](10-contrato-api.md): `403` con contexto ajeno declarado, `404` con recurso ajeno desde contexto propio |
| RF-702 | CP-702 | **N4 · vía base de datos** | Consultas ejecutadas con la identidad de otra cuenta, sin pasar por la interfaz, no devuelven filas ajenas |
| RF-703 | CP-703.1–.6 | N3 | Un caso por cada acción crítica: invitación, cambio de rol, remoción, modificación de los datos de la organización, desactivación de taller y baja de cliente |
| RF-703 | CP-703.7 | N3 | El registro persiste tras eliminar la entidad o la cuenta referenciada |
| RF-704 | CP-704.1 | N3 | `Mechanic` o `Receptionist` que consulta la auditoría: `403` |
| RF-704 | CP-704.2 | **N4 · vía base de datos** | La restricción se sostiene también por acceso directo: un miembro no propietario no lee el registro |

### 4.7 Requisitos no funcionales

| Req. | Caso | Nivel | Criterio |
|---|---|---|---|
| RNF-101 | CP-N101 | N4 · BD | Las siete tablas de negocio censadas en el [modelo de datos](05-modelo-datos.md) tienen políticas activas; la consulta directa con otra identidad no devuelve filas ajenas en ninguna |
| RNF-102 | CP-N102 | N4 | Con la verificación de la capa de aplicación deshabilitada, el acceso cruzado **sigue** sin producirse (§5.3) |
| RNF-103 | CP-N103 | N0 | Búsqueda de credenciales en el repositorio sin resultados; la clave privilegiada solo se lee del entorno |
| RNF-104 | CP-N104 | N0 | Ninguna ruta de código recibe ni persiste contraseñas: la gestión está delegada (ADR-004) |
| RNF-105 | CP-N105 | N3 | Para un mismo identificador, la respuesta de un recurso ajeno y la de uno inexistente son idénticas en estado, código y cuerpo |
| RNF-106 | CP-N106 | N0 | La búsqueda de cuentas por correo no es invocable desde el cliente |
| RNF-201 | CP-N201 | CI | La verificación de tipos finaliza sin errores |
| RNF-202 | CP-N202 | CI | Todo `Must` de alcance `Sí` figura en esta matriz con al menos un caso ejecutable, y la suite pasa |
| RNF-203 | CP-N203 | CI | El pipeline corre en cada integración; un fallo bloquea la incorporación |
| RNF-204 | CP-N204 | N2 | Toda respuesta de error sigue Problem Details con código `modulo.razon` |
| RNF-205 | CP-N205 | N2 | Cuerpo inválido: `400` con detalle por campo y **sin efectos secundarios** |
| RNF-206 | CP-N206 | N0 | Cada decisión estructural tiene su ADR con alternativas y consecuencias |
| RNF-301 | CP-N301 | N0 | El despliegue se completa sin infraestructura propia que aprovisionar |
| RNF-302 | CP-N302 | N0 | El modelo de despliegue escala a cero sin tráfico |
| RNF-303 | CP-N303 | N0 | Cambiar de entorno solo requiere variables distintas, sin tocar código |
| RNF-304 | CP-N304 | N0 | La base se reconstruye desde cero aplicando las migraciones en orden. Es **operativo, no automatizable en esta suite**: exige un proyecto Supabase desechable. Se ejecuta antes de cada hito y su evidencia es el identificador de la última migración aplicada (§5.5) |
| RNF-401 | CP-N401 | N0 · N5 | El cambio de organización y de taller ocurre sin cerrar sesión y los datos mostrados corresponden al nuevo contexto |
| RNF-401 | CP-N401.1 | **N6** | Cambiar de organización limpia el taller activo: no se arrastra un local de la organización anterior |
| ADR-005 | CP-N005 | **N6** | El cliente adjunta `X-Org-Id` siempre y `X-Workshop-Id` solo en endpoints de nivel taller; sin contexto elegido no inventa ninguno |
| Contrato §2.3 | CP-N023 | **N6** | Ninguna llamada del cliente anida el identificador de organización en la ruta |
| Contrato §2.6 | CP-N026 | **N6** | Las bajas lógicas se invocan con `POST /…/deactivate`; la revocación de un vínculo, con `DELETE` |
| RNF-204 | CP-N204.1 | **N6** | El código de negocio del error sobrevive al cliente y llega como `ApiError.code` |
| RNF-402 | CP-N402 | N0 | Interfaz utilizable en anchos de escritorio y móvil |
| RNF-403 | CP-N403 | N0 | El manifiesto permite instalar la aplicación desde el navegador |
| RNF-404 | CP-N404.1 | **N5** | Tasa de éxito por tarea ≥ 80 % en las tres tareas de cambio de contexto (§7.2) |
| RNF-404 | CP-N404.2 | **N5** | Puntuación SUS media ≥ 68 (Bangor et al., 2008) |

RNF-501 no aparece: está fuera de alcance como objetivo medible.

---

## 5. Verificación del aislamiento (objetivo específico 4)

Es el entregable central del proyecto. Se detalla aparte porque su diseño —no su cantidad— es lo que sostiene la tesis.

### 5.1 Vía 1 — a través de la interfaz de programación

Verifica la **capa de aplicación**. Con las credenciales de la Cuenta C (sin membresía) y de la Cuenta B (miembro de otra organización), se intenta cada operación del contrato sobre datos de la Organización 1:

- Lectura de clientes, de repuestos, de movimientos, de miembros, de talleres y de auditoría.
- Escritura: crear, modificar y dar de baja en cada uno de esos recursos.
- Con contexto declarado (`X-Org-Id` de la Organización 1) y sin él.

**Criterio**: ninguna operación devuelve datos de la Organización 1, y todas responden según §5 del [contrato](10-contrato-api.md) —`403` cuando se declara un contexto ajeno, `404` cuando se referencia un recurso ajeno desde un contexto propio.

### 5.2 Vía 2 — por acceso directo a la base de datos

Verifica la **capa del motor**, y es la que demuestra la premisa del proyecto. Se establece una conexión con la identidad de la Cuenta B **sin pasar por la interfaz de programación**, y se consultan directamente las tablas de negocio de la Organización 1.

**Criterio**: las consultas se ejecutan sin error y devuelven **cero filas** de la organización ajena. Que no fallen es parte del resultado: RLS no rechaza la consulta, la filtra — y esa es exactamente la propiedad que se busca demostrar.

Debe cubrir **todas** las tablas de negocio: `mt_clients`, `mt_parts`, `mt_part_movements`, `mt_workshops`, `mt_memberships`, `mt_workshop_assignments` y `mt_audit_log`. Una tabla sin política activa es una fuga, y solo esta vía la detecta: por la interfaz quedaría oculta tras la verificación de la aplicación.

### 5.3 La prueba que justifica la redundancia

RNF-102 exige demostrar que las dos capas son **independientes**, no que ambas existen. Se verifica omitiendo deliberadamente la verificación de membresía de la capa de aplicación y comprobando que el acceso cruzado sigue sin producirse.

**Cómo se deshabilita.** No existe —ni debe existir— un interruptor en el código de producción que apague la comprobación: sería una vía de escalada esperando a que alguien la active por error. La capa se anula **en el banco de pruebas**, sustituyendo las funciones de verificación por versiones que conceden acceso sin comprobar nada; el resto del sistema queda intacto. La petición atraviesa entonces la capa de aplicación como si el solicitante fuera miembro, llega a la consulta, y no devuelve nada: el cliente de datos está atado a **su** credencial y las políticas se evalúan sobre su identidad real.

Sin este caso, la defensa en profundidad de ADR-002 sería una afirmación de diseño; con él, es un hecho verificado. Es el argumento que responde directamente a la evidencia de Dar et al. (2023) y a la serie de CVE citada en el estado del arte.

### 5.4 Repetición: el resultado no puede depender de una ejecución

Una sola ejecución en verde no distingue entre «el aislamiento se sostiene» y «esta vez se sostuvo». La confiabilidad del procedimiento se asegura repitiendo **el ciclo completo tres veces**, en momentos distintos y sobre entornos reconstruidos desde las migraciones (*test–retest*).

| Condición | Por qué |
|---|---|
| **Tres ejecuciones independientes** | Un fallo intermitente —una condición de carrera en la creación del escenario, una política que dependa del orden— se manifiesta al repetir, no a la primera |
| **Momentos distintos** | Ejecutarlas seguidas comparte el estado del entorno; separarlas es lo que hace independiente la repetición |
| **Entorno reconstruido en cada ciclo** | Si el escenario se acumulara entre ejecuciones, la segunda no probaría lo mismo que la primera |
| **Entorno dedicado** | No se recolecta sobre el equipo de desarrollo con procesos de fondo compitiendo por recursos, sino sobre un proyecto de base de datos dedicado y desechable |

El resultado que se reporta es el de las **tres** ejecuciones, no el de la mejor. Una discrepancia entre ellas es en sí misma un hallazgo y se declara como tal.

### 5.5 Evidencia a conservar

Para que la validación sea reproducible por un tercero (objetivo 4), se conserva: el guion de construcción del escenario base, la salida de la ejecución de los casos CP-701, CP-702, CP-704.2, CP-N101 y CP-N102, y la versión del esquema —identificador de la última migración aplicada— contra la que se ejecutaron.

Esa evidencia la producen tres archivos de prueba, uno por vía de verificación: el de **integración** (CP-701 y el resto del flujo por la interfaz de programación), el de **acceso directo al motor** (CP-702, CP-N101 y CP-704.2) y el de **independencia de capas** (CP-N102). Separarlos no es organizativo: cada uno exige un montaje distinto —cliente HTTP, cliente PostgreSQL con identidad ajena y banco de pruebas con la verificación de membresía sustituida— y mezclarlos impediría ejecutar una sola condición experimental por vez (§15.2 del [anteproyecto](../anteproyecto/04-anteproyecto-integrado.md)).

---

## 6. Criterios de salida

### 6.1 Definición de terminado de una iteración

Una iteración no se cierra mientras no se cumplan las cuatro condiciones ([08-plan-trabajo.md](08-plan-trabajo.md) §1):

1. Verificación de tipos sin errores.
2. Todos los casos de esta matriz correspondientes a los requisitos de la iteración, en verde.
3. Cada requisito abordado, trazado a su caso en §4.
4. Documentación actualizada — incluida esta matriz, si la iteración incorporó requisitos.

### 6.2 Cuando el entorno no está disponible

Los casos de N3 y N4 exigen credenciales de un entorno real. Cuando faltan, esos casos se **omiten**, no se dan por pasados.

La consecuencia debe declararse sin atenuantes: **un caso omitido no cubre su requisito**. Es la misma limitación que ADR-007 asume para las reglas alojadas en funciones del motor —no pueden verificarse sin un motor real—, y por eso la validación del objetivo 4 se ejecuta contra un entorno real antes de cada hito, no solo en la integración continua.

Un informe de ejecución que muestre casos omitidos en N3 o N4 **no** constituye evidencia de cumplimiento.

### 6.3 Cierre del proyecto

El criterio de cierre del proyecto (§6 del plan de trabajo) exige, sobre las pruebas: que todo requisito `Must` de alcance `Sí` tenga su caso en verde; que la suite de aislamiento —§5, ejecutada contra un entorno real— sea reproducible desde una base vacía con el guion conservado; y que la evaluación de usabilidad (§7) se haya ejecutado con al menos cinco participantes, con su informe de resultados y la lista de problemas detectados.

La usabilidad se reporta **aunque no alcance sus umbrales**. Un resultado por debajo de 80 % de éxito o de 68 puntos SUS no invalida la tesis —cuya hipótesis es sobre el aislamiento, no sobre la interfaz—, pero constituye un hallazgo que debe declararse y discutirse, no ocultarse.

---

## 7. Evaluación de usabilidad del cambio de contexto (objetivo específico 4)

Complementa la verificación del aislamiento. Responde a una pregunta que las pruebas automatizadas no pueden responder: si el modelo jerárquico que la tesis propone resulta **comprensible para quien debe operarlo**. Una arquitectura correcta que el operador no sabe manejar no resuelve el problema planteado.

### 7.1 Participantes

| Elemento | Definición |
|---|---|
| **Población** | Operadores de organizaciones de servicio de motocicletas en Bolivia que administran —o planean administrar— más de una organización y/o más de un taller |
| **Muestra** | **De 5 a 8 participantes** |
| **Tipo de muestreo** | No probabilístico **intencional**, por criterio: se busca el perfil que padece el problema, no una muestra representativa del sector |
| **Justificación del tamaño** | Nielsen y Landauer (1993) modelan matemáticamente el hallazgo de problemas de usabilidad y muestran que la curva de detección se satura pronto: cinco participantes descubren la mayoría de los problemas de una interfaz, y cada participante adicional aporta cada vez menos. El objetivo es **detectar problemas**, no estimar un parámetro poblacional, de modo que aumentar la muestra no mejoraría la conclusión en proporción al esfuerzo |
| **Criterio de exclusión** | Haber participado en el desarrollo o haber visto la aplicación antes de la sesión |

### 7.2 Tareas

Las tres tareas se eligen porque cada una ejercita una consecuencia distinta de la jerarquía de dos niveles. No se evalúa la interfaz en general.

| # | Tarea | Qué pone a prueba |
|---|---|---|
| **T1** | Cambiar a otra organización y confirmar que los datos mostrados son los de esa organización | Que el usuario distinga el nivel **organización** y perciba el cambio de contexto (RNF-401) |
| **T2** | Seleccionar un taller y registrar en él un repuesto | Que distinga el nivel **taller** y comprenda que el inventario es local |
| **T3** | Localizar un cliente registrado en **otro** taller de la misma organización | Que perciba el beneficio central del modelo: el cliente pertenece a la organización, no al local (RF-502) |

### 7.3 Instrumentos y métricas

| Instrumento | Métrica | Unidad | Umbral |
|---|---|---|---|
| Observación de tarea guiada | Tasa de éxito por tarea | Porcentaje | **≥ 80 %** |
| Cronometraje de la sesión | Tiempo por tarea | Segundos | Sin umbral: se reporta para comparar entre tareas |
| Registro de incidencias | Errores por tarea | Cantidad | Sin umbral: alimenta la lista de problemas detectados |
| Cuestionario SUS (Brooke, 1996) | Puntuación de satisfacción | 0 a 100 | **≥ 68**, promedio de la industria según el baremo de Bangor et al. (2008) |

El tiempo y los errores **no llevan umbral a propósito**: con una muestra de cinco a ocho participantes no procede afirmar significancia estadística sobre ellos. Se reportan como evidencia descriptiva y como insumo de la lista de problemas.

### 7.4 Procedimiento

1. Explicación del propósito y firma del **consentimiento informado**.
2. Sesión individual sobre la aplicación desplegada, con datos de prueba ya cargados —el participante no crea el escenario.
3. Ejecución de T1, T2 y T3 sin asistencia; se interviene solo si el participante se detiene por completo, y esa intervención se registra como fallo de la tarea.
4. Cuestionario SUS al terminar.
5. Comentario abierto sobre qué resultó confuso.

### 7.5 Consideraciones éticas

A diferencia del resto de la validación, aquí **sí participan personas**, lo que impone cuatro compromisos —los que declara el §18.3 del [anteproyecto](../anteproyecto/04-anteproyecto-integrado.md), que es su fuente—:

- **Consentimiento informado** firmado antes de la sesión, con explicación del propósito, del uso de los datos y del derecho a retirarse en cualquier momento sin dar motivo.
- **Anonimización**: los resultados se reportan de forma agregada y los participantes se identifican como P1…P8.
- **Confidencialidad de sus organizaciones**, que no se nombran ni se describen de modo que permita reconocerlas.
- **Se evalúa el sistema, no a la persona.** Se declara explícitamente al participante al inicio de la sesión, porque condiciona su disposición a intentar sin miedo a equivocarse.

Ninguna sesión se graba en vídeo ni se registra dato alguno que permita identificar al participante.

### 7.6 Evidencia a conservar

Guion de tareas, formularios de consentimiento firmados, planilla de resultados por participante (éxito, tiempo, errores), respuestas SUS individuales con su puntuación calculada, y la lista de problemas detectados ordenada por frecuencia.

---

## 8. Limitaciones declaradas

Se consignan para que el alcance de la evidencia no se sobreentienda mayor de lo que es:

| Limitación | Alcance real de la evidencia |
|---|---|
| Los casos N3 y N4 se ejecutan sobre un entorno de desarrollo, no productivo | Demuestran la corrección de las políticas y del contrato, no el comportamiento bajo carga ni ante fallos de infraestructura |
| El canal lateral temporal de RLS no se prueba | El aislamiento verificado es el de **contenido** —qué filas se devuelven—, no el de metadatos inferibles por tiempo de ejecución (§3.3 del marco teórico) |
| Las reglas alojadas en funciones del motor solo se prueban contra un motor real | Su cobertura depende del entorno; §6.2 fija cómo se reporta |
| RNF-402 y RNF-403 se verifican por inspección | Tienen criterio observable, no automatizado |
| La evaluación de usabilidad usa de 5 a 8 participantes | Dimensionada para **detectar problemas** (Nielsen y Landauer, 1993), no para estimar parámetros poblacionales: no procede afirmar significancia estadística sobre sus tiempos ni sobre la media SUS |
| La usabilidad evaluada es la del **cambio de contexto** | No se concluye nada sobre la usabilidad de las demás pantallas, que no se sometieron a prueba con usuarios |
| El escenario base usa tres cuentas y tres organizaciones | Suficiente para las tres preguntas del aislamiento (§2.1), pero no explora el comportamiento con un número elevado de inquilinos |
