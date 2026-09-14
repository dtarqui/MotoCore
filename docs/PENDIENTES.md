# Pendientes

Registro único de lo que queda por resolver antes de la entrega final. Los documentos de entrega se mantienen limpios de notas internas: **todo lo que falte decidir, leer o comprobar vive aquí**.

Recoge lo que está abierto **sobre los documentos**, no el avance de la construcción. Cuándo se hace cada cosa está en el [Plan de trabajo](ingenieria/08-plan-trabajo.md); con qué evidencia se da por cumplido un requisito, en la matriz del [Plan de pruebas](ingenieria/11-plan-pruebas.md).

Cada entrada nace de una afirmación que los documentos dejan declarada como abierta, o de un requisito de la [Guía de Investigación Aplicada y Desarrollo Full Stack](<Guía de Investigación Aplicada y Desarrollo Full Stack.md>) que los documentos todavía no cumplen. Si una se cierra, se cierra primero en el documento responsable y después se retira de aquí.

## Resumen

| § | Bloque | Entradas | Cuándo |
|---|---|---|---|
| [1](#1-formato) | Formato | 2 | Antes de presentar el perfil |
| [2](#2-fuentes-y-referencias) | Fuentes y referencias | 4 | Antes de la entrega final |
| [3](#3-datos-y-normativa) | Datos y normativa | 3 | Antes de la defensa |
| [4](#4-condiciones-que-la-validación-debe-cumplir) | Condiciones que la validación debe cumplir | 3 | Antes de I8 |
| [5](#5-trabajo-de-campo) | Trabajo de campo | 2 | Durante I6 |
| [6](#6-decisiones-abiertas) | Decisiones abiertas | 6 | Según se indica |

---

## 1. Formato

| # | Pendiente | Dónde |
|---|---|---|
| **1.1** | **Contrastar la presentación con la guía de formato de la Dirección de Postgrado** —preliminares, márgenes y numeración—. La guía metodológica fija el contenido y los criterios, no el formato de presentación | Ambos documentos |
| **1.2** | **Resumen y palabras clave.** El anteproyecto integrado ya lleva índice; faltan resumen y palabras clave en ambos documentos, y el índice del perfil. Decidir si la entrega los exige —depende de 1.1— y generarlos en ese caso | Ambos documentos |

---

## 2. Fuentes y referencias

| # | Pendiente | Estado |
|---|---|---|
| **2.1** | **Ampliar la matriz del estado del arte a un mínimo de 10 artículos.** La guía lo exige (§3, «Matriz SOTA: mínimo 10 artículos»); hoy hay **5**. Cada fuente nueva debe entrar por el protocolo de revisión, con su DOI contrastado en el anexo. Al completarla cambian: capítulo 2 §2.2.2–§2.2.4 y §2.3; anteproyecto §6.2, §6.3, §6.5, §13 y §16.1; perfil §2, §9.2 y §10; y el anexo de referencias | **Requiere búsqueda** |
| **2.2** | **Leer el texto completo de las seis fuentes citadas a partir de su resumen**: Alobaywi et al. (2026), Andriianenko (2026), Simić et al. (2024) y Olabanji et al. (2023) del capítulo 2, y Bezemer y Zaidman (2010) y Hevner et al. (2004) del capítulo 3. El anexo trae el enlace de acceso de cada una. Citar desde un resumen es admisible en un anteproyecto; en el documento final, no | Requiere lectura |
| **2.3** | **Contrastar el ISBN de Brooke (1996)** —`978-0-7484-0460-5`— contra el catálogo de Taylor & Francis. Es la única entrada `Falta` de los once ISBN citados | Requiere comprobación |
| **2.4** | **Fijar la fecha de recuperación definitiva** —el día de la entrega— de las fuentes sin fecha de publicación: documentación técnica (OpenJS, Microsoft, PostgreSQL ×2, Zod, Meta Open Source y el *Scrum Guide*, hoy con 14 de agosto de 2026), el modelo C4 y la Constitución Política del Estado (hoy con 14 de septiembre de 2026) y los cuadros del INE | El día de la entrega |

---

## 3. Datos y normativa

| # | Pendiente | Estado |
|---|---|---|
| **3.1** | **Localizar el cuadro oficial del 84,2 % de informalidad laboral.** El capítulo 2 declara que procede de difusión secundaria y queda «por remitir a su cuadro oficial» | Requiere comprobación, o citar un organismo estatal |
| **3.2** | **El plazo del SIN vence dentro del período del proyecto.** El [Análisis del mercado](ingenieria/09-analisis-mercado.md) afirma que «el SIN extendió la adecuación hasta el **30 de septiembre de 2026**»; esa fecha cae antes de la defensa. Pasarla a pasado y citar la RND que formaliza la prórroga | Antes de la defensa |
| **3.3** | **Confirmar la vigencia de la declaración de cifrado en reposo** del proveedor de datos (AES-256), que el documento trata como supuesto de seguridad | Antes de exponer producción a operadores |

---

## 4. Condiciones que la validación debe cumplir

El objetivo 4 no se cumple ejecutando la suite: se cumple ejecutándola **en las condiciones que el propio anteproyecto declaró**. Son preparación, no programación, y deben estar resueltas antes de I8 (8–21 de diciembre).

| # | Pendiente | Por qué es condición |
|---|---|---|
| **4.1** | **Conseguir el proyecto de base de datos dedicado y desechable** que declaran el anteproyecto §17.2 y §19.2. Es el tercer proyecto frente al límite de dos del plan gratuito: hay que pausar *staging* durante I8 o activar la contingencia del riesgo R9 | La condición C0 —políticas deshabilitadas— solo puede existir en ese proyecto |
| **4.2** | **Definir cómo se conserva la evidencia, antes de generarla**: guion del escenario, salida de los casos de línea base y de aislamiento, e identificador de la última migración ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §6.6) | Una ejecución cuya salida no se conservó no es reproducible por un tercero |
| **4.3** | **Planificar las tres corridas C0–C3** en momentos distintos y sobre entornos reconstruidos ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §6.5) | Encadenarlas en una tarde, o partir de los datos de la anterior, no cumple el criterio |

---

## 5. Trabajo de campo

Lo que exige el objetivo complementario 5 y no depende del código. Su contenido está en el [Plan de pruebas](ingenieria/11-plan-pruebas.md) §8.

| # | Pendiente | Cuándo |
|---|---|---|
| **5.1** | **Contactar a 36 operadores y confirmar al menos 30 durante I6** (10–23 de noviembre). Es el criterio de continuidad del objetivo 5 y la mitigación del riesgo R8 | Durante I6 |
| **5.2** | **Preparar el material de campo**: formulario de consentimiento informado, guion de tareas T1–T3 para las dos condiciones con la asignación contrabalanceada de cada participante, planilla de tiempos e incidencias, y el escenario de línea base con una cuenta por local ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §3.3) | Antes de I8 |

---

## 6. Decisiones abiertas

### 6.1 Puntos de decisión con fecha

| # | Decisión | Criterio | Fecha |
|---|---|---|---|
| **6.1.1** | Continuar o descartar el **objetivo 5** (usabilidad) | Al menos 30 operadores confirmados | 23 de noviembre de 2026 (H3) |
| **6.1.2** | Continuar o descartar el **objetivo 6** (costo) | Métricas de consumo diarias disponibles en los paneles de los proveedores | 7 de diciembre de 2026 (H4) |
| **6.1.3** | **Elegir el servidor dedicado de referencia** para la línea base de costo y registrar su tarifa ([Plan de pruebas](ingenieria/11-plan-pruebas.md) §9.2) | Instancia mínima capaz de ejecutar la interfaz y la base de datos | Antes de I8, si el objetivo 6 continúa |

### 6.2 Registradas en los ADR

Las dos que [Decisiones de diseño](ingenieria/07-decisiones-diseno.md) consigna como abiertas por depender de funcionalidad excluida del alcance.

| # | Tema | Situación |
|---|---|---|
| **6.2.1** | Proveedor de mensajería por WhatsApp | Abierta — depende de funcionalidad fuera del alcance actual |
| **6.2.2** | Integración con la facturación electrónica del SIN: proveedor autorizado frente a firma digital y generación de XML propias | Abierta — requiere validar la normativa vigente (ver 3.2) |

### 6.3 Ajustes que el esquema deberá recoger

La especificación es la norma y la construcción se conforma a ella. Estas dos reglas se fijaron en el [Modelo de datos](ingenieria/05-modelo-datos.md) y quedan anotadas para que la construcción las recoja.

| # | Regla fijada | Por qué |
|---|---|---|
| **6.3.1** | **`mt_workshop_assignments` porta `organization_id`**, como toda tabla de negocio | Sin esa columna, su política tendría que resolver el inquilino navegando hasta `mt_workshops`, con una función auxiliar adicional |
| **6.3.2** | **La inserción en `mt_audit_log` queda reservada al servidor** (ADR-008) | Si la política de inserción se apoyara en `mt_is_org_member`, un miembro podría insertar entradas por acceso directo y falsear el registro |
