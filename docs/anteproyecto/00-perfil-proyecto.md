<div align="center">

**UNIVERSIDAD CATÓLICA BOLIVIANA "SAN PABLO"**

**DIRECCIÓN DE POSTGRADO**

**MAESTRÍA EN FULL STACK DEVELOPMENT**

---

## PERFIL DE PROYECTO DE GRADO

### Diseño y validación de una arquitectura multi-tenant jerárquica con RLS para aislamiento verificable e inmutable en mantenimiento mecánico

---

**Postulante:** Daniel Mauricio Tarqui Apaza

**Tutor / Asesor:** Juan Perez

**Unidad Académica:** La Paz

**Modalidad de graduación:** Proyecto de Grado

La Paz – Bolivia
2026

</div>

---

## Resumen

El software de gestión de talleres disponible en Bolivia asume un taller por cuenta y resuelve la separación entre clientes en la capa de aplicación, de modo que un error de programación puede exponer los datos de una organización a otra. Este proyecto propone **diseñar, desarrollar y validar una arquitectura multi-tenant jerárquica** —una cuenta administra varias organizaciones y cada organización varios talleres— cuyo aislamiento se impone en el **motor de base de datos con Row Level Security (RLS)** y se refuerza con verificación de membresía en la capa de aplicación, sobre infraestructura serverless. La investigación es **aplicada**, de enfoque **cuantitativo** y diseño **cuasiexperimental**, y adopta *Design Science Research*: el artefacto se contrasta con una **línea base** en la que el aislamiento se resuelve solo en la aplicación. Se mide el número de **filas ajenas devueltas** en las siete tablas de negocio bajo cuatro condiciones experimentales, entre ellas la omisión deliberada de los controles de la aplicación. Dos objetivos complementarios, la usabilidad del cambio de contexto y el costo operativo por organización, se evalúan con un criterio de continuidad que permite descartarlos sin afectar la hipótesis central.

**Palabras clave:** multi-tenancy jerárquica; Row Level Security; aislamiento de datos; software como servicio; PostgreSQL; arquitectura serverless.

---

## Índice

1. Datos generales · 2. Antecedentes · 3. Planteamiento del problema · 4. Objetivos · 5. Hipótesis y variables · 6. Justificación · 7. Propuesta, alcance y exclusiones · 8. Marco teórico y conceptual · 9. Diseño metodológico · 10. Matriz de consistencia · 11. Cronograma · 12. Recursos, presupuesto y viabilidad · 13. Riesgos y mitigación · 14. Resultados esperados · 15. Bibliografía preliminar

---

## 1. Datos generales

| Campo | Detalle |
|---|---|
| **Título** | Diseño y validación de una arquitectura multi-tenant jerárquica con RLS para aislamiento verificable e inmutable en mantenimiento mecánico |
| **Programa** | Maestría en Full Stack Development |
| **Línea de investigación** | Arquitectura de software y seguridad de datos en aplicaciones de software como servicio |
| **Modalidad** | Proyecto de Grado |
| **Área de conocimiento** | Ingeniería de software · Bases de datos · Computación en la nube |
| **Período de ejecución** | Septiembre a diciembre de 2026 (cuatro meses) |
| **Ámbito de aplicación** | Servicio de mantenimiento mecánico; validación sobre organizaciones de servicio de motocicletas en Bolivia |

---

## 2. Antecedentes

**El parque de motocicletas y la demanda de servicio.** La motocicleta es el vehículo más numeroso de Bolivia. Según el Instituto Nacional de Estadística (INE), a partir de los registros del Registro Único para la Administración Tributaria Municipal (RUAT), en **2025** se contabilizaron **931.205 motocicletas**, el **34,8 %** del parque automotor nacional. Su crecimiento supera al del parque en conjunto: de **657.718 unidades en 2021** pasó a **872.550 en 2024** y a **931.205 en 2025**, **+41,6 % en cuatro años**, frente al +20,0 % del parque automotor total. Cada unidad requiere mantenimiento periódico, lo que sostiene una red amplia de talleres de servicio.

**Condiciones del sector.** Ese crecimiento ocurre en una economía marcadamente informal: el **empleo informal alcanzó el 86,8 % de la población ocupada en 2024** —6,0 de 6,9 millones de personas—, según el Cuadro 7 de UDAPE, elaborado con la Encuesta Continua de Empleo del INE. El indicador se emplea como caracterización cualitativa y no interviene en ningún cálculo del documento (capítulo 2, §2.1.1). Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y gestión apoyada todavía en papel u hojas de cálculo.

**Antecedentes tecnológicos.** La gestión de talleres pasó del software de escritorio por local al software como servicio de un solo inquilino por cuenta, que traslada el sistema a la nube pero conserva el supuesto de un taller por cuenta. Las arquitecturas multi-tenant ofrecen tres estrategias —base por inquilino, esquema por inquilino y esquema compartido—, y la última, la única compatible con un costo proporcional al uso, dispersa la condición de inquilino por el código de la aplicación salvo que se traslade al motor mediante políticas de seguridad a nivel de fila.

**Antecedentes científicos.** La literatura reciente sobre aislamiento entre inquilinos en esquemas compartidos —Dar, Hershcovitch y Morrison (2023), Alobaywi et al. (2026), Andriianenko (2026) y Olabanji et al. (2023)— aborda el problema en modelos de inquilino **plano y de un solo nivel**. Otros trabajos lo resuelven en capas distintas de las filas de una base compartida —la aplicación (Leburu, 2026), la criptografía (Zhu et al., 2024), la detección de intrusiones (Yassin et al., 2022) o la máquina virtual (Zhang et al., 2021)—, o evalúan bases de datos multi-inquilino sin medir el aislamiento (Yin et al., 2025). Simić et al. (2024) sí modelan una jerarquía, pero su aislamiento opera sobre **recursos de infraestructura** y no sobre las filas de una base relacional compartida. A ello se suma la evidencia de que la aplicación de políticas de seguridad a nivel de fila ha fallado de forma recurrente en producción (CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976).

---

## 3. Planteamiento del problema

### 3.1 Árbol de problemas

| Nivel | Contenido |
|---|---|
| **Efectos** | Historial del cliente fragmentado entre talleres · fuga de datos entre organizaciones ante un solo error de consulta · gestión en hojas de cálculo o cuentas separadas por local · barrera de costo de entrada |
| **Problema central** | Los operadores que gestionan **varias organizaciones y talleres de servicio de mantenimiento mecánico** no disponen de un sistema que centralice su información sin exponerla a otras organizaciones |
| **Causas raíz** | (1) Arquitectura de un solo inquilino: un taller por cuenta en la oferta relevada (AutoSoft Taller, ServitechApp, TuneraTaller, Appli-Car, Garage App) · (2) aislamiento resuelto solo en el código de la aplicación · (3) ausencia de un modelo jerárquico que distinga el alcance de cada entidad · (4) infraestructura con costo fijo por instalación |

### 3.2 Delimitación

| Dimensión | Delimitación |
|---|---|
| **Temática / tecnológica** | Capa de identidad, jerarquía organizacional y aislamiento de datos: TypeScript en servidor (Node.js, Hono, Zod) y cliente (React), PostgreSQL con seguridad a nivel de fila sobre Supabase, funciones serverless en Vercel |
| **Contextual** | Organizaciones de servicio y reparación de motocicletas en Bolivia con operadores que administran más de una organización y/o más de un taller |
| **Temporal** | Septiembre a diciembre de 2026; recolección de métricas de validación del 8 al 21 de diciembre de 2026 |
| **Límites y exclusiones** | Enumerados en §7.4 |

### 3.3 Formulación del problema

> **¿De qué manera una arquitectura multi-tenant jerárquica con Row Level Security (RLS) sobre infraestructura serverless sostiene un aislamiento verificable e inmutable —cero filas ajenas devueltas aun cuando la capa de aplicación omite sus controles—, frente al aislamiento resuelto solo en la aplicación, en la gestión centralizada de varias organizaciones y talleres de servicio de mantenimiento mecánico en Bolivia?**

### 3.4 Sistematización del problema

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué limitaciones, y qué carencias presentan las soluciones de gestión de talleres disponibles en Bolivia frente al modelo multiorganización?
2. ¿Qué modelo de datos, qué políticas de seguridad a nivel de fila y qué contrato de interfaz permiten representar la jerarquía organización → talleres sosteniendo un único límite de aislamiento?
3. ¿Cómo se construye el corte vertical del sistema sobre infraestructura serverless de modo que conserve el diseño de aislamiento y quede verificado en cada integración?
4. ¿En qué medida la arquitectura propuesta reduce las filas ajenas devueltas frente a la línea base de aislamiento solo en la aplicación, y se sostiene esa reducción con la verificación de membresía deshabilitada?
5. ¿Resulta el cambio de contexto entre organizaciones y talleres más eficiente y satisfactorio para el operador que el cambio de cuenta que exige el software de un solo inquilino? *(complementaria)*
6. ¿Cuál es el costo operativo mensual por organización del despliegue serverless frente a un despliegue en servidor dedicado? *(complementaria)*

---

## 4. Objetivos

### 4.1 Objetivo general

> **Diseñar, desarrollar y validar una arquitectura multi-tenant jerárquica con Row Level Security (RLS) sobre infraestructura serverless que sostenga un aislamiento verificable e inmutable —cero filas ajenas devueltas aun cuando la capa de aplicación omita sus controles—, para que los operadores de varias organizaciones y talleres de servicio de mantenimiento mecánico gestionen su información de forma centralizada.**

### 4.2 Objetivos específicos núcleo

| # | Objetivo específico | Entregable verificable |
|---|---|---|
| 1 | **Diagnosticar** las estrategias de aislamiento multi-tenant documentadas en la literatura y las capacidades de las soluciones de gestión de talleres con presencia en Bolivia, para identificar el vacío que justifica el proyecto y fijar como línea base el aislamiento resuelto solo en la capa de aplicación | Matriz del estado del arte · análisis del mercado · enunciado del vacío · definición operativa de la línea base |
| 2 | **Diseñar** el modelo de datos de la jerarquía organización → talleres, las políticas de seguridad a nivel de fila y el contrato de la interfaz de programación que sostienen un único límite de aislamiento entre organizaciones | Especificación de requerimientos · modelo entidad-relación · políticas · diagramas C4 · contrato de la interfaz |
| 3 | **Desarrollar** el corte vertical del sistema —identidad, organizaciones, talleres, miembros, clientes e inventario— sobre el diseño del objetivo 2, con integración continua | Sistema en *staging* · pipeline en verde · cobertura ≥ 80 % en servicios de dominio |
| 4 | **Validar** el aislamiento mediante pruebas automatizadas por la interfaz de programación y por acceso directo a la base de datos, contrastando la arquitectura propuesta con la línea base y comprobando que la separación se sostiene con la verificación de membresía deshabilitada | Suite de aislamiento con matriz requisito → caso → evidencia · resultados de C0 a C3 en tres corridas |

### 4.3 Objetivos específicos complementarios — evaluables y descartables

| # | Objetivo específico | Criterio de continuidad | Decisión |
|---|---|---|---|
| 5 | **Evaluar** con operadores del rubro la usabilidad del cambio de contexto entre organizaciones y talleres, frente al cambio de cuenta que exige el software de un solo inquilino | Al menos 30 operadores confirmados | 23 de noviembre de 2026 |
| 6 | **Evaluar** el costo operativo mensual por organización del despliegue serverless frente a un despliegue en servidor dedicado | Métricas de consumo suficientes para imputar costo por organización | 7 de diciembre de 2026 |

Su descarte no afecta la hipótesis ni el cierre del proyecto.

---

## 5. Hipótesis y variables

**Hipótesis de investigación (H1)**

> **Si se implementa una arquitectura multi-tenant jerárquica con Row Level Security reforzada por verificación de membresía en la capa de aplicación en el sistema de gestión de talleres de mantenimiento mecánico, entonces las filas ajenas devueltas ante la omisión de los controles de la capa de aplicación se reducirán en un 100 % —a cero en las siete tablas de negocio— en comparación con el aislamiento resuelto solo en la capa de aplicación (línea base).**

**Hipótesis nula (H0)**

> La arquitectura propuesta no reduce a cero las filas ajenas devueltas frente a la línea base en al menos una de las siete tablas de negocio, o la reducción deja de sostenerse cuando se deshabilita la verificación de membresía de la capa de aplicación.

El criterio de decisión está fijado de antemano en §9.4.

| Tipo | Variable | Indicador | Instrumento / escala | Obj. |
|---|---|---|---|---|
| **Independiente** | Arquitectura de aislamiento | Condición C0 · C1 · C2 · C3 | Banco de pruebas / nominal | 4 |
| **Dependiente** | Aislamiento entre organizaciones | **Filas ajenas devueltas = 0** · autorización correcta en el 100 % de las operaciones · casos en verde sin la verificación de aplicación = 100 % | Suite automatizada / razón | 4 |
| **Dependiente** | Gestión centralizada | Entidades de nivel organización visibles desde cualquier taller = 100 % · reautenticaciones al cambiar de contexto = 0 | Pruebas de integración / razón | 4 |
| **Independiente** | Modelo de cambio de contexto | Selector · cambio de cuenta | Guion de tareas / nominal | 5 |
| **Dependiente** | Usabilidad del cambio de contexto | Éxito por tarea ≥ 80 % · tiempo (s) · SUS ≥ 68 con α > 0,8 | Observación y cuestionario SUS / razón e intervalo | 5 |
| **Independiente** | Modelo de despliegue | Serverless · servidor dedicado | Tarifas publicadas / nominal | 6 |
| **Dependiente** | Costo operativo | USD por organización al mes | Paneles de consumo / razón | 6 |
| **Interviniente** | Calidad del código | Cobertura ≥ 80 % · 0 errores de tipos · 0 vulnerabilidades críticas o altas | Pipeline de integración continua / razón | 3 |

---

## 6. Justificación

### 6.1 Técnica

Aporta una solución replicable a un problema conocido del software como servicio: sostener el aislamiento entre inquilinos en un esquema compartido sin depender de que cada consulta esté bien escrita, situando el control en el motor, reforzándolo con una verificación independiente en la aplicación y extendiéndolo a un inquilino jerárquico cuyas entidades no comparten el mismo alcance.

### 6.2 Económica / de negocio

El despliegue serverless, con escalado a cero y sin costo fijo por organización, reduce el costo de infraestructura a lo que se consume y cabe en la capa gratuita de sus proveedores (§12), condición para ofrecer software especializado a un sector con **86,8 %** de empleo informal (§2). Administrar varias organizaciones desde una sola cuenta elimina, además, la duplicación de cuentas y registros por local.

### 6.3 De conocimiento

Documenta un procedimiento reproducible para **verificar** el aislamiento multi-tenant frente a una línea base, por dos vías independientes, con una matriz que traza cada requisito hasta su evidencia; la suite queda disponible como referencia para evaluar otros sistemas de esquema compartido.

---

## 7. Propuesta, alcance y exclusiones

### 7.1 Propuesta de solución

Un sistema web multiorganización cuyo aislamiento se aplica **dos veces y de forma independiente** —políticas de seguridad a nivel de fila en el motor y verificación de membresía en la aplicación—, con el contexto activo declarado en cada petición, construido como **monolito modular desplegado en funciones serverless**. La innovación está en la integración: una jerarquía de dos niveles con un único límite de aislamiento y un procedimiento que demuestra, frente a una línea base, que la separación no puede desactivarse desde la aplicación.

### 7.2 Alcance funcional

- Registro que crea una cuenta, su primera organización y su primer taller, con el usuario como propietario.
- Organizaciones adicionales bajo la misma cuenta y talleres dentro de cada organización.
- Cambio de organización activa y selección de taller activo según membresía.
- Gestión de miembros —invitar, cambiar rol, remover—, reservada al propietario, y asignación operativa a talleres.
- **Corte vertical**: **Clientes** (nivel organización) e **Inventario de repuestos** (nivel taller).
- Registro de acciones críticas consultable por el propietario.
- Evaluación de usabilidad y medición de costo *(objetivos complementarios)*.

### 7.3 Alcance técnico

| Capa | Tecnologías | Entregable |
|---|---|---|
| Frontend | React · TypeScript · TanStack Query · manifiesto de aplicación web | Interfaz responsiva e instalable, con el contexto activo en la clave de cada consulta |
| Backend | Node.js · Hono · Zod | Interfaz REST conforme al contrato, con descripción OpenAPI |
| Persistencia e identidad | PostgreSQL con seguridad a nivel de fila · Supabase Auth | Políticas activas en las 7 tablas de negocio |
| DevOps y nube | GitHub Actions · Vercel · Supabase | Pipeline con tipos, pruebas, cobertura y auditoría de dependencias; publicación en *staging* y producción |
| Verificación | Vitest · Playwright | Suite multinivel y evidencia de aislamiento reproducible |

### 7.4 Exclusiones

- Los módulos operativos fuera del corte vertical: motocicletas, órdenes de trabajo, historial de mantenimiento y panel de métricas.
- La auditoría extendida a la totalidad de las entidades de negocio.
- La integración con WhatsApp y la factura electrónica del Servicio de Impuestos Nacionales.
- Aplicaciones móviles o de escritorio nativas.
- Migración de datos productivos.
- Pruebas de carga, estrés o rendimiento a escala productiva: el dominio no las justifica.
- Contenedores, infraestructura como código y pruebas de penetración.
- La evaluación de usabilidad de la **totalidad** de la interfaz.

---

## 8. Marco teórico y conceptual — síntesis

| Bloque | Teorías y modelos | Qué decisión del proyecto fundamentan |
|---|---|---|
| **Arquitectura** | Estilo REST y ausencia de estado (Fielding, 2000) · atributos de calidad (Bass et al., 2021) · modelos de multi-tenancy (Krebs et al., 2012; Bezemer & Zaidman, 2010) · computación serverless (Jonas et al., 2019) · modelo C4 (Brown, s. f.) | Contexto activo por petición · aislamiento como atributo rector · esquema compartido reforzado en el motor · despliegue sin costo fijo · documentación de contenedores y componentes |
| **Persistencia** | Modelo relacional (Codd, 1970) · ACID (Haerder & Reuter, 1983) · teorema CAP (Gilbert & Lynch, 2002) · sistemas de tipos (Pierce, 2002; Gao et al., 2017) | Reglas de acceso como condiciones sobre relaciones · atomicidad · motor relacional único · verificación estática como primera barrera |
| **Frontend y uso** | Componentes (Krasner & Pope, 1988) · umbrales de percepción (Nielsen, 1993) · manifiesto de aplicación web (World Wide Web Consortium [W3C], 2026) · detección de problemas de uso (Nielsen & Landauer, 1993) · escala SUS (Brooke, 1996; Bangor et al., 2008) · consistencia interna (Cronbach, 1951) | Contexto activo en un componente contenedor · aplicación instalable · 30 participantes para el contraste inferencial, SUS ≥ 68 y α > 0,8 |
| **Seguridad** | Principios de protección (Saltzer & Schroeder, 1975) · RBAC (Sandhu et al., 1996) · confianza cero (Rose et al., 2020) · defensa en profundidad | Mediación completa en el motor · rol por organización · verificación en cada petición · aislamiento en dos capas |
| **Investigación y desarrollo** | Design Science Research (Hevner et al., 2004) · desarrollo iterativo (Larman & Basili, 2003) · integración continua (Humble & Farley, 2010; Forsgren et al., 2018) · pruebas como especificación (Beck, 2002) | El artefacto como resultado evaluado · iteraciones de dos semanas · pipeline en cada integración · pruebas de aislamiento antes que la funcionalidad |

**Revisión crítica.** La computación serverless arrastra arranque en frío y dependencia del proveedor; la seguridad a nivel de fila filtra información por el tiempo de ejecución de la consulta (Dar et al., 2023); el esquema compartido dispersa la conciencia de inquilino; la confianza cero completa supone una infraestructura inexistente en una pequeña organización; y cinco participantes detectan problemas de uso pero no sostienen inferencia. En cada caso **se retiene el principio y se descarta la implantación** cuando esta excede los medios disponibles.

---

## 9. Diseño metodológico

### 9.1 Tipo, enfoque, alcance, método y diseño

Las categorías siguen la clasificación de Hernández-Sampieri y Mendoza (2018).

| Dimensión | Definición adoptada |
|---|---|
| **Tipo** | **Aplicada / tecnológica**: resuelve un problema concreto mediante un artefacto de software evaluado |
| **Enfoque** | **Cuantitativo-aplicado**, conducido como **Design Science Research** (Hevner et al., 2004) |
| **Alcance** | Descriptivo en el diagnóstico, propositivo en el diseño y el desarrollo, explicativo en la validación |
| **Método** | **Hipotético-deductivo** |
| **Diseño** | **Cuasiexperimental con línea base, sobre caso único**: C0 (aislamiento solo en la aplicación) frente a C1 (arquitectura completa), C2 (sin verificación de aplicación) y C3 (acceso directo al motor). En el objetivo 5, intrasujeto contrabalanceado: selector de contexto frente a cambio de cuenta |

### 9.2 Población y muestra

| # | Población | Muestra | Muestreo |
|---|---|---|---|
| **a** | Publicaciones revisadas por pares sobre aislamiento entre inquilinos, 2021–2026 *(obj. 1)* | **10 fuentes** | No probabilístico por criterio |
| **b** | Plataformas de gestión de talleres con presencia en Bolivia *(obj. 1)* | **10 plataformas** | No probabilístico intencional |
| **c** | Tablas de negocio y operaciones de la interfaz del sistema a construir *(obj. 2 y 4)* | **Censo**: 7 tablas y todas las operaciones × 4 condiciones × 3 corridas, sobre 3 cuentas, 3 organizaciones y 3 talleres sintéticos | Intencional por caso crítico; no cabe muestreo probabilístico |
| **d** | Operadores de organizaciones de servicio de motocicletas en Bolivia con más de una organización y/o taller *(obj. 5)* | **30 participantes**, con sobre-reclutamiento de 36 | No probabilístico intencional por perfil |
| **e** | Consumo de los entornos desplegados durante I8 *(obj. 6)* | **Censo de 14 días**, una lectura diaria | No aplica |

### 9.3 Técnicas e instrumentos

La configuración detallada de cada instrumento está en el [anteproyecto](04-anteproyecto-integrado.md) §17.

| Obj. | Técnica | Instrumento | Frecuencia | Producto |
|---|---|---|---|---|
| 1 | Revisión sistemática de literatura | Cadena booleana y matriz autor · metodología · aporte · limitaciones | Una revisión con lectura título → resumen → conclusiones | Estado del arte y vacío |
| 1 | Análisis documental del mercado | Matriz comparativa de capacidades | 10 plataformas | Análisis del mercado |
| 2 | Modelado de datos y de arquitectura | Diagrama entidad-relación · C4 · especificación de políticas | Una especificación, revisada en H1 | Diseño y contrato |
| 3 | Desarrollo iterativo con integración continua | Vitest con cobertura · verificador de tipos · auditoría de dependencias · Playwright | En cada integración | Sistema en *staging* |
| 4 | Experimentación controlada por dos vías | Vitest con cliente HTTP y cliente PostgreSQL con identidad ajena | 7 tablas × 4 condiciones × 3 corridas | Evidencia de aislamiento |
| 5 | Observación estructurada y encuesta | Guion T1–T3 · cronómetro · cuestionario SUS | 30 participantes × 3 tareas × 2 condiciones | Informe de usabilidad |
| 6 | Telemetría del proveedor | Paneles de consumo y tarifas publicadas | Lectura diaria durante 14 días | Costo por organización |

### 9.4 Procesamiento y análisis

**Criterio de decisión de la hipótesis.** La H0 se rechaza solo si, en las **tres** corridas: (1) bajo C0 la línea base devuelve filas ajenas —si no fuga, el resultado se declara **no concluyente**—; (2) bajo C1, C2 y C3 se devuelven **cero filas ajenas** en las siete tablas; y (3) bajo C1 el **100 %** de las operaciones sobre datos ajenos responde con el error especificado. Un caso omitido por falta de entorno **no** se contabiliza como cumplido.

**Tratamiento de los datos.** El aislamiento se analiza por **censo y criterio binario**: no se aplica estadística inferencial a resultados deterministas de un censo. La usabilidad se analiza con **estadística descriptiva** —éxito por tarea, media, mediana y percentil 90 de tiempos, SUS— e **inferencial**: *t* de Student pareada para los tiempos entre condiciones (Wilcoxon si la prueba de Shapiro-Wilk rechaza la normalidad) y *t* de una muestra de SUS contra 68, con p < 0,05. El costo se analiza de forma descriptiva. Herramientas: hoja de cálculo y R.

### 9.5 Validez y confiabilidad

| Principio | Cómo lo satisface este proyecto |
|---|---|
| **Validez interna** | Entorno dedicado y reconstruido en cada ciclo; una condición por vez; contrabalanceo en el objetivo 5 |
| **Validez externa** | Limitada a un entorno de capa gratuita, tres inquilinos y operadores del servicio de motocicletas en Bolivia |
| **Validez de contenido** | Censo de las 7 tablas y de todas las operaciones |
| **Confiabilidad** | Recolección automatizada y tres corridas (*test–retest*); α de Cronbach > 0,8 en el SUS (Cronbach, 1951) |

### 9.6 Consideraciones éticas

- **Privacidad por diseño.** Ningún dato productivo, real o personal en la validación técnica: el escenario es sintético y se descarta con el entorno, en coherencia con el derecho a la privacidad reconocido en la Constitución Política del Estado (Estado Plurinacional de Bolivia, 2009, art. 21, num. 2).
- **Entornos.** Las pruebas no se ejecutan contra entornos productivos; la línea base C0, con políticas deshabilitadas, solo existe en el proyecto de validación desechable (§7.4).
- **Personas.** Consentimiento informado con derecho a retirarse, resultados anonimizados como P01…P30, confidencialidad de las organizaciones y declaración de que se evalúa el sistema, no a la persona.
- **Licencias y dependencias.** Componentes de código abierto con sus avisos; trabajo propio bajo licencia MIT; 0 vulnerabilidades críticas o altas en dependencias; riesgos del OWASP Top 10 aplicables atendidos en la especificación.
- **Integridad.** No se depuran casos fallidos de la evidencia; un objetivo complementario descartado se declara con su criterio y su fecha.

---

## 10. Matriz de consistencia

| Problema | Objetivo | Hipótesis | Variables | Metodología / Métrica |
|---|---|---|---|---|
| **General:** ¿De qué manera una arquitectura multi-tenant jerárquica con Row Level Security (RLS) sobre infraestructura serverless sostiene un aislamiento verificable e inmutable —cero filas ajenas devueltas aun cuando la capa de aplicación omite sus controles—, frente al aislamiento resuelto solo en la aplicación, en la gestión centralizada de varias organizaciones y talleres de servicio de mantenimiento mecánico en Bolivia? | Diseñar, desarrollar y validar una arquitectura multi-tenant jerárquica con Row Level Security (RLS) sobre infraestructura serverless que sostenga un aislamiento verificable e inmutable —cero filas ajenas devueltas aun cuando la capa de aplicación omita sus controles—, para que los operadores de varias organizaciones y talleres de servicio de mantenimiento mecánico gestionen su información de forma centralizada. | H1: reducción del 100 % de las filas ajenas frente a la línea base | VI: arquitectura de aislamiento · VD: aislamiento, gestión centralizada | Design Science Research, cuasiexperimental con línea base / filas ajenas devueltas |
| **Esp. 1:** ¿Qué estrategias documenta la literatura y qué carencias presenta la oferta boliviana? | Diagnosticar y fijar la línea base | — | — | Revisión sistemática y análisis documental / 10 fuentes con limitación · capacidades ausentes |
| **Esp. 2:** ¿Qué modelo, políticas y contrato sostienen un único límite de aislamiento? | Diseñar el modelo, las políticas y el contrato | — | VI especificada | Modelado y C4 / 2 niveles · 1 límite · 7 de 7 tablas con criterio único |
| **Esp. 3:** ¿Cómo se construye el corte vertical verificado en cada integración? | Desarrollar el corte vertical | — | Interviniente: calidad del código | Desarrollo iterativo / cobertura ≥ 80 % · 0 errores de tipos · 0 vulnerabilidades |
| **Esp. 4:** ¿En qué medida se reducen las filas ajenas frente a la línea base, también sin la verificación de membresía? | Validar frente a la línea base | H1 · criterio §9.4 | VI: C0–C3 · VD: aislamiento | Cuasiexperimental, censo, 3 corridas / 0 filas ajenas · 100 % autorización correcta |
| **Esp. 5:** ¿Es el cambio de contexto más eficiente y satisfactorio que el cambio de cuenta? | Evaluar la usabilidad *(complementario)* | Contraste de tiempos y SUS | VI: modelo de cambio de contexto · VD: usabilidad | Intrasujeto, n = 30 / éxito ≥ 80 % · SUS ≥ 68 · t pareada p < 0,05 |
| **Esp. 6:** ¿Cuál es el costo mensual por organización frente a un servidor dedicado? | Evaluar el costo *(complementario)* | — | VI: modelo de despliegue · VD: costo | Telemetría durante I8 / USD por organización al mes |

---

## 11. Cronograma

Cuatro fases —una por objetivo núcleo— y ocho iteraciones de dos semanas.

| Fase | Período | Obj. | Resultado |
|---|---|---|---|
| **F1 · Diagnóstico** | 1–14 de septiembre | 1 | Estado del arte, análisis del mercado, vacío y línea base |
| **F2 · Diseño** | 15–28 de septiembre | 2 | Requerimientos, modelo de datos, políticas, contrato, C4 y plan de pruebas |
| **F3 · Desarrollo** | 29 de septiembre – 7 de diciembre | 3 | Corte vertical en *staging* con pipeline en verde |
| **F4 · Validación y cierre** | 8–21 de diciembre | 4, 5 y 6 | Evidencia C0–C3, evaluaciones complementarias, documento final y defensa |

| Iteración | Fechas | Contenido |
|---|---|---|
| **I1** | 1–14 sep | Revisión sistemática, relevamiento del mercado, vacío y línea base |
| **I2** | 15–28 sep | Requerimientos, modelo de datos, políticas, contrato, C4 y estrategia de verificación |
| **I3** | 29 sep – 12 oct | Esquema, políticas, autenticación y contexto activo |
| **I4** | 13–26 oct | Organizaciones, talleres y miembros con control de acceso por rol |
| **I5** | 27 oct – 9 nov | Clientes — nivel organización |
| **I6** | 10–23 nov | Inventario — nivel taller · reclutamiento de operadores |
| **I7** | 24 nov – 7 dic | Cliente web, pruebas extremo a extremo y publicación |
| **I8** | 8–21 dic | Validación C0–C3, sesiones con operadores, medición de costo, redacción final y defensa |

*Reserva: del 22 al 31 de diciembre.*

| Actividad | S1 | S2 | O1 | O2 | N1 | N2 | D1 | D2 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Diagnóstico | ██ | | | | | | | |
| Diseño | | ██ | | | | | | |
| Esquema, políticas y autenticación | | | ██ | | | | | |
| Organizaciones, talleres y miembros | | | | ██ | | | | |
| Clientes | | | | | ██ | | | |
| Inventario y reclutamiento | | | | | | ██ | | |
| Cliente web y publicación | | | | | | | ██ | |
| Validación y cierre | | | | | | | | ██ |

| Hito | Fecha | Criterio de cumplimiento |
|---|---|---|
| **H1 · Diagnóstico y diseño aprobados** | 28 de septiembre | Perfil y anteproyecto revisados por el tutor |
| **H2 · Arquitectura base** | 12 de octubre | Esquema, políticas, autenticación y contexto activo operativos |
| **H3 · Corte vertical completo** | 23 de noviembre | Clientes e inventario probados · decisión sobre el objetivo 5 |
| **H4 · Sistema integrado** | 7 de diciembre | Cliente web en *staging* · decisión sobre el objetivo 6 |
| **H5 · Validación concluida** | 21 de diciembre | C0–C3 en tres corridas; objetivos complementarios ejecutados o descartados; documento final |

> **Presentación del perfil: 16 de noviembre de 2026.** Cae dentro de I6 (10–23 de noviembre) y no desplaza ningún hito: H1 recoge la **revisión del tutor** y el cierre de la especificación, no la presentación formal ante la Dirección de Postgrado.

---

## 12. Recursos, presupuesto y viabilidad

Tarifas y límites consultados el **14 de septiembre de 2026** en las páginas de precios de Supabase, Vercel y GitHub.

| Recurso | Especificación | Costo mensual |
|---|---|---|
| Supabase, plan gratuito — *staging* y producción | 500 MB de base de datos, CPU compartida con 500 MB de RAM, 5 GB de transferencia, 50 000 usuarios activos mensuales; 2 proyectos activos | USD 0 |
| Supabase — proyecto de validación desechable | Ocupa el lugar de *staging* durante I8 | USD 0 |
| Vercel, plan gratuito | 1 millón de invocaciones y 100 GB de transferencia al mes; uso personal no comercial | USD 0 |
| GitHub Actions, plan gratuito | Ejecutores estándar: sin costo en repositorio público; 2000 minutos al mes en repositorio privado | USD 0 |
| Desarrollo y fuentes académicas | Equipo personal; acceso institucional | USD 0 |

**Presupuesto mensual de *staging* y producción: USD 0.** Contingencia si se exceden los límites o se requieren tres proyectos simultáneos: Supabase Pro (desde USD 25) y Vercel Pro (USD 20), con un techo previsto de **USD 45 al mes**.

**Restricciones y supuestos principales.** Capa gratuita con 2 proyectos activos y pausa tras una semana sin actividad (supuesto: *staging* puede pausarse en I8); plan gratuito de Vercel para uso no comercial (supuesto: el proyecto académico no es uso comercial); un solo desarrollador en 16 semanas (supuesto: dedicación sostenida, con 10 días de reserva).

| Viabilidad | Evaluación |
|---|---|
| **Técnica** | Componentes maduros y compatibles: seguridad a nivel de fila nativa, identidad del proveedor evaluable en las políticas y TypeScript de extremo a extremo |
| **Operativa** | Servicios gestionados sin servidores que operar; publicación automática tras el pipeline |
| **Temporal** | Ocho iteraciones con reserva de 10 días y dos objetivos complementarios descartables |
| **Económica** | USD 0 al mes en capa gratuita, con techo de contingencia de USD 45 |

---

## 13. Riesgos y mitigación

El registro completo, con plan de contingencia, está en el [Plan de trabajo](../ingenieria/08-plan-trabajo.md) §6.

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| **R1** | Las políticas de aislamiento resultan incorrectas o incompletas | Media | **Alto** | Pruebas de aislamiento escritas **antes** que la funcionalidad |
| **R2** | El alcance crece más allá de lo planificado | **Alta** | Medio | Exclusiones cerradas; alcance congelado en H3 |
| **R8** | No se consiguen 30 operadores o se retiran | **Alta** | Medio | Reclutar 36 durante I6; sesiones remotas; criterio de continuidad del objetivo 5 |
| **R3** | Cambios o límites de los proveedores externos | Media | Medio | Acceso tras una capa propia; aislamiento en el motor |
| **R9** | Se exceden los límites de la capa gratuita | Media | Medio | Pausar *staging* en I8; contingencia de plan Pro |
| **R4** | Las políticas se complican con el segundo nivel | Media | Medio | Un solo criterio de aislamiento en todas las tablas |
| **R5** | Tiempo insuficiente | Media | Medio | Reserva de 10 días; objetivos complementarios descartables |
| **R7** | Pérdida de trabajo por fallo de equipo | Baja | Alto | Repositorio remoto e integración frecuente |
| **R6** | Fuentes académicas insuficientes | Media | Bajo | Ampliar a arquitecturas comparables |
| **R10** | Métricas de consumo insuficientes | Media | Bajo | Criterio de continuidad del objetivo 6 |

---

## 14. Resultados esperados

| Resultado | Métrica |
|---|---|
| Estado del arte con matriz y vacío formulado | 10 fuentes con limitación consignada |
| Especificación, modelo jerárquico, políticas, C4 y contrato | 7 de 7 tablas con criterio único de política |
| Sistema con el corte vertical en *staging* y producción | 100 % de requisitos `Must` con caso en verde · cobertura ≥ 80 % |
| Evidencia reproducible de aislamiento | 0 filas ajenas bajo C1–C3 en 3 corridas, frente a filas ajenas en C0 |
| Informe de usabilidad *(si continúa el objetivo 5)* | Éxito por tarea · SUS con α de Cronbach · contraste de tiempos |
| Estimación de costo *(si continúa el objetivo 6)* | USD por organización al mes |
| Documento final y defensa | Revisión de consistencia sin rupturas |

---

## 15. Bibliografía preliminar

Estilo APA, 7.ª edición. El estado de verificación entrada por entrada consta en el [Anexo de verificación de referencias](anexo-referencias.md). Las obras con DOI o identificador permanente no llevan fecha de recuperación en APA 7, de modo que su **fecha de consulta** se registra en el anexo: **14 de septiembre de 2026** para Zhang et al. (2021), Yassin et al. (2022), Zhu et al. (2024), Yin et al. (2025), Leburu (2026), Cronbach (1951) y Hevner et al. (2004); **18 de agosto de 2026** para las demás.

Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. https://doi.org/10.3390/iot7010021

Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. https://repository.utm.md/handle/5014/35481

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human–Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional.

Beck, K. (2002). *Test-driven development: By example*. Addison-Wesley Professional.

Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution and International Workshop on Principles of Software Evolution* (pp. 88–92). ACM. https://doi.org/10.1145/1862372.1862393

Brooke, J. (1996). SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.

Brown, S. (s. f.). *The C4 model*. Recuperado el 14 de septiembre de 2026, de https://c4model.com/

Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. https://doi.org/10.1145/362384.362685

Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika, 16*(3), 297–334. https://doi.org/10.1007/BF02310555

Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. https://doi.org/10.1145/3588943

Estado Plurinacional de Bolivia. (2009). *Constitución Política del Estado* (promulgada el 7 de febrero de 2009). Recuperado el 14 de septiembre de 2026, de https://www.planificacion.gob.bo/uploads/marco-legal/nueva_constitucion_politica_del_estado.pdf

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine].

Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press.

Gao, Z., Bird, C., & Barr, E. T. (2017). To type or not to type: Quantifying detectable bugs in JavaScript. En *2017 IEEE/ACM 39th International Conference on Software Engineering* (pp. 758–769). IEEE. https://doi.org/10.1109/ICSE.2017.75

Gilbert, S., & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News, 33*(2), 51–59. https://doi.org/10.1145/564585.564601

Haerder, T., & Reuter, A. (1983). Principles of transaction-oriented database recovery. *ACM Computing Surveys, 15*(4), 287–317. https://doi.org/10.1145/289.291

Hernández-Sampieri, R., & Mendoza Torres, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly, 28*(1), 75–106. https://doi.org/10.2307/25148625

Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional.

Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del Registro Único para la Administración Tributaria Municipal. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. https://arxiv.org/abs/1902.03383

Krasner, G. E., & Pope, S. T. (1988). A cookbook for using the model-view-controller user interface paradigm in Smalltalk-80. *Journal of Object-Oriented Programming, 1*(3), 26–49.

Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science* (pp. 426–431). SciTePress. https://doi.org/10.5220/0003957604260431

Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. https://doi.org/10.1109/MC.2003.1204375

Leburu, N. (2026). Trust-aware orchestration architecture for LLM-assisted workflows in multi-tenant enterprise systems. *IEEE Access, 14*, 97094–97117. https://doi.org/10.1109/ACCESS.2026.3706063

Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann.

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

Pierce, B. C. (2002). *Types and programming languages*. MIT Press.

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft del 13 de agosto de 2026). https://www.w3.org/TR/appmanifest/

Sevilla-González, M. del R., Moreno Loaeza, L., Lazaro-Carrera, L. S., Bourguet Ramirez, B., Vázquez Rodríguez, A., Peralta-Pedrero, M. L., & Almeda-Valdes, P. (2020). Spanish version of the System Usability Scale for the assessment of electronic tools: Development and validation. *JMIR Human Factors, 7*(4), e21161. https://doi.org/10.2196/21161

Unidad de Análisis de Políticas Sociales y Económicas. (2025). *Análisis de la población ocupada, desocupada e inactiva en Bolivia entre los años 2015 y 2024*. UDAPE. https://www.udape.gob.bo/wp-content/uploads/2026/03/Analisis-de-la-condicion-actividad-2025.pdf

Yassin, M., Ould-Slimane, H., Talhi, C., & Boucheneb, H. (2022). Multi-tenant intrusion detection framework as a service for SaaS. *IEEE Transactions on Services Computing, 15*(5), 2925–2938. https://doi.org/10.1109/TSC.2021.3077852

Yin, S., Morvan, F., Martinez-Gil, J., & Hameurlain, A. (2025). MTD-DS: An SLA-aware decision support benchmark for multi-tenant parallel DBMSs. *IEEE Transactions on Knowledge and Data Engineering, 37*(5), 2743–2755. https://doi.org/10.1109/TKDE.2025.3543727

Zhang, Z., Yang, Z., Du, X., Li, W., Chen, X., & Sun, L. (2021). Tenant-led ciphertext information flow control for cloud virtual machines. *IEEE Access, 9*, 15156–15169. https://doi.org/10.1109/ACCESS.2021.3051061

Zhu, X., Shen, P., Dai, Y., Xu, L., & Hu, J. (2024). Privacy-preserving and trusted keyword search for multi-tenancy cloud. *IEEE Transactions on Information Forensics and Security, 19*, 4316–4330. https://doi.org/10.1109/TIFS.2024.3377549

---

<div align="center">

La Paz, 16 de noviembre de 2026

<br><br>

_______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_______________________________

Daniel Mauricio Tarqui Apaza &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Juan Perez

Postulante &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tutor

</div>
