# Pendientes

Registro único de lo que queda por resolver antes de la entrega final. Los documentos de entrega se mantienen limpios de notas internas: **todo lo que falte decidir, leer o comprobar vive aquí**.

Recoge lo que está abierto **sobre los documentos**, no el avance de la construcción. Cuándo se hace cada cosa está en el [Plan de trabajo](ingenieria/08-plan-trabajo.md); con qué evidencia se da por cumplido un requisito, en la matriz del [Plan de pruebas](ingenieria/11-plan-pruebas.md).

Cada entrada nace de una afirmación que **los propios documentos dejan declarada como abierta**. Si una de ellas se cierra, se cierra primero en el documento responsable y después se retira de aquí.

## Resumen

| § | Bloque | Entradas | Cuándo |
|---|---|---|---|
| [1](#1-carátula-y-datos-de-entrega) | Carátula y datos de entrega | 4 | Antes de presentar el perfil |
| [2](#2-fuentes-y-referencias) | Fuentes y referencias | 3 | Antes de la entrega final |
| [3](#3-datos-y-normativa-por-contrastar) | Datos y normativa por contrastar | 2 | Antes de la defensa |
| [4](#4-condiciones-que-la-validación-debe-cumplir) | Condiciones que la validación debe cumplir | 3 | Antes de I8 |
| [5](#5-trabajo-de-campo) | Trabajo de campo | 2 | Durante I6 |
| [6](#6-decisiones-abiertas) | Decisiones abiertas | 4 | Según se indica |

---

## 1. Carátula y datos de entrega

El [Perfil de proyecto](anteproyecto/00-perfil-proyecto.md) y el [Anteproyecto integrado](anteproyecto/04-anteproyecto-integrado.md) llevan dos campos en blanco que solo el autor puede completar —no son omisiones de redacción: se dejaron así para no declarar un dato sin confirmar—. A ellos se suma el formato de presentación, que no se ha contrastado contra ninguna guía oficial.

| # | Pendiente | Dónde |
|---|---|---|
| **1.1** | **Nombre del tutor o asesor.** Hoy figura como `_________________________` en la portada de ambos documentos y en el pie de firmas del perfil | Portada del perfil y del anteproyecto integrado |
| **1.2** | **Fecha de presentación** —día y mes—, hoy `La Paz, ____ de ______________ de 2026` | Pie de firmas del perfil |
| **1.3** | **Contrastar la estructura de ambos documentos con la guía de presentación de la Dirección de Postgrado** —preliminares, márgenes, numeración e índice—. Ningún documento del proyecto declara haberla consultado: el formato empleado sigue el estándar del perfil de proyecto de grado boliviano, no una instrucción verificada | Antes de presentar el perfil |
| **1.4** | **Ninguno de los dos documentos lleva índice de contenido**, y el anteproyecto tampoco resumen ni palabras clave. Decidir si la entrega los exige —depende de 1.3— y generarlos en ese caso | Depende de 1.3 |

---

## 2. Fuentes y referencias

El [Anexo de verificación de referencias](anteproyecto/anexo-referencias.md) distingue entre comprobar los **datos bibliográficos** de una fuente y haber leído su **contenido**. Lo que sigue es lo que ese anexo declara sin cerrar, y es la única lista que puede darlo por cerrado.

| # | Pendiente | Estado |
|---|---|---|
| **2.1** | **Leer el texto completo de las cinco fuentes marcadas `Parcial` por contenido**, hoy citadas a partir de su resumen: Alobaywi et al. (2026), Andriianenko (2026), Simić et al. (2024) y Olabanji et al. (2023) del capítulo 2, más Bezemer y Zaidman (2010) del capítulo 3. El anexo ya trae el enlace de acceso abierto de las cinco, de modo que solo queda leerlas. Citar desde un resumen es admisible en un anteproyecto; en el documento final, no | Requiere lectura |
| **2.2** | **Contrastar el ISBN de Brooke (1996)** —`978-0-7484-0460-5`, declarado para *Usability evaluation in industry*— contra el catálogo de Taylor & Francis. Es la única entrada `Falta` de los once ISBN que cita el anteproyecto. Su **contenido** sí está verificado: el capítulo es la fuente primaria de la escala SUS, que sostiene RNF-404 | Requiere comprobación |
| **2.3** | **Fijar la fecha de recuperación definitiva** —el día de la entrega— de las fuentes sin fecha de publicación: documentación técnica con autor corporativo (OpenJS, Microsoft, PostgreSQL ×2, Zod, Meta Open Source y el *Scrum Guide*) y los cuadros del INE. Hoy todas figuran con «Recuperado el 14 de agosto de 2026» | El día de la entrega |

---

## 3. Datos y normativa por contrastar

Dos afirmaciones del cuerpo que los propios capítulos señalan como no cerradas.

| # | Pendiente | Estado |
|---|---|---|
| **3.1** | **Localizar el cuadro oficial del 84,2 % de informalidad laboral.** El [capítulo 2](anteproyecto/02-antecedentes-y-estado-del-arte.md) declara que, a diferencia de las cifras del parque automotor, este dato procede de la Encuesta Continua de Empleo del INE **por vía de difusión secundaria** y queda «por remitir a su cuadro oficial». La salvedad ya está replicada en el perfil y en el anteproyecto, y los tres lo emplean solo como caracterización cualitativa, fuera de todo cálculo | Requiere comprobación, o citar un organismo estatal en lugar de difusión secundaria |
| **3.2** | **El plazo del SIN vence dentro del período del proyecto.** El [Análisis del mercado](ingenieria/09-analisis-mercado.md) afirma que «el SIN extendió la adecuación hasta el **30 de septiembre de 2026**». Esa fecha cae **antes de la defensa**, de modo que la redacción quedará desactualizada: hay que pasarla a pasado y citar la RND que formaliza la prórroga | Antes de la defensa |

---

## 4. Condiciones que la validación debe cumplir

El objetivo 3 no se cumple ejecutando la suite: se cumple ejecutándola **en las condiciones que el propio anteproyecto declaró**. Las tres son preparación, no programación, y deben estar resueltas **antes** de la ventana de I8 (8–21 de diciembre); después no hay margen para repetir el ciclo.

| # | Pendiente | Por qué es condición |
|---|---|---|
| **4.1** | **Conseguir un proyecto de base de datos dedicado y desechable.** El [anteproyecto §17.1](anteproyecto/04-anteproyecto-integrado.md) lo declara «dedicado y desechable, sin datos preexistentes de ninguna clase», y §18.2 añade que las pruebas «no se ejecutarán contra infraestructura de terceros» | Reutilizar un proyecto que ya aloje otro esquema haría falsas ambas declaraciones. O se crea uno propio, o se reescriben §17.1 y §18.2 renunciando a esa afirmación |
| **4.2** | **Definir cómo se conserva la evidencia, antes de generarla.** Por ciclo hay que guardar el guion de construcción del escenario, la salida de los casos CP-701, CP-702, CP-704.2, CP-N101 y CP-N102, y el identificador de la última migración aplicada ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §5.5) | Una ejecución en verde cuya salida no se conservó no es reproducible por un tercero, y esa reproducibilidad **es** la condición del objetivo 3 |
| **4.3** | **Planificar con antelación las tres corridas del *test–retest*.** El plan exige tres ejecuciones del ciclo completo, en **momentos distintos** y sobre entornos **reconstruidos desde las migraciones** ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §5.4) | Encadenarlas en una tarde no cumple el criterio, y una corrida que parta de los datos de la anterior comprueba el aislamiento sobre un escenario acumulado, que no es lo mismo |

---

## 5. Trabajo de campo

Lo que exige la evaluación de usabilidad con operadores (RNF-404) y que no depende del código. El [Plan de pruebas](ingenieria/11-plan-pruebas.md) §7 fija su contenido; aquí consta solo lo que hay que conseguir.

| # | Pendiente | Cuándo |
|---|---|---|
| **5.1** | **Contactar y confirmar a los operadores participantes durante I6** (10–23 de noviembre), no en I8. Es la mitigación del riesgo **R8** del [Plan de trabajo](ingenieria/08-plan-trabajo.md): sobre-reclutar a 8 para asegurar 5 efectivos | Durante I6 |
| **5.2** | **Preparar el material de campo**: formulario de consentimiento informado, guion de tareas T1–T3 y planilla de registro de tiempos e incidencias. Su contenido está fijado en el [Plan de pruebas](ingenieria/11-plan-pruebas.md) §7 y en el [anteproyecto §18.3](anteproyecto/04-anteproyecto-integrado.md) | Antes de I8 |

---

## 6. Decisiones abiertas

### 6.1 Registradas en los ADR

Las dos que [Decisiones de diseño](ingenieria/07-decisiones-diseno.md) consigna como abiertas por depender de funcionalidad excluida del alcance. No bloquean nada del proyecto de grado; constan para que no se den por olvidadas (RNF-206).

| # | Tema | Situación |
|---|---|---|
| **6.1.1** | Proveedor de mensajería por WhatsApp | Abierta — depende de funcionalidad fuera del alcance actual |
| **6.1.2** | Integración con la facturación electrónica del SIN: proveedor autorizado frente a firma digital y generación de XML propias | Abierta — requiere validar la normativa vigente antes de decidir (ver §3.2) |

### 6.2 Ajustes que el esquema deberá recoger

La especificación es la norma y el código se conforma a ella ([índice](README.md), premisas). Estas dos reglas se fijaron en el [Modelo de datos](ingenieria/05-modelo-datos.md) y quedan anotadas aquí para que la construcción las recoja cuando se retome.

| # | Regla fijada | Por qué |
|---|---|---|
| **6.2.1** | **`mt_workshop_assignments` porta `organization_id`**, como toda tabla de negocio | Sin esa columna, su política tendría que resolver el inquilino navegando hasta `mt_workshops`, lo que exigiría una función auxiliar adicional y rompería el principio de un criterio único de aislamiento |
| **6.2.2** | **La inserción en `mt_audit_log` queda reservada al servidor** (ADR-008) | Si la política de inserción se apoyara en `mt_is_org_member`, un miembro autenticado podría insertar entradas por acceso directo y falsear el registro, que es justamente lo que RF-703 debe impedir |
