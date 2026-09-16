# Historias de usuario

Historias organizadas por épica, con criterios de aceptación en formato **Dado–Cuando–Entonces** y trazabilidad a los requisitos ([Requisitos](02-requisitos.md)) y a la iteración que las construye ([Plan de trabajo](08-plan-trabajo.md), sección 3).

> Solo se detallan las historias **dentro del alcance** del proyecto de grado. Las funcionalidades excluidas ([Sección 1.8.3](../anteproyecto/01-definicion-y-alcance.md)) están en [Requisitos](02-requisitos.md) como RF-800.

## Actores

| Actor | Descripción |
|---|---|
| **Propietario** (`Owner`) | Administra una o varias organizaciones: crea talleres, gestiona miembros y roles, y consulta la auditoría. |
| **Recepcionista** (`Receptionist`) | Atiende al cliente: lo registra y mantiene el catálogo de repuestos. |
| **Mecánico** (`Mechanic`) | Consulta clientes de la organización e inventario del taller activo, y registra movimientos. |

El catálogo completo de actores, incluidos los no humanos, está en [Requisitos](02-requisitos.md), sección 1. Los roles se nombran en inglés en el sistema; aquí se usa la traducción para la narrativa.

## Formato, estimación y definición de terminado

Las historias siguen el formato **rol – objetivo – beneficio** («Como… quiero… para…») y se estiman en **puntos de historia** sobre una escala de Fibonacci, ambas prácticas tomadas de Cohn (2004): `1` trivial; `2` sencilla; `3` moderada; `5` compleja; `8` muy compleja, candidata a dividirse.

Los criterios de aceptación **Dado–Cuando–Entonces** fijan la definición de terminado de cada historia, junto con las condiciones de iteración de [Plan de pruebas](11-plan-pruebas.md), sección 7.1.

> Cohn, M. (2004). *User stories applied: For agile software development*. Addison-Wesley Professional. ISBN 978-0-321-20568-1; [ACM DL 10.5555/984017](https://dl.acm.org/doi/10.5555/984017)

---

## Épica 1 — Acceso y cuenta

### HU-01 — Registro con creación de organización
**Como** propietario de un taller
**quiero** registrarme y que el sistema cree mi organización y mi primer taller en un solo paso
**para** empezar a operar sin configuración adicional.

*Requisitos*: RF-101; *Puntos*: 5; *Iteración*: I3

**Criterios de aceptación**
- **Dado** un correo no registrado, **cuando** envío el formulario con el nombre de mi organización, **entonces** se crean la cuenta, la organización, un taller inicial y mi membresía como `Owner`.
- **Dado** un correo ya registrado, **cuando** intento registrarme, **entonces** recibo un error de cuenta existente y no se crea ninguna organización.
- **Dado** un fallo al crear la organización, **cuando** el registro se interrumpe, **entonces** no queda ningún registro creado a medias.
- **Dada** una contraseña de menos de 8 caracteres, **cuando** envío el formulario, **entonces** la petición se rechaza señalando el campo inválido.

### HU-02 — Inicio de sesión
**Como** usuario registrado
**quiero** iniciar sesión y mantener la sesión activa
**para** trabajar sin volver a autenticarme constantemente.

*Requisitos*: RF-102, RF-103; *Puntos*: 2; *Iteración*: I3

**Criterios de aceptación**
- **Dadas** credenciales válidas, **cuando** inicio sesión, **entonces** obtengo acceso y el sistema reconoce mi identidad en las peticiones siguientes.
- **Dadas** credenciales inválidas, **cuando** inicio sesión, **entonces** recibo un error de autenticación sin detalle sobre qué campo falló.
- **Dada** una petición sin credenciales a un recurso protegido, **cuando** se envía, **entonces** recibo `401`.
- **Dada** una sesión próxima a expirar, **cuando** sigo trabajando, **entonces** se renueva sin que yo intervenga.

### HU-03 — Ver mi perfil y mis organizaciones
**Como** usuario autenticado
**quiero** ver mis datos y la lista de organizaciones a las que pertenezco con mi rol en cada una
**para** saber dónde puedo trabajar y con qué permisos.

*Requisitos*: RF-104, RF-202; *Puntos*: 2; *Iteración*: I3

**Criterios de aceptación**
- **Dadas** mis membresías activas, **cuando** consulto mi perfil, **entonces** veo todas esas organizaciones, cada una con mi rol.
- **Dada** una organización donde fui removido, **cuando** consulto mi perfil, **entonces** ya no aparece.
- **Dadas** organizaciones que creé y otras a las que fui invitado, **cuando** consulto mi perfil, **entonces** aparecen ambas.

---

## Épica 2 — Gestión de organizaciones y talleres

### HU-04 — Crear una organización adicional
**Como** propietario con más de un negocio
**quiero** crear otra organización bajo la misma cuenta
**para** administrarlas sin manejar credenciales separadas.

*Requisitos*: RF-201; *Puntos*: 3; *Iteración*: I4

**Criterios de aceptación**
- **Dada** mi cuenta con una organización, **cuando** creo otra, **entonces** quedo como su `Owner` y aparece en mi listado junto a la anterior.
- **Dadas** dos organizaciones de las que soy propietario, **cuando** opero con una activa, **entonces** no veo datos de la otra.

### HU-05 — Cambiar de organización activa
**Como** propietario de varias organizaciones
**quiero** cambiar entre ellas sin cerrar sesión
**para** operar sobre la que necesito en cada momento.

*Requisitos*: RF-203; *Puntos*: 3; *Iteración*: I3

**Criterios de aceptación**
- **Dada** una organización donde tengo membresía, **cuando** la selecciono, **entonces** el sistema confirma el cambio e informa mi rol en ella.
- **Dada** la organización seleccionada, **cuando** realizo operaciones, **entonces** afectan únicamente a esa organización.
- **Dada** una organización donde no tengo membresía, **cuando** intento activarla, **entonces** recibo un error de autorización.

### HU-06 — Crear y administrar talleres
**Como** propietario
**quiero** registrar los talleres de mi organización
**para** organizar la operación por local.

*Requisitos*: RF-301, RF-302, RF-305; *Puntos*: 5; *Iteración*: I4

**Criterios de aceptación**
- **Dado** que soy `Owner`, **cuando** creo un taller con nombre, dirección y teléfono, **entonces** aparece en el listado de la organización activa.
- **Dado** un taller existente, **cuando** corrijo sus datos, **entonces** el cambio se refleja en su ficha.
- **Dado** un taller activo, **cuando** lo desactivo, **entonces** deja de listarse como activo y su historial se conserva.
- **Dado** un usuario que no es `Owner`, **cuando** intenta crear o desactivar un taller, **entonces** recibe un error de permisos.

### HU-07 — Cambiar de taller activo
**Como** usuario que trabaja en una organización con varios locales
**quiero** seleccionar el taller en el que estoy operando
**para** que el inventario corresponda al local correcto.

*Requisitos*: RF-303; *Puntos*: 3; *Iteración*: I3

**Criterios de aceptación**
- **Dado** un taller activo de la organización activa, **cuando** lo selecciono, **entonces** las operaciones de nivel taller se aplican a él.
- **Dado** un taller de otra organización, **cuando** lo envío como taller activo, **entonces** la operación se rechaza como taller inexistente.
- **Dada** una operación de nivel taller sin taller activo, **cuando** se envía, **entonces** se rechaza con un mensaje claro.

### HU-08 — Asignar miembros a talleres
**Como** propietario
**quiero** indicar en qué taller trabaja cada miembro
**para** organizar al equipo y poder reportar por local.

*Requisitos*: RF-304; *Puntos*: 3; *Iteración*: I4

**Criterios de aceptación**
- **Dado** un miembro de mi organización, **cuando** lo asigno a uno o varios talleres, **entonces** la asignación queda registrada.
- **Dado** un miembro asignado, **cuando** consulta datos de la organización, **entonces** ve exactamente lo mismo que antes: sus permisos siguen dependiendo de su rol.
- **Dada** una asignación, **cuando** la retiro, **entonces** la membresía del usuario no se afecta.

---

## Épica 3 — Equipo y permisos

### HU-09 — Invitar a un miembro
**Como** propietario
**quiero** invitar a alguien a mi organización con un rol
**para** que trabaje conmigo con los permisos adecuados.

*Requisitos*: RF-401, RF-402, RF-406; *Puntos*: 5; *Iteración*: I4

**Criterios de aceptación**
- **Dada** una cuenta existente, **cuando** la invito por correo con rol `Mechanic` o `Receptionist`, **entonces** accede a mi organización.
- **Dada** una invitación con rol `Owner`, **cuando** la envío, **entonces** se rechaza.
- **Dado** un correo sin cuenta, **cuando** lo invito, **entonces** recibo un error indicando que no puede invitarse.
- **Dada** una persona que ya es miembro activo, **cuando** la invito, **entonces** recibo un error de duplicado.
- **Dada** una persona removida antes, **cuando** la invito de nuevo, **entonces** su membresía se reactiva con el nuevo rol.
- **Dado** un `Mechanic` o `Receptionist`, **cuando** intenta invitar, **entonces** recibe un error de permisos.

### HU-10 — Cambiar el rol de un miembro
**Como** propietario
**quiero** modificar el rol de un miembro
**para** ajustar sus permisos cuando cambian sus responsabilidades.

*Requisitos*: RF-403, RF-405; *Puntos*: 3; *Iteración*: I4

**Criterios de aceptación**
- **Dado** un `Mechanic`, **cuando** cambio su rol a `Receptionist`, **entonces** el cambio tiene efecto inmediato sobre lo que puede hacer.
- **Dado** el `Owner` de la organización, **cuando** intento cambiar su rol, **entonces** la operación se rechaza.

### HU-11 — Remover a un miembro
**Como** propietario
**quiero** quitar a alguien de mi organización
**para** revocar su acceso cuando deja de trabajar conmigo.

*Requisitos*: RF-404, RF-405; *Puntos*: 3; *Iteración*: I4

**Criterios de aceptación**
- **Dado** un miembro activo, **cuando** lo remuevo, **entonces** deja de ver la organización y sus datos.
- **Dado** el `Owner` de la organización, **cuando** intento removerlo, **entonces** la operación se rechaza.
- **Dada** una remoción, **cuando** se completa, **entonces** queda registrada en la auditoría.

### HU-12 — Ver el equipo
**Como** miembro de una organización
**quiero** ver quiénes la integran y con qué rol
**para** saber a quién dirigirme.

*Requisitos*: RF-407; *Puntos*: 2; *Iteración*: I4

**Criterios de aceptación**
- **Dada** mi membresía activa, **cuando** consulto el equipo, **entonces** veo nombre, correo, rol y estado de cada miembro.
- **Dadas** varias organizaciones, **cuando** consulto el equipo, **entonces** solo veo miembros de la organización activa.

---

## Épica 4 — Clientes *(demostración de nivel organización)*

### HU-13 — Registrar un cliente
**Como** recepcionista
**quiero** registrar a un cliente
**para** poder asociarle servicios después.

*Requisitos*: RF-501, RF-503, RF-505; *Puntos*: 3; *Iteración*: I5

**Criterios de aceptación**
- **Dados** nombre, correo y teléfono válidos, **cuando** registro al cliente, **entonces** queda en la organización activa.
- **Dado** un correo ya registrado en esta organización, **cuando** lo registro de nuevo, **entonces** la operación se rechaza.
- **Dado** el mismo correo en otra organización, **cuando** lo registro aquí, **entonces** se acepta sin conflicto.
- **Dado** un `Mechanic`, **cuando** intenta registrar un cliente, **entonces** recibe un error de permisos.

### HU-14 — Consultar clientes desde cualquier taller
**Como** recepcionista de un taller
**quiero** ver los clientes de toda la organización
**para** atender a alguien que fue registrado en otro local.

*Requisitos*: RF-502; *Puntos*: 3; *Iteración*: I5

**Criterios de aceptación**
- **Dado** un cliente registrado con el taller A activo, **cuando** consulto con el taller B de la misma organización activo, **entonces** aparece.
- **Dado** un cliente de otra organización, **cuando** consulto el listado, **entonces** no aparece en ningún caso.
- **Dado** un nombre o correo, **cuando** busco, **entonces** los resultados se limitan a la organización activa.

### HU-15 — Editar y dar de baja un cliente
**Como** recepcionista
**quiero** corregir los datos de un cliente o darlo de baja
**para** mantener la información al día.

*Requisitos*: RF-504; *Puntos*: 2; *Iteración*: I5

**Criterios de aceptación**
- **Dado** un cliente de mi organización, **cuando** edito sus datos de contacto, **entonces** el cambio se refleja.
- **Dado** un cliente activo, **cuando** lo doy de baja, **entonces** desaparece de los listados activos y su registro se conserva.
- **Dado** un cliente de otra organización, **cuando** intento editarlo, **entonces** la operación responde como si no existiera.

---

## Épica 5 — Inventario *(demostración de nivel taller)*

### HU-16 — Registrar un repuesto en mi taller
**Como** recepcionista
**quiero** registrar un repuesto con su stock inicial
**para** llevar el control de existencias de mi local.

*Requisitos*: RF-601, RF-603, RF-609; *Puntos*: 3; *Iteración*: I6

**Criterios de aceptación**
- **Dado** el taller activo, **cuando** registro un repuesto, **entonces** queda asociado a ese taller.
- **Dado** un `Mechanic`, **cuando** intenta registrar o editar un repuesto, **entonces** recibe un error de permisos; **cuando** lo consulta o registra un movimiento, **entonces** se acepta.
- **Dado** un número de parte existente en el mismo taller, **cuando** lo repito, **entonces** se rechaza; **dado** el mismo número en otro taller de la organización, **entonces** se acepta.
- **Dado** un stock inicial mayor que cero, **cuando** registro el repuesto, **entonces** se genera automáticamente un movimiento de entrada.

### HU-17 — Ver solo el inventario del taller activo
**Como** mecánico
**quiero** ver las existencias del taller que tengo seleccionado
**para** saber con qué cuento sin confundirme con otro taller.

> El filtro lo determina el **taller activo** de la petición, no la asignación del miembro a talleres: esa asignación es operativa y no restringe lo que puede verse ([ADR-006](07-decisiones-diseno.md)).

*Requisitos*: RF-602; *Puntos*: 3; *Iteración*: I6

**Criterios de aceptación**
- **Dado** el taller activo, **cuando** consulto el inventario, **entonces** solo aparecen sus repuestos.
- **Dado** un repuesto de otro taller de la misma organización, **cuando** consulto, **entonces** no aparece.
- **Dado** un repuesto de otra organización, **cuando** consulto, **entonces** no aparece bajo ninguna circunstancia.

### HU-18 — Registrar movimientos de stock
**Como** recepcionista
**quiero** registrar entradas y salidas de repuestos
**para** que la existencia refleje la realidad del local.

*Requisitos*: RF-604, RF-605, RF-606; *Puntos*: 5; *Iteración*: I6

**Criterios de aceptación**
- **Dado** cada tipo directo —compra, venta, ajuste, devolución y merma—, **cuando** lo registro, **entonces** se acepta; **dado** el tipo transferencia, **entonces** se rechaza, porque lo genera HU-20.
- **Dada** una compra o devolución, **cuando** se registra, **entonces** suma; **dada** una venta o merma, **entonces** resta; **dado** un ajuste, **entonces** fija la existencia en un valor absoluto.
- **Dado** cualquier movimiento, **cuando** se registra, **entonces** guarda la existencia anterior y la resultante.
- **Dado** un movimiento que dejaría la existencia negativa, **cuando** se registra, **entonces** se rechaza y el stock no cambia.
- **Dado** un movimiento registrado, **cuando** intento editarlo o borrarlo, **entonces** no es posible.

### HU-19 — Detectar repuestos con bajo stock
**Como** propietario
**quiero** ver qué repuestos están en o por debajo del mínimo
**para** reponer a tiempo.

*Requisitos*: RF-607; *Puntos*: 2; *Iteración*: I6

**Criterios de aceptación**
- **Dado** el taller activo, **cuando** consulto el bajo stock, **entonces** aparecen solo sus repuestos con existencia menor o igual al mínimo.

### HU-20 — Transferir stock entre talleres
**Como** propietario
**quiero** mover repuestos de un taller a otro
**para** cubrir faltantes sin comprar de nuevo.

*Requisitos*: RF-608, RF-609; *Puntos*: 5; *Prioridad*: `Could`; *Iteración*: I6, si hay margen

**Criterios de aceptación**
- **Dada** existencia suficiente en el origen, **cuando** transfiero, **entonces** descuenta en el origen y suma en el destino.
- **Dado** un destino de otra organización, **cuando** transfiero, **entonces** la operación se rechaza.
- **Dada** existencia insuficiente en el origen, **cuando** transfiero, **entonces** la operación se rechaza completa, sin quedar a medias.

---

## Épica 6 — Aislamiento y trazabilidad *(transversal)*

### HU-21 — Garantía de aislamiento entre organizaciones
**Como** propietario
**quiero** tener la certeza de que ninguna otra organización puede ver mis datos
**para** confiar en la plataforma con información de mi negocio.

*Requisitos*: RF-701, RF-702, RNF-101, RNF-102; *Puntos*: 8; *Iteración*: casos desde I3; ejecución de la validación en I8

**Criterios de aceptación**
- **Dada** una cuenta sin membresía en mi organización, **cuando** opera sobre mis datos por la interfaz, **entonces** recibe un error de autorización en cualquier operación.
- **Dada** otra identidad, **cuando** consulta directamente la base de datos, **entonces** no obtiene ninguna de mis filas.
- **Dada** la verificación de la capa de aplicación omitida en el banco de pruebas, **cuando** otra cuenta consulta mis datos, **entonces** el aislamiento se mantiene.
- **Dada** la línea base con las políticas deshabilitadas, **cuando** se ejecuta la misma consulta, **entonces** muestra la fuga que las otras condiciones impiden.

### HU-22 — Registro de acciones críticas
**Como** propietario
**quiero** un registro de los cambios sensibles
**para** saber quién hizo qué y cuándo.

*Requisitos*: RF-703, RF-704; *Puntos*: 3; *Iteración*: I8

**Criterios de aceptación**
- **Dada** cada una de las seis acciones críticas de RF-703, **cuando** se ejecuta, **entonces** queda registrada con autor, acción y fecha.
- **Dada** la eliminación de la entidad o del usuario referenciado, **cuando** consulto la auditoría, **entonces** el registro sigue presente.
- **Dado** un `Mechanic` o `Receptionist`, **cuando** consulta la auditoría por la interfaz o directamente en la base de datos, **entonces** recibe un error de permisos o ninguna fila.

---

## Resumen

| Épica | Historias | Puntos |
|---|---|---|
| 1 — Acceso y cuenta | HU-01 a HU-03 | 9 |
| 2 — Organizaciones y talleres | HU-04 a HU-08 | 17 |
| 3 — Equipo y permisos | HU-09 a HU-12 | 13 |
| 4 — Clientes (nivel organización) | HU-13 a HU-15 | 8 |
| 5 — Inventario (nivel taller) | HU-16 a HU-20 | 18 |
| 6 — Aislamiento y trazabilidad | HU-21, HU-22 | 11 |
| **Total** | **22 historias** | **76 puntos** |

La distribución por fases e iteraciones está en [Plan de trabajo](08-plan-trabajo.md), sección 3.
