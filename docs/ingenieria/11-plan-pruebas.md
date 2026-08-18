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
| **N4 · Aislamiento** | Que una empresa no accede a datos de otra, por interfaz **y** por acceso directo al motor | Igual que N3, más una identidad adicional | Decenas de segundos |

N1 y N2 corren siempre, en cada integración al ramal principal. N3 y N4 exigen credenciales; su tratamiento cuando faltan está en §6.2.

### 1.3 Qué queda deliberadamente fuera

| Fuera del plan | Motivo |
|---|---|
| Pruebas de carga y de rendimiento | Excluidas del alcance (§1.8.3); RNF-501 es criterio cualitativo, no objetivo medido |
| Pruebas automatizadas de la interfaz de usuario | El objeto de validación es la arquitectura de aislamiento, que reside en el servidor y en la base de datos. RNF-401 a RNF-403 se verifican por inspección sobre la aplicación (N0) |
| Pruebas de penetración | El alcance cubre el aislamiento entre inquilinos, no una evaluación de seguridad ofensiva del despliegue |
| Mitigación del canal lateral temporal de RLS | Amenaza reconocida y documentada (§3.3 del marco teórico); su mitigación excede el objeto del proyecto |

---

## 2. Entorno y datos de prueba

### 2.1 Escenario base

Todas las pruebas de N3 y N4 parten del mismo escenario, construido por el propio caso —nunca de datos preexistentes, para que la ejecución sea reproducible desde una base vacía:

```
Cuenta A ──owner──> Empresa 1 ──> Sucursal 1.1
                        │            └── repuestos de 1.1
                        ├──> Sucursal 1.2
                        │       └── repuestos de 1.2
                        └── clientes de la Empresa 1

Cuenta A ──owner──> Empresa 2          (misma cuenta, otra empresa)

Cuenta B ──owner──> Empresa 3 ──> Sucursal 3.1
                        └── clientes de la Empresa 3

Cuenta C  ── sin membresía en ninguna de las anteriores
```

Con este escenario, un solo montaje cubre las tres preguntas del aislamiento: **entre cuentas** (A frente a B), **entre empresas de la misma cuenta** (Empresa 1 frente a Empresa 2) y **frente a quien no es miembro de ninguna** (Cuenta C).

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
| RF-101 | CP-101.1 | N3 | Tras registrar, la cuenta tiene una empresa, una sucursal y membresía `owner` |
| RF-101 | CP-101.2 | N3 | Un correo ya registrado se rechaza y **no** crea empresa alguna |
| RF-101 | CP-101.3 | N3 | Si falla la creación de la empresa, no queda cuenta ni registro huérfano (atomicidad, ADR-007) |
| RF-101 | CP-101.4 | N2 | Contraseña de menos de 8 caracteres: `400` con el campo señalado |
| RF-102 | CP-102 | N3 | Una credencial emitida por el proveedor es aceptada por la interfaz |
| RF-103 | CP-103.1 | N2 | Petición sin credencial a un recurso protegido: `401 auth.missing_token` |
| RF-103 | CP-103.2 | N2 | Credencial inválida: `401 auth.invalid_token` |
| RF-104 | CP-104 | N3 | Devuelve perfil y empresas con membresía **activa**, cada una con su rol |

### 4.2 Empresas y sucursales

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-201 | CP-201 | N3 | La segunda empresa aparece en el listado con rol `owner` |
| RF-202 | CP-202 | N3 | Un invitado ve la empresa aunque no sea su creador; un removido deja de verla |
| RF-203 | CP-203.1 | N3 | El cambio devuelve la empresa y el rol; las peticiones posteriores operan sobre ella |
| RF-203 | CP-203.2 | N3 | Activar una empresa sin membresía: `403 organization.access_denied` |
| RF-204 | CP-204 | N3 | El `Owner` edita; un no-`Owner` recibe `403` |
| RF-301 | CP-301.1 | N3 | La sucursal creada aparece en el listado de la empresa |
| RF-301 | CP-301.2 | N3 | Un no-`Owner` que intenta crear recibe `403` |
| RF-302 | CP-302 | N3 | El listado devuelve **solo** sucursales de la empresa activa |
| RF-303 | CP-303.1 | N2 | Operación de nivel sucursal sin `X-Workshop-Id`: `400 workshop.missing_active_workshop` |
| RF-303 | CP-303.2 | N3 | Sucursal de otra empresa en la cabecera: `404 workshop.not_found` |
| RF-304 | CP-304.1 | N3 | La asignación se registra y se puede retirar sin afectar la membresía |
| RF-304 | CP-304.2 | N3 | La asignación **no** altera lo que el miembro puede ver (ADR-006) |
| RF-305 | CP-305 | N3 | La sucursal desactivada deja de listarse como activa; sus datos siguen consultables |

### 4.3 Miembros y control de acceso

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-401 | CP-401.1 | N3 | Tras la invitación el invitado accede; antes recibía `403` |
| RF-401 | CP-401.2 | N3 | Correo sin cuenta: `404 member.not_found` |
| RF-401 | CP-401.3 | N3 | Reincorporar a alguien removido **reactiva** su membresía, no la duplica |
| RF-402 | CP-402 | N2 | Invitar con rol `owner`: rechazo por validación |
| RF-403 | CP-403 | N3 | El cambio se refleja en el listado y surte efecto inmediato |
| RF-404 | CP-404 | N3 | El removido pierde el acceso de inmediato |
| RF-405 | CP-405 | N3 | Cambiar el rol del propietario o removerlo: error de negocio específico |
| RF-406 | CP-406 | N3 | Un `Mechanic` que intenta invitar: `403` |
| RF-407 | CP-407 | N3 | Cualquier miembro consulta el listado, con rol y estado |

### 4.4 Clientes — nivel empresa

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-501 | CP-501 | N3 | El cliente creado se recupera por identificador |
| RF-502 | CP-502 | N3 | Un cliente creado con la sucursal A activa **se lista** con la sucursal B activa |
| RF-503 | CP-503.1 | N3 | Correo duplicado en la misma empresa: `409 client.duplicate_email` |
| RF-503 | CP-503.2 | N3 | El mismo correo en otra empresa se acepta |
| RF-504 | CP-504.1 | N3 | La baja conserva el registro y lo excluye de los listados activos |
| RF-504 | CP-504.2 | N3 | La búsqueda por nombre o correo opera dentro de la empresa activa |
| RF-505 | CP-505 | N3 | Un `Mechanic` que intenta crear: `403`; consultar sí puede |

### 4.5 Inventario — nivel sucursal

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-601 | CP-601 | N3 | El repuesto queda asociado a la sucursal activa |
| RF-602 | CP-602 | N3 | Un repuesto de la sucursal A **no** aparece al operar con la sucursal B |
| RF-603 | CP-603.1 | N3 | Número de parte duplicado en la misma sucursal: `409` |
| RF-603 | CP-603.2 | N3 | El mismo número de parte se acepta en otra sucursal |
| RF-604 | CP-604.1 | N3 | Cada movimiento deja registro con existencia anterior y posterior — un caso por cada uno de los cinco tipos directos |
| RF-604 | CP-604.2 | N2 | El tipo `transferencia` enviado directamente se rechaza |
| RF-604 | CP-604.3 | N3 | Los movimientos no admiten modificación ni borrado |
| RF-605 | CP-605 | N1 | Cálculo por tipo: `compra` y `devolucion` suman, `venta` y `merma` restan, `ajuste` fija valor absoluto |
| RF-606 | CP-606 | N3 | El movimiento que dejaría existencia negativa se rechaza y **no** altera el stock |
| RF-607 | CP-607 | N3 | El listado de bajo stock devuelve solo los que están en o bajo el mínimo |
| RF-608 | CP-608.1 | N3 | La transferencia descuenta en origen y suma en destino de forma consistente |
| RF-608 | CP-608.2 | N3 | Origen sin existencia suficiente: la operación se rechaza **completa** |
| RF-608 | CP-608.3 | N3 | Destino fuera de la empresa: `403 inventory.cross_organization_transfer` |

### 4.6 Aislamiento y auditoría

| Req. | Caso | Nivel | Criterio ejecutable |
|---|---|---|---|
| RF-701 | CP-701 | **N4 · vía interfaz** | Una cuenta sin membresía recibe `403` en toda operación sobre datos ajenos — lectura y escritura |
| RF-702 | CP-702 | **N4 · vía base de datos** | Consultas ejecutadas con la identidad de otra cuenta, sin pasar por la interfaz, no devuelven filas ajenas |
| RF-703 | CP-703.1–.5 | N3 | Un caso por cada acción crítica: invitación, cambio de rol, remoción, desactivación de sucursal y baja de cliente |
| RF-703 | CP-703.6 | N3 | El registro persiste tras eliminar la entidad o la cuenta referenciada |
| RF-704 | CP-704.1 | N3 | `Mechanic` o `Receptionist` que consulta la auditoría: `403` |
| RF-704 | CP-704.2 | **N4 · vía base de datos** | La restricción se sostiene también por acceso directo: un miembro no propietario no lee el registro |

### 4.7 Requisitos no funcionales

| Req. | Caso | Nivel | Criterio |
|---|---|---|---|
| RNF-101 | CP-N101 | N4 · BD | Todas las tablas de negocio tienen políticas activas; la consulta directa con otra identidad no devuelve filas ajenas |
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
| RNF-304 | CP-N304 | N3 | La base se reconstruye desde cero aplicando las migraciones en orden |
| RNF-401 | CP-N401 | N0 | El cambio de empresa y de sucursal ocurre sin cerrar sesión y los datos mostrados corresponden al nuevo contexto |
| RNF-402 | CP-N402 | N0 | Interfaz utilizable en anchos de escritorio y móvil |
| RNF-403 | CP-N403 | N0 | El manifiesto permite instalar la aplicación desde el navegador |

RNF-501 no aparece: está fuera de alcance como objetivo medible.

---

## 5. Verificación del aislamiento (objetivo específico 4)

Es el entregable central del proyecto. Se detalla aparte porque su diseño —no su cantidad— es lo que sostiene la tesis.

### 5.1 Vía 1 — a través de la interfaz de programación

Verifica la **capa de aplicación**. Con las credenciales de la Cuenta C (sin membresía) y de la Cuenta B (miembro de otra empresa), se intenta cada operación del contrato sobre datos de la Empresa 1:

- Lectura de clientes, de repuestos, de movimientos, de miembros, de sucursales y de auditoría.
- Escritura: crear, modificar y dar de baja en cada uno de esos recursos.
- Con contexto declarado (`X-Org-Id` de la Empresa 1) y sin él.

**Criterio**: ninguna operación devuelve datos de la Empresa 1, y todas responden según §5 del [contrato](10-contrato-api.md) —`403` cuando se declara un contexto ajeno, `404` cuando se referencia un recurso ajeno desde un contexto propio.

### 5.2 Vía 2 — por acceso directo a la base de datos

Verifica la **capa del motor**, y es la que demuestra la premisa del proyecto. Se establece una conexión con la identidad de la Cuenta B **sin pasar por la interfaz de programación**, y se consultan directamente las tablas de negocio de la Empresa 1.

**Criterio**: las consultas se ejecutan sin error y devuelven **cero filas** de la empresa ajena. Que no fallen es parte del resultado: RLS no rechaza la consulta, la filtra — y esa es exactamente la propiedad que se busca demostrar.

Debe cubrir **todas** las tablas de negocio: `clients`, `parts`, `part_movements`, `workshops`, `memberships`, `workshop_assignments` y `audit_log`. Una tabla sin política activa es una fuga, y solo esta vía la detecta: por la interfaz quedaría oculta tras la verificación de la aplicación.

### 5.3 La prueba que justifica la redundancia

RNF-102 exige demostrar que las dos capas son **independientes**, no que ambas existen. Se verifica omitiendo deliberadamente la verificación de membresía de la capa de aplicación y comprobando que el acceso cruzado sigue sin producirse.

Sin este caso, la defensa en profundidad de ADR-002 sería una afirmación de diseño; con él, es un hecho verificado. Es el argumento que responde directamente a la evidencia de Dar et al. (2023) y a la serie de CVE citada en el estado del arte.

### 5.4 Evidencia a conservar

Para que la validación sea reproducible por un tercero (objetivo 4), se conserva: el guion de construcción del escenario base, la salida de la ejecución de los casos CP-701, CP-702, CP-704.2, CP-N101 y CP-N102, y la versión del esquema —identificador de la última migración aplicada— contra la que se ejecutaron.

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

El criterio de cierre del proyecto (§6 del plan de trabajo) exige, sobre las pruebas: que todo requisito `Must` de alcance `Sí` tenga su caso en verde, y que la suite de aislamiento —§5, ejecutada contra un entorno real— sea reproducible desde una base vacía con el guion conservado.

---

## 7. Limitaciones declaradas

Se consignan para que el alcance de la evidencia no se sobreentienda mayor de lo que es:

| Limitación | Alcance real de la evidencia |
|---|---|
| Los casos N3 y N4 se ejecutan sobre un entorno de desarrollo, no productivo | Demuestran la corrección de las políticas y del contrato, no el comportamiento bajo carga ni ante fallos de infraestructura |
| El canal lateral temporal de RLS no se prueba | El aislamiento verificado es el de **contenido** —qué filas se devuelven—, no el de metadatos inferibles por tiempo de ejecución (§3.3 del marco teórico) |
| Las reglas alojadas en funciones del motor solo se prueban contra un motor real | Su cobertura depende del entorno; §6.2 fija cómo se reporta |
| La interfaz de usuario se verifica por inspección | RNF-401 a RNF-403 tienen criterio observable, no automatizado |
| El escenario base usa tres cuentas y tres empresas | Suficiente para las tres preguntas del aislamiento (§2.1), pero no explora el comportamiento con un número elevado de inquilinos |
