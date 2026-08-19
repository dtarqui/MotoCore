<div align="center">

**UNIVERSIDAD CATÓLICA BOLIVIANA "SAN PABLO"**

**DIRECCIÓN DE POSTGRADO**

**MAESTRÍA EN FULL STACK DEVELOPMENT**

---

## PERFIL DE PROYECTO DE GRADO

### Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para organizaciones de servicio de motocicletas en Bolivia

---

**Postulante:** Daniel Mauricio Tarqui Apaza

**Tutor / Asesor:** _________________________

**Unidad Académica:** La Paz

**Modalidad de graduación:** Proyecto de Grado

La Paz – Bolivia
2026

</div>

---

## 1. Datos generales

| Campo | Detalle |
|---|---|
| **Título** | Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para organizaciones de servicio de motocicletas en Bolivia |
| **Programa** | Maestría en Full Stack Development |
| **Línea de investigación** | Arquitectura de software y seguridad de datos en aplicaciones de software como servicio |
| **Modalidad** | Proyecto de Grado |
| **Área de conocimiento** | Ingeniería de software · Bases de datos · Computación en la nube |
| **Período de ejecución** | Septiembre a diciembre de 2026 (cuatro meses) |
| **Ámbito de aplicación** | Organizaciones de servicio y reparación de motocicletas en Bolivia |

---

## 2. Antecedentes

**El parque de motocicletas y la demanda de servicio.** La motocicleta es el vehículo más numeroso de Bolivia. Según el Instituto Nacional de Estadística (INE), a partir de los registros del Registro Único para la Administración Tributaria Municipal (RUAT), en **2025** se contabilizaron **931.205 motocicletas**, el **34,8 %** del parque automotor nacional, encabezándolo por delante de vagonetas, automóviles y camionetas. Su crecimiento supera al del parque en conjunto: de **657.718 unidades en 2021** pasó a **872.550 en 2024** y a **931.205 en 2025**, **+41,6 % en cuatro años**, frente al +20,0 % del parque automotor total en el mismo período. Cada unidad requiere mantenimiento periódico, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio.

**Condiciones del sector.** Ese crecimiento ocurre en una economía marcadamente informal: el indicador de **informalidad laboral del 84,2 % en 2024**, procedente de la Encuesta Continua de Empleo del INE, se emplea aquí como caracterización cualitativa del sector y no interviene en ningún cálculo del documento (capítulo 2, §2.1). Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo.

**El operador que crece.** En ese contexto, quien abre un segundo o tercer taller —o constituye más de una organización— no encuentra herramientas que le permitan administrarlas de forma centralizada. Debe optar entre llevar cada local como una instalación independiente, perdiendo la visión unificada del cliente y su historial, o renunciar a la especialización y volver a soluciones genéricas.

**Antecedentes científicos.** La literatura reciente sobre aislamiento entre inquilinos en arquitecturas de esquema compartido —Dar, Hershcovitch y Morrison (2023), Alobaywi et al. (2026), Andriianenko (2026) y Olabanji et al. (2023)— aborda el problema en modelos de inquilino **plano y de un solo nivel**. Simić et al. (2024) sí modelan una jerarquía de inquilinos, pero su aislamiento opera sobre **recursos de infraestructura** y no sobre las filas de una base de datos relacional compartida. Ninguno trata, por tanto, la decisión arquitectónica de dónde ubicar el límite de aislamiento **en la capa de datos** cuando el inquilino posee una subdivisión interna cuyas entidades no comparten el mismo alcance. A ello se suma la evidencia técnica de que la aplicación de políticas de seguridad a nivel de fila ha fallado de forma recurrente en producción (CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976).

---

## 3. Planteamiento del problema

### 3.1 Situación problemática

**Síntoma.** Un operador que administra una o varias organizaciones de servicio de motocicletas, cada una con uno o varios talleres, no dispone en Bolivia de una plataforma que le permita gestionarlas desde una sola cuenta con visión consolidada.

**Causa.** El software de gestión de talleres con presencia en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller) y el regional (Appli-Car, Garage App) está construido sobre arquitecturas de **un solo inquilino**: asumen un taller por cuenta. No modelan la pertenencia de varias organizaciones a una misma cuenta ni la de varios talleres a una misma organización. Cuando existe algún aislamiento entre clientes del sistema, se resuelve **únicamente en el código de la aplicación**: basta que una consulta omita el filtro correspondiente para que se produzca una fuga de datos, porque no hay ningún control por debajo que lo impida.

**Impacto.**

| Efecto | Consecuencia |
|---|---|
| Pérdida de la visión consolidada | El historial del cliente queda fragmentado entre talleres de la misma organización, que es justamente lo que se busca al centralizar |
| Riesgo de fuga de datos entre organizaciones | Al depender el aislamiento de que cada consulta esté correctamente escrita, un solo error de programación expone información de un cliente del sistema a otro |
| Barrera de costo | La infraestructura tradicional eleva el costo de entrada, factor crítico en un sector con alta informalidad y bajo presupuesto de tecnología |

### 3.2 Formulación del problema

> **¿De qué manera el diseño e implementación de una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento aplicado mediante seguridad a nivel de fila, mejora la gestión centralizada y la seguridad de los datos de operadores de varias organizaciones y talleres de servicio de motocicletas en Bolivia?**

### 3.3 Sistematización del problema

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué ventajas y limitaciones, y qué carencias presentan frente al modelo multiorganización las soluciones de gestión de talleres disponibles en Bolivia?
2. ¿Qué modelo de datos y qué políticas de seguridad a nivel de fila permiten representar la jerarquía organización → talleres sin fragmentar la información del cliente y sosteniendo un único límite de aislamiento?
3. ¿Cómo se implementan la identidad, la jerarquía organizacional, el control de acceso por rol y el alcance diferenciado de datos sobre una plataforma serverless con verificación automatizada en cada integración?
4. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre organizaciones se cumple incluso ante fallos de la capa de aplicación, y que el cambio de contexto entre organizaciones y talleres resulta usable para el operador?

---

## 4. Objetivos

### 4.1 Objetivo general

> **Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (organización → talleres) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias organizaciones de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos.**

### 4.2 Objetivos específicos

Cuatro objetivos secuenciales, uno por fase — **Analizar → Diseñar → Implementar → Validar** —, cada uno correlativo a una pregunta de la sistematización y cerrado con un entregable verificable.

| # | Objetivo específico | Entregable verificable |
|---|---|---|
| 1 | **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— y las soluciones de gestión de talleres con presencia en Bolivia, para fundamentar la selección arquitectónica e identificar el vacío que justifica el proyecto | Matriz de extracción del estado del arte · análisis del mercado con el vacío identificado |
| 2 | **Diseñar** el modelo de datos de la jerarquía organización → talleres —con el alcance de cada entidad según su nivel y las restricciones que de él se derivan— y **especificar** las políticas de seguridad a nivel de fila y las funciones de verificación de membresía que sostienen un único límite de aislamiento | Modelo entidad-relación con alcance por nivel · contrato de la interfaz de programación · migración con políticas y funciones de verificación |
| 3 | **Implementar** sobre infraestructura serverless la capa de identidad, la jerarquía organizacional y el control de acceso por rol, junto con el corte vertical que demuestra el alcance diferenciado de datos, y **automatizar** un pipeline de integración continua | Sistema con registro, organizaciones, talleres, miembros, clientes e inventario operativos · pipeline en verde en cada integración |
| 4 | **Validar** el aislamiento mediante pruebas automatizadas que comprueben, tanto por la interfaz de programación como por acceso directo a la base de datos, que una organización no accede a datos de otra aun cuando la capa de aplicación omita sus controles, y **evaluar** con operadores del rubro la usabilidad del cambio de contexto entre organizaciones y talleres | Suite de pruebas de aislamiento con su matriz requisito → caso → evidencia, reproducible desde una base vacía · informe de evaluación de usabilidad con tasa de éxito por tarea y puntuación SUS |

---

## 5. Hipótesis

Por tratarse de una investigación explicativa que propone aplicar una arquitectura determinada para mejorar una propiedad medible del sistema, corresponde formular hipótesis. Se enuncia como **afirmación factual** —no como promesa futura—, de modo que quede sujeta a comprobación o refutación empírica.

**Hipótesis de investigación (H1)**

> **La implementación de una arquitectura multi-tenant jerárquica —que sitúa el límite de aislamiento en la organización y trata el taller como criterio de alcance operativo, con políticas de seguridad a nivel de fila reforzadas por verificación de membresía en la capa de aplicación— eliminó el acceso cruzado de datos entre organizaciones, reduciendo a cero (0) las filas ajenas devueltas, y sostuvo esa separación aun con la verificación de la capa de aplicación deshabilitada.**

**Hipótesis nula (H0)**

> La arquitectura propuesta no produce una mejora medible del aislamiento: al menos una consulta ejecutada con la identidad de una cuenta ajena devuelve filas de otra organización, o la separación deja de sostenerse cuando la capa de aplicación omite sus controles.

### Variables e indicadores

| Tipo | Variable | Indicadores | Instrumento de medición |
|---|---|---|---|
| **Independiente** | Arquitectura multi-tenant jerárquica con aislamiento en dos capas | Número de niveles jerárquicos modelados · número de límites de aislamiento · cobertura de tablas de negocio con políticas activas | Modelo de datos y migraciones versionadas |
| **Dependiente** | Separación verificable de datos entre organizaciones | **Filas ajenas devueltas por acceso directo a la base de datos = 0** · respuestas de autorización correctas en el 100 % de las operaciones del contrato · casos de aislamiento en verde con la verificación de la aplicación deshabilitada | Suite automatizada de pruebas de aislamiento |
| **Dependiente** | Gestión centralizada | El cliente registrado en un taller es accesible desde cualquier otro de la misma organización · cambio de organización y de taller activos sin cerrar sesión | Casos de prueba de alcance por nivel |
| **Dependiente** | Usabilidad del cambio de contexto | Tasa de éxito por tarea · tiempo y errores por tarea (descriptivos) · puntuación SUS | Observación estructurada de tareas guiadas · cuestionario SUS |
| **Interviniente** | Modelo de despliegue serverless | Condición de ejecución que impone ausencia de estado entre peticiones y costo proporcional al uso; no se manipula, se mantiene constante | — |


---

## 6. Justificación

### 6.1 Justificación teórica

El estado del arte aborda el aislamiento entre inquilinos en modelos **planos**. Este proyecto extiende el problema a una **multi-tenancy jerárquica**, donde el inquilino posee una subdivisión interna y las entidades no comparten el mismo alcance: unas siguen al cliente y pertenecen a la organización, otras responden a la existencia física de un local y pertenecen al taller. Sostener un aislamiento verificable bajo esa asimetría, con un único límite de seguridad, es el aporte que el proyecto disputa a la literatura revisada.

### 6.2 Justificación práctica

Ofrece a los operadores bolivianos de servicio de motocicletas una plataforma que hoy no existe en su mercado: administrar varias organizaciones desde una sola cuenta, con visión consolidada del cliente entre talleres y con separación de datos demostrable. El relevamiento del mercado confirma que la gestión de varias organizaciones por cuenta está **ausente** en la oferta local, y que ninguna solución relevada documenta su aislamiento entre organizaciones.

### 6.3 Justificación metodológica

Aporta un procedimiento reproducible para **verificar** el aislamiento multi-tenant, no solo para afirmarlo: dos vías independientes de comprobación —por la interfaz de programación y por acceso directo al motor— con un escenario de datos construido por la propia prueba y una matriz que traza cada requisito hasta su evidencia. El procedimiento es aplicable a cualquier sistema de esquema compartido, con independencia del rubro.

### 6.4 Justificación social y económica

El modelo de despliegue serverless, con escalado a cero y sin costo fijo por organización, hace económicamente viable ofrecer software especializado a un sector con **84,2 % de informalidad laboral** y presupuesto de tecnología mínimo. La barrera de costo identificada en el planteamiento del problema es, en sí misma, una condición de diseño del proyecto.

---

## 7. Alcance y delimitación

### 7.1 Delimitación

| Dimensión | Delimitación |
|---|---|
| **Espacial / organizacional** | Organizaciones de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una organización y/o más de un taller |
| **Temporal** | Desarrollo y validación entre septiembre y diciembre de 2026 |
| **Temática / técnica** | La capa de identidad, jerarquía organizacional y aislamiento de datos: cuentas, organizaciones, talleres, membresías con rol, y las políticas que las hacen cumplir en la base de datos |

### 7.2 Alcance funcional

- Registro que crea una cuenta, su primera organización y su primer taller, con el usuario como propietario.
- Creación de organizaciones adicionales bajo la misma cuenta y de talleres dentro de cada organización.
- Listado de organizaciones según membresía, cambio de organización activa y selección de taller activo.
- Gestión de miembros por organización —invitar, cambiar rol, remover—, reservada al propietario, y asignación operativa de miembros a talleres.
- **Corte vertical de demostración**: **Clientes** (entidad de nivel organización, visible desde cualquier taller) e **Inventario de repuestos** (entidad de nivel taller, acotada a su local). Son el mínimo necesario para demostrar que el alcance por nivel funciona, y se eligen por no depender de otros módulos.
- Verificación de aislamiento por dos vías independientes.
- **Evaluación de usabilidad del cambio de contexto** con operadores del rubro, mediante tareas guiadas.

### 7.3 Alcance técnico

| Componente | Tecnología |
|---|---|
| Servidor | Node.js · TypeScript · Hono · Zod |
| Datos e identidad | PostgreSQL con seguridad a nivel de fila, sobre proveedor gestionado |
| Despliegue | Funciones serverless |
| Interfaz de usuario | React con TypeScript, responsiva e instalable |
| Pruebas | Vitest — unitarias, de contrato, de integración y de aislamiento |
| Integración continua | Pipeline automatizado con verificación de tipos y suite de pruebas |

### 7.4 Exclusiones

El objeto de estudio es la **arquitectura**, no la suite funcional completa. No forman parte del proyecto:

- Los módulos operativos fuera del corte vertical: motocicletas, órdenes de trabajo, historial de mantenimiento y panel de métricas.
- La auditoría extendida a la totalidad de las entidades de negocio; sí se audita el conjunto acotado de acciones críticas.
- La integración con mensajería por WhatsApp.
- La emisión de factura electrónica del Servicio de Impuestos Nacionales.
- Aplicaciones móviles o de escritorio nativas: solo web responsiva e instalable.
- Migración de datos productivos desde sistemas anteriores.
- Pruebas de carga o rendimiento a escala productiva.
- La evaluación de usabilidad de la **totalidad** de la interfaz: se evalúa el cambio de contexto entre organizaciones y talleres, no las demás pantallas.

---

## 8. Marco teórico y conceptual — síntesis

El marco se organiza en cuatro bloques, y de cada teoría se consigna además su limitación documentada y la adaptación que impone el contexto boliviano.

| Bloque | Teorías y modelos | Qué decisión del proyecto fundamentan |
|---|---|---|
| **Arquitectura** | Estilo REST y restricción de ausencia de estado (Fielding, 2000) · atributos de calidad y tácticas (Bass et al., 2021) · modelos de multi-tenancy (Krebs et al., 2012; Bezemer & Zaidman, 2010) · computación serverless (Jonas et al., 2019) | Contexto activo declarado por petición · el aislamiento como atributo de calidad rector · esquema compartido reforzado en el motor · despliegue sin costo fijo |
| **Persistencia** | Modelo relacional (Codd, 1970) · propiedades ACID (Haerder & Reuter, 1983) · teorema CAP (Gilbert & Lynch, 2002) · sistemas de tipos (Pierce, 2002; Gao et al., 2017) | Reglas de acceso como condiciones lógicas sobre relaciones · atomicidad de las operaciones compuestas · motor relacional único con consistencia fuerte · verificación estática como primera barrera |
| **Frontend** | Separación de responsabilidades y composición por componentes (Krasner & Pope, 1988) · umbrales de percepción (Nielsen, 1993) · manifiesto de aplicación web (World Wide Web Consortium [W3C], 2026) · evaluación con muestras pequeñas (Nielsen & Landauer, 1993) y medición de satisfacción (Brooke, 1996; Bangor et al., 2008) | Contexto activo elevado a un componente contenedor · tiempos de respuesta como criterio de diseño y no como objetivo medido · alcance multiplataforma con una sola base de código · muestra de 5 a 8 operadores y umbral SUS ≥ 68 |
| **Seguridad** | Principios de diseño de sistemas protegidos (Saltzer & Schroeder, 1975) · control de acceso basado en roles (Sandhu et al., 1996) · confianza cero (Rose et al., 2020) · defensa en profundidad | Mediación completa en el motor · valores por defecto seguros · rol por organización y no global · verificación en cada petición · aislamiento en dos capas independientes |
| **Metodología de construcción** | Desarrollo iterativo (Larman & Basili, 2003) · integración continua (Humble & Farley, 2010; Forsgren et al., 2018) · pruebas como especificación previa (Beck, 2002) | Iteraciones de dos semanas con incremento verificado · pipeline en cada integración · pruebas de aislamiento escritas antes que la funcionalidad |

**Revisión crítica.** Ninguna teoría se adopta sin consignar su límite. La computación serverless arrastra latencia de arranque en frío y dependencia del proveedor; la seguridad a nivel de fila filtra información por el tiempo de ejecución de la consulta (Dar et al., 2023); el esquema compartido dispersa la conciencia de inquilino por la base de código; la confianza cero, en su forma completa, supone una infraestructura inexistente en una pequeña organización; y el modelo de muestras pequeñas vale para detectar problemas de usabilidad, no para estimar parámetros poblacionales. En cada caso **se retiene el principio y se descarta la implantación** cuando esta excede los medios disponibles.

---

## 9. Diseño metodológico

### 9.1 Tipo, enfoque y alcance

Las categorías empleadas —tipo, enfoque, alcance, método y diseño— siguen la clasificación de Hernández-Sampieri y Mendoza (2018).

| Dimensión | Definición adoptada |
|---|---|
| **Tipo de investigación** | **Aplicada**: no busca conocimiento general, sino resolver un problema concreto mediante un artefacto de software verificable |
| **Enfoque** | **Mixto con predominio cualitativo**. El componente cualitativo abarca la revisión de literatura, el relevamiento del mercado y el diseño arquitectónico; el cuantitativo se limita a la medición objetiva del aislamiento (filas ajenas devueltas, casos en verde, cobertura de políticas) |
| **Alcance** | **Descriptivo** en la fase de análisis, **propositivo** en la de diseño y **explicativo-experimental** en la de validación |
| **Método** | **Hipotético-deductivo** aplicado a la verificación: la hipótesis se somete a pruebas capaces de refutarla |
| **Diseño** | **Experimental sobre caso único**: el artefacto construido es la unidad de observación, y las pruebas manipulan deliberadamente la condición de aislamiento —incluida la omisión de la capa de aplicación— para observar su efecto |

### 9.2 Unidades de análisis

**Dos unidades de análisis, de naturaleza distinta:**

1. **Técnica** — las tablas de negocio del esquema y las operaciones del contrato de la interfaz. Sus sujetos son cuentas sintéticas construidas por la propia prueba: no intervienen personas.
2. **De uso** — el cambio de contexto entre organizaciones y talleres, evaluado con **de 5 a 8 operadores** del rubro (muestreo no probabilístico intencional; tamaño justificado por Nielsen y Landauer, 1993, que muestran que la detección de problemas de usabilidad se satura pronto). Aquí **sí participan personas**, lo que exige consentimiento informado, anonimización de los resultados y derecho a retirarse en cualquier momento.

### 9.3 Técnicas e instrumentos

| Objetivo | Técnica | Instrumento | Producto |
|---|---|---|---|
| 1 | Revisión sistemática de literatura con criterios de inclusión y exclusión (2021–2026, revisión por pares) | Matriz de extracción | Estado del arte con vacío identificado |
| 1 | Análisis documental de la oferta del mercado | Matriz comparativa de capacidades | Análisis del mercado boliviano |
| 2 | Modelado conceptual y lógico de datos | Diagrama entidad-relación · especificación de políticas | Modelo jerárquico y contrato de interfaz |
| 3 | Desarrollo iterativo e incremental | Control de versiones · integración continua | Sistema funcional con corte vertical |
| 4 | **Experimentación controlada** por dos vías independientes | Suite automatizada de pruebas · matriz requisito → caso → evidencia | Evidencia reproducible de aislamiento |
| 4 | **Observación estructurada** de tareas guiadas con operadores | Guion de tareas T1–T3 · cuestionario SUS (Brooke, 1996), interpretado según el baremo de Bangor et al. (2008) | Informe de usabilidad del cambio de contexto |

### 9.4 Procesamiento y análisis de los resultados

El resultado de cada caso de prueba es **binario y objetivo** —pasa o no pasa—, sin interpretación del investigador. La validación del objetivo 4 se considera cumplida solo si:

1. Toda consulta ejecutada con la identidad de una cuenta ajena devuelve **cero filas** de otra organización, en **todas** las tablas de negocio.
2. Toda operación del contrato sobre datos ajenos responde con el error de autorización especificado, sin revelar la existencia del recurso.
3. Ambas condiciones se mantienen con la verificación de la capa de aplicación deshabilitada.
4. La ejecución es reproducible desde una base vacía, con el esquema reconstruido desde las migraciones versionadas.

Un caso omitido por falta de entorno **no** se contabiliza como cumplido.

---

## 10. Matriz de consistencia

| Pregunta específica | Objetivo específico | Hipótesis · aspecto | Indicador | Instrumento | Entregable |
|---|---|---|---|---|---|
| ¿Qué estrategias documenta la literatura y qué carencias presenta la oferta boliviana? | 1 · Analizar | Existe un vacío no resuelto en multi-tenancy jerárquica | Fuentes revisadas por pares con limitación consignada · capacidades ausentes en la oferta relevada | Matriz de extracción · matriz comparativa de mercado | Estado del arte y análisis del mercado |
| ¿Qué modelo y qué políticas sostienen un único límite de aislamiento? | 2 · Diseñar y especificar | El límite de aislamiento debe situarse en la organización | Niveles modelados · límites de aislamiento · tablas con criterio único de política | Modelo entidad-relación · contrato de interfaz · migraciones | Modelo jerárquico y políticas especificadas |
| ¿Cómo se implementan identidad, jerarquía, roles y alcance por nivel? | 3 · Implementar y automatizar | La arquitectura es construible con medios de un desarrollador individual | Requisitos `Must` implementados · pipeline en verde por integración | Repositorio con control de versiones · integración continua | Sistema con corte vertical operativo |
| ¿Cómo se comprueba el aislamiento ante fallos de la aplicación y cómo se comprueba que el cambio de contexto es usable? | 4 · Validar | La separación se sostiene aunque la aplicación omita sus controles (la usabilidad se reporta como evidencia complementaria, fuera de la hipótesis) | **Filas ajenas devueltas = 0** · casos de aislamiento en verde sin la capa de aplicación · tasa de éxito por tarea ≥ 80 % · SUS ≥ 68 | Suite automatizada · informe de ejecución · guion de tareas T1–T3 y cuestionario SUS | Evidencia reproducible de aislamiento · informe de usabilidad |

---

## 11. Cronograma

Cuatro fases, ocho iteraciones de dos semanas. Cada fase materializa un objetivo específico.

| Fase | Período | Obj. | Resultado |
|---|---|---|---|
| **F1 · Análisis** | Septiembre, semanas 1–2 | 1 | Estado del arte con matriz de extracción, análisis del mercado y vacío de investigación |
| **F2 · Diseño** | Septiembre, semanas 3–4 | 2 | Marco teórico, modelo de datos jerárquico, políticas, contrato de interfaz y plan de pruebas |
| **F3 · Construcción** | 29 de septiembre – 7 de diciembre | 3 | Sistema funcional con el corte vertical e integración continua operativa |
| **F4 · Validación y cierre** | Diciembre | 4 | Evidencia de aislamiento, evaluación de usabilidad con operadores, documento final y defensa |

### Detalle por iteración

| Iteración | Fechas | Contenido |
|---|---|---|
| **I1** | 1–14 sep | Búsqueda en bases académicas, lectura de fuentes y relevamiento de la oferta boliviana |
| **I2** | 15–28 sep | Marco teórico, modelo jerárquico, políticas, contrato de interfaz y estrategia de verificación |
| **I3** | 29 sep – 12 oct | Esquema: identidad, organizaciones, talleres, membresías, políticas y contexto activo |
| **I4** | 13–26 oct | Cuentas, registro, gestión de organizaciones y de miembros con control de acceso por rol |
| **I5** | 27 oct – 9 nov | Módulo de clientes — entidad de nivel organización |
| **I6** | 10–23 nov | Módulo de inventario y movimientos de existencias — entidad de nivel taller |
| **I7** | 24 nov – 7 dic | Interfaz de usuario: autenticación, selectores de contexto, diseño responsivo e instalable |
| **I8** | 8–21 dic | Pruebas de aislamiento, evaluación de usabilidad con operadores (RNF-404), redacción final y preparación de la defensa |

*Reserva: del 22 al 31 de diciembre, margen para correcciones posteriores a la revisión del tutor.*

### Diagrama de Gantt

| Actividad | S1 | S2 | O1 | O2 | N1 | N2 | D1 | D2 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Revisión de literatura y del mercado | ██ | | | | | | | |
| Marco teórico y diseño de la arquitectura | | ██ | | | | | | |
| Esquema, políticas y contexto activo | | | ██ | | | | | |
| Identidad, organizaciones y miembros | | | | ██ | | | | |
| Módulo de clientes | | | | | ██ | | | |
| Módulo de inventario | | | | | | ██ | | |
| Interfaz de usuario | | | | | | | ██ | |
| Validación, redacción final y defensa | | | | | | | | ██ |

### Hitos

| Hito | Fecha objetivo | Criterio de cumplimiento |
|---|---|---|
| **H1 · Perfil y anteproyecto aprobados** | 28 de septiembre | Definición y alcance, estado del arte y marco teórico revisados por el tutor |
| **H2 · Jerarquía operativa** | 12 de octubre | Una organización gestiona varios talleres; el aislamiento sigue vigente |
| **H3 · Corte vertical completo** | 23 de noviembre | Clientes e inventario funcionando y probados |
| **H4 · Sistema integrado** | 7 de diciembre | Flujo completo desde el registro hasta la operación |
| **H5 · Validación concluida** | 21 de diciembre | Evidencia de aislamiento reproducible; evaluación de usabilidad ejecutada con al menos cinco operadores; documento final entregado |

---

## 12. Recursos y presupuesto

| Tipo | Detalle | Costo |
|---|---|---|
| Desarrollo | Equipo personal; editor y herramientas de código abierto | Sin costo adicional |
| Base de datos y autenticación | Proveedor gestionado, plan gratuito | Sin costo en el alcance del proyecto |
| Despliegue | Plataforma serverless, plan gratuito | Sin costo en el alcance del proyecto |
| Control de versiones e integración continua | Repositorio remoto y ejecución automatizada | Sin costo para repositorios personales |
| Fuentes académicas | Google Scholar, IEEE Xplore, ACM, Scopus, BASE, OATD | Acceso institucional |

El costo de infraestructura es **cero** dentro del alcance: los planes gratuitos cubren un entorno de desarrollo y demostración. Es coherente con el requisito de costo proporcional al uso, que a su vez responde a la barrera de costo identificada en el planteamiento del problema.

---

## 13. Riesgos y mitigación

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R1** | Las políticas de aislamiento resultan incorrectas o incompletas y permiten acceso cruzado | Media | **Alto** | Escribir las pruebas de aislamiento **antes** que la funcionalidad y ejecutarlas tras cada cambio de esquema o política |
| **R2** | El alcance crece más allá de lo planificado | **Alta** | Medio | Exclusiones cerradas y explícitas; corte vertical definido; congelar alcance en H3 |
| **R3** | Dependencia de proveedores externos: cambios de interfaz, límites de plan gratuito o indisponibilidad | Media | Medio | Aislar el acceso al proveedor tras una capa propia; el aislamiento reside en el motor, no en el proveedor |
| **R4** | Las políticas se complican al añadir el segundo nivel | Media | Medio | Un solo criterio de aislamiento en todas las tablas, incluidas las de nivel taller |
| **R5** | Tiempo insuficiente por carga laboral o académica paralela | Media | Medio | Iteraciones cortas con entregable demostrable; reserva de diez días en diciembre |
| **R6** | Fuentes académicas insuficientes sobre el tema en los últimos cinco años | Media | Bajo | Ampliar a arquitecturas comparables de otros rubros; admitir tesis de maestría; documentar la escasez como hallazgo |
| **R7** | Pérdida de trabajo por fallo de equipo | Baja | Alto | Control de versiones con repositorio remoto e integración frecuente |
| **R8** | No conseguir operadores disponibles para la evaluación de usabilidad en la ventana de I8, o que se retiren tras aceptar | **Alta** | Medio | Contactar y confirmar a los participantes durante I6, no en I8; sobre-reclutar a 8 para asegurar 5 efectivos; permitir sesiones remotas |

---

## 14. Resultados esperados

1. **Estado del arte** con matriz de extracción de literatura revisada por pares y el vacío de investigación formulado.
2. **Análisis del mercado boliviano** con las capacidades desatendidas por la oferta existente.
3. **Modelo de datos jerárquico** con el alcance de cada entidad por nivel y las restricciones de integridad derivadas.
4. **Especificación de las políticas de aislamiento** y del contrato de la interfaz de programación.
5. **Sistema funcional** con identidad, jerarquía organizacional, control de acceso por rol y el corte vertical de clientes e inventario.
6. **Pipeline de integración continua** que verifica tipos y ejecuta la suite en cada integración.
7. **Evidencia reproducible de aislamiento** por dos vías independientes, con su matriz de trazabilidad.
8. **Informe de evaluación de usabilidad** del cambio de contexto, con tasa de éxito por tarea, puntuación SUS y lista de problemas detectados.
9. **Documento final** de proyecto de grado y defensa.

---

## 15. Bibliografía preliminar

Estilo APA, 7.ª edición. Todos los identificadores permanentes —DOI e ISBN— fueron verificados contra el registro del editor.

Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. https://doi.org/10.3390/iot7010021

Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. https://repository.utm.md/handle/5014/35481

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human–Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional.

Beck, K. (2002). *Test-driven development: By example*. Addison-Wesley Professional.

Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution and International Workshop on Principles of Software Evolution* (pp. 88–92). ACM. https://doi.org/10.1145/1862372.1862393

Brooke, J. (1996). SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.

Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. https://doi.org/10.1145/362384.362685

Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. https://doi.org/10.1145/3588943

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine].

Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press.

Gao, Z., Bird, C., & Barr, E. T. (2017). To type or not to type: Quantifying detectable bugs in JavaScript. En *2017 IEEE/ACM 39th International Conference on Software Engineering* (pp. 758–769). IEEE. https://doi.org/10.1109/ICSE.2017.75

Gilbert, S., & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News, 33*(2), 51–59. https://doi.org/10.1145/564585.564601

Haerder, T., & Reuter, A. (1983). Principles of transaction-oriented database recovery. *ACM Computing Surveys, 15*(4), 287–317. https://doi.org/10.1145/289.291

Hernández-Sampieri, R., & Mendoza Torres, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education.

Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional.

Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del Registro Único para la Administración Tributaria Municipal. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. https://arxiv.org/abs/1902.03383

Krasner, G. E., & Pope, S. T. (1988). A cookbook for using the model-view-controller user interface paradigm in Smalltalk-80. *Journal of Object-Oriented Programming, 1*(3), 26–49.

Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science* (pp. 426–431). SciTePress. https://doi.org/10.5220/0003957604260431

Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. https://doi.org/10.1109/MC.2003.1204375

Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann.

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

Pierce, B. C. (2002). *Types and programming languages*. MIT Press.

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft del 13 de agosto de 2026). https://www.w3.org/TR/appmanifest/
---

<div align="center">

La Paz, ____ de ______________ de 2026

<br><br>

_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________

Daniel Mauricio Tarqui Apaza &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; _______________________

Postulante &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tutor

</div>
