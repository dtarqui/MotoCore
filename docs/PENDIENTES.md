# Pendientes

Registro único de lo que queda por resolver antes de la entrega final. Los documentos de entrega se mantienen limpios de notas internas: **todo lo que falte decidir, leer o comprobar vive aquí**.

Recoge lo que está abierto **sobre los documentos**, no el avance de la construcción. Cuándo se hace cada cosa está en el [Plan de trabajo](ingenieria/08-plan-trabajo.md); con qué evidencia se da por cumplido un requisito, en la matriz del [Plan de pruebas](ingenieria/11-plan-pruebas.md).

Cada entrada nace de una afirmación que los documentos dejan declarada como abierta, o de un requisito de la [Guía de Investigación Aplicada y Desarrollo Full Stack](<Guía de Investigación Aplicada y Desarrollo Full Stack.md>) que los documentos todavía no cumplen. Si una se cierra, se cierra primero en el documento responsable y después se retira de aquí.

> **Desviación declarada respecto de la guía.** El proyecto **no formula hipótesis**: la guía la exige «cuando corresponda» y admite, como alternativa, un **objetivo técnico-experimental** contrastado contra una línea base, que es la vía adoptada. En consecuencia, el anteproyecto no incluye el punto 10 (Hipótesis); el diseño de la validación y su **criterio de éxito**, fijado de antemano, están en el [anteproyecto](anteproyecto/04-anteproyecto-integrado.md), secciones 13.1 a 13.4. La justificación está redactada en la sección 13.1 del anteproyecto.

## Resumen

| Sección | Bloque | Entradas | Cuándo |
|---|---|---|---|
| [1](#1-formato) | Formato | 1 | Antes de presentar el perfil |
| [2](#2-fuentes-y-referencias) | Fuentes y referencias | 3 | Antes de la entrega final |
| [3](#3-datos-y-normativa) | Datos y normativa | 2 | Antes de la defensa |
| [4](#4-condiciones-que-la-validación-debe-cumplir) | Condiciones que la validación debe cumplir | 1 | Antes de I8 |
| [5](#5-trabajo-de-campo) | Trabajo de campo | 2 | Durante I6 |
| [6](#6-decisiones-abiertas) | Decisiones abiertas | 6 | Según se indica |

---

## 1. Formato

| # | Pendiente | Dónde |
|---|---|---|
| **1.1** | **Contrastar la presentación con la guía de formato de la Dirección de Postgrado** —preliminares, márgenes, tipografía y numeración—. La guía metodológica fija el contenido y los criterios, no el formato de presentación. El **resumen, las palabras clave y el índice ya están redactados** en ambos documentos; lo que falta es ajustarlos a la plantilla institucional si esta impone otra estructura | Ambos documentos |

---

## 2. Fuentes y referencias

| # | Pendiente | Estado |
|---|---|---|
| **2.1** | **Leer el texto completo de las nueve fuentes citadas a partir de su resumen**: Alobaywi et al. (2026), Andriianenko (2026), Simić et al. (2024), Zhang et al. (2021), Yassin et al. (2022), Zhu et al. (2024), Yin et al. (2025) y Leburu (2026) del capítulo 2, y Hevner et al. (2004) del capítulo 3. Olabanji et al. (2023) y Bezemer y Zaidman (2010) **ya se leyeron completos** el 14-09-2026. Tres obstáculos concretos: MDPI rechaza la descarga automatizada, IEEE Xplore exige verificación de navegador —incluidos los dos artículos de acceso abierto— y el repositorio de la UTM publica **solo la anotación** de la tesis de Andriianenko | Requiere lectura manual |
| **2.2** | **Fijar la fecha de recuperación definitiva** —el día de la entrega— de las fuentes sin fecha de publicación: documentación técnica (OpenJS, Microsoft, PostgreSQL ×2, Zod, Meta Open Source y el *Scrum Guide*), el modelo C4 y los cuadros del INE. Todas se comprobaron accesibles el **14-09-2026** y llevan hoy esa fecha; solo resta re-comprobarlas y fecharlas el día de la entrega | El día de la entrega |
| **2.3** | **Revisar dos fuentes frente al criterio de la guía** —estado del arte de los **últimos cinco años en IEEE, ACM y Scopus**—. **Olabanji et al. (2023)** se publicó en *WSEAS Transactions on Computers*, revista **discontinuada en Scopus desde 2014**; **Zhang et al. (2021)** se publicó en enero de 2021 y queda en el borde de la ventana de cinco años al llegar la defensa. Decidir entre sustituirlas por artículos de IEEE, ACM o Scopus dentro de la ventana, o justificar su permanencia en el protocolo (capítulo 2, sección 2.2.1) | Requiere decisión |

---

## 3. Datos y normativa

| # | Pendiente | Estado |
|---|---|---|
| **3.1** | **Confirmar que el plazo del SIN venció sin nueva prórroga.** El [Análisis del mercado](ingenieria/09-analisis-mercado.md) cita la **RND 102600000007, de 25 de marzo de 2026**, que amplió la adecuación hasta el **30 de septiembre de 2026**; esa fecha cae antes de la defensa. Comprobar que no se emitió otra resolución posterior y que el texto sigue siendo exacto. **Comprobado el 16-09-2026**: esa RND sigue siendo la última prórroga publicada; como el plazo aún no vence, la comprobación se repite después del 30 de septiembre | Antes de la defensa |
| **3.2** | **Re-confirmar la declaración de cifrado en reposo** del proveedor de datos. Verificada el **14-09-2026** —*«All customer data is encrypted at rest with AES-256 and in transit via TLS»*, con SOC 2 Tipo 2, ISO 27001 y HIPAA—; el supuesto debe revalidarse inmediatamente antes de exponer producción a operadores reales | Antes de exponer producción a operadores |

---

## 4. Condiciones que la validación debe cumplir

El objetivo 4 no se cumple ejecutando la suite: se cumple ejecutándola **en las condiciones que el propio anteproyecto declaró**. Son preparación, no programación, y deben estar resueltas antes de I8 (8–21 de diciembre).

| # | Pendiente | Por qué es condición |
|---|---|---|
| **4.1** | **Conseguir el proyecto de base de datos dedicado y desechable** que declaran las secciones 13.2, 15.2 y 17.2 del anteproyecto. Es el tercer proyecto frente al límite de dos del plan gratuito: hay que pausar *staging* durante I8 o activar la contingencia del riesgo R9 | La condición C0 —políticas deshabilitadas— solo puede existir en ese proyecto |

---

## 5. Trabajo de campo

Lo que exige el objetivo complementario 5 y no depende del código. Su diseño está en el [Plan de pruebas](ingenieria/11-plan-pruebas.md), sección 8; los instrumentos, ya redactados, en [Material de campo](ingenieria/12-material-de-campo.md).

| # | Pendiente | Cuándo |
|---|---|---|
| **5.1** | **Contactar a 36 operadores y confirmar al menos 30 durante I6** (10–23 de noviembre). Es el criterio de continuidad del objetivo 5 y la mitigación del riesgo R8 | Durante I6 |
| **5.3** | **Ejecutar la sesión piloto** con uno o dos operadores ajenos a la muestra y aplicar sus correcciones al guion y a la planilla ([Plan de pruebas](ingenieria/11-plan-pruebas.md), sección 8.9) | Antes de I8, si el objetivo 5 continúa |

---

## 6. Decisiones abiertas

### 6.1 Puntos de decisión con fecha

| # | Decisión | Criterio | Fecha |
|---|---|---|---|
| **6.1.1** | Continuar o descartar el **objetivo 5** (usabilidad) | Al menos 30 operadores confirmados | 23 de noviembre de 2026 (H3) |
| **6.1.2** | Continuar o descartar el **objetivo 6** (costo) | Métricas de consumo diarias disponibles en los paneles de los proveedores | 7 de diciembre de 2026 (H4) |

### 6.2 Registradas en los ADR

Las dos que [Decisiones de diseño](ingenieria/07-decisiones-diseno.md) consigna como abiertas por depender de funcionalidad excluida del alcance.

| # | Tema | Situación |
|---|---|---|
| **6.2.1** | Proveedor de mensajería por WhatsApp | Abierta — depende de funcionalidad fuera del alcance actual |
| **6.2.2** | Integración con la facturación electrónica del SIN: proveedor autorizado frente a firma digital y generación de XML propias | Abierta — requiere validar la normativa vigente (ver 3.1) |

### 6.3 Ajustes que el esquema deberá recoger

La especificación es la norma y la construcción se conforma a ella. Estas dos reglas se fijaron en el [Modelo de datos](ingenieria/05-modelo-datos.md) y quedan anotadas para que la construcción las recoja.

| # | Regla fijada | Por qué |
|---|---|---|
| **6.3.1** | **`mt_workshop_assignments` porta `organization_id`**, como toda tabla de negocio | Sin esa columna, su política tendría que resolver el inquilino navegando hasta `mt_workshops`, con una función auxiliar adicional |
| **6.3.2** | **La inserción en `mt_audit_log` queda reservada al servidor** (ADR-008) | Si la política de inserción se apoyara en `mt_is_org_member`, un miembro podría insertar entradas por acceso directo y falsear el registro |
