<div align="center">

**UNIVERSIDAD CATÓLICA BOLIVIANA "SAN PABLO"**

**DIRECCIÓN DE POSTGRADO**

**MAESTRÍA EN FULL STACK DEVELOPMENT**

---

## ANTEPROYECTO

### Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para empresas de servicio de motocicletas en Bolivia

---

**Postulante:** Daniel Mauricio Tarqui Apaza

**Tutor / Asesor:** _________________________

**Unidad Académica:** La Paz

**Modalidad de graduación:** Proyecto de Grado

La Paz – Bolivia
2026

</div>

---

## 1. Título del proyecto

> **Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para empresas de servicio de motocicletas en Bolivia**

| Campo | Detalle |
|---|---|
| **Línea de investigación** | Arquitectura de software y seguridad de datos en aplicaciones de software como servicio |
| **Área de conocimiento** | Ingeniería de software · Bases de datos · Computación en la nube |
| **Período de ejecución** | Septiembre a diciembre de 2026 |
| **Ámbito de aplicación** | Empresas de servicio y reparación de motocicletas en Bolivia |

---

## 2. Planteamiento del problema

### 2.1 Situación problemática

**Síntoma.** Un operador que administra una o varias empresas de servicio de motocicletas, cada una con una o varias sucursales, no dispone en Bolivia de una plataforma que le permita gestionarlas desde una sola cuenta con visión consolidada. Hoy debe elegir entre dos malas opciones: llevar cada local como una cuenta independiente —perdiendo la vista unificada del cliente y su historial— o recurrir a hojas de cálculo y software genérico no especializado.

**Causa.** El software de gestión de talleres relevado con presencia en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller) y el regional (Appli-Car, Garage App) está construido sobre arquitecturas de **un solo inquilino** (*single-tenant*): asumen un taller por cuenta. No modelan ni la pertenencia de varias empresas a una misma cuenta, ni la de varias sucursales a una misma empresa. Cuando existe algún aislamiento entre clientes del sistema, se resuelve **únicamente en el código de la aplicación**: basta que una consulta omita el filtro correspondiente para que se produzca una fuga de datos, porque no hay ningún control por debajo que lo impida.

**Impacto.**

| Efecto | Consecuencia |
|---|---|
| Pérdida de la visión consolidada | El historial del cliente queda fragmentado entre sucursales de la misma empresa, que es justamente lo que se busca al centralizar |
| Riesgo de fuga de datos entre empresas | Al depender el aislamiento de que cada consulta esté correctamente escrita, un solo error de programación expone información de un cliente del sistema a otro |
| Barrera de costo | La infraestructura tradicional (servidor propio, despliegue manual) eleva el costo de entrada, factor crítico en un sector con alta informalidad y bajo presupuesto de tecnología |

### 2.2 Delimitación del problema

| Dimensión | Delimitación |
|---|---|
| **Espacial / organizacional** | Empresas de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una empresa y/o más de una sucursal |
| **Temporal** | Desarrollo y validación entre septiembre y diciembre de 2026 (cuatro meses) |
| **Técnica** | La capa de identidad, jerarquía organizacional y aislamiento de datos: cuentas, empresas, sucursales, membresías con rol, y las políticas de seguridad que las hacen cumplir en la base de datos. **No** abarca la totalidad de los módulos operativos |

### 2.3 Formulación del problema

> **¿De qué manera el diseño e implementación de una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento aplicado mediante seguridad a nivel de fila, mejora la gestión centralizada y la seguridad de los datos de operadores de varias empresas y sucursales de servicio de motocicletas en Bolivia?**

---

## 3. Preguntas de investigación

**Pregunta general.** La formulación del problema (§2.3) constituye la pregunta general del estudio.

**Preguntas específicas.** Una por cada objetivo específico, en el mismo orden:

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué ventajas y limitaciones, y qué carencias presentan frente al modelo multiempresa las soluciones de gestión de talleres disponibles en Bolivia? *(Análisis)*
2. ¿Qué modelo de datos y qué políticas de seguridad a nivel de fila permiten representar la jerarquía empresa → sucursales sin fragmentar la información del cliente y sosteniendo un único límite de aislamiento? *(Diseño)*
3. ¿Cómo se implementan la identidad, la jerarquía organizacional, el control de acceso por rol y el alcance diferenciado de datos sobre una plataforma serverless con verificación automatizada en cada integración? *(Implementación)*
4. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre empresas se cumple incluso ante fallos de la capa de aplicación, y que el cambio de contexto entre empresas y sucursales resulta usable para el operador? *(Validación)*

---

## 4. Justificación

### 4.1 Justificación teórica

El estado del arte aborda el aislamiento entre inquilinos en modelos **planos**, de un solo nivel. Este proyecto extiende el problema a una **multi-tenancy jerárquica**, donde el inquilino posee una subdivisión interna y las entidades no comparten el mismo alcance: unas siguen al cliente y pertenecen a la empresa, otras responden a la existencia física de un local y pertenecen a la sucursal. Sostener un aislamiento verificable bajo esa asimetría, con un único límite de seguridad, es el aporte que el proyecto disputa a la literatura revisada.

### 4.2 Justificación práctica

Ofrece a los operadores bolivianos de servicio de motocicletas una capacidad que hoy no existe en su mercado: administrar varias empresas desde una sola cuenta, con visión consolidada del cliente entre sucursales y con separación de datos demostrable. El relevamiento confirma que la gestión de varias empresas por cuenta está **ausente** en la oferta local, y que ninguna solución relevada documenta su aislamiento entre organizaciones.

### 4.3 Justificación metodológica

Aporta un procedimiento reproducible para **verificar** el aislamiento multi-tenant, no solo para afirmarlo: dos vías independientes de comprobación —por la interfaz de programación y por acceso directo al motor de base de datos— con un escenario de datos construido por la propia prueba y una matriz que traza cada requisito hasta su evidencia. El procedimiento es aplicable a cualquier sistema de esquema compartido, con independencia del rubro.

### 4.4 Justificación social y económica

El modelo de despliegue serverless, con escalado a cero y sin costo fijo por empresa, hace económicamente viable ofrecer software especializado a un sector con **84,2 % de informalidad laboral** y presupuesto de tecnología mínimo. La barrera de costo identificada en el planteamiento del problema es, en sí misma, una condición de diseño del proyecto.

---

## 5. Antecedentes

**El parque de motocicletas y la demanda de servicio.** La motocicleta es el vehículo más numeroso de Bolivia. Según el Instituto Nacional de Estadística (INE), a partir de los registros del Registro Único para la Administración Tributaria Municipal (RUAT), en 2024 se contabilizaron **872.550 motocicletas** sobre un parque automotor total de **2.583.319 vehículos**, encabezando el parque nacional por delante de vagonetas, automóviles y camionetas. Su crecimiento es sostenido y superior al del parque en conjunto: pasó de **657.718 unidades en 2021** a **800.890 en 2023** y a **872.550 en 2024**, un incremento cercano al **33 % en tres años**. Cada una de esas unidades requiere mantenimiento periódico y reparaciones, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio — una base de negocio que crece año a año y que, al hacerlo, empuja a los operadores más exitosos a abrir locales adicionales.

**Condiciones del sector que explican el problema.** Ese crecimiento ocurre, sin embargo, en una economía marcadamente informal: el INE reporta una **informalidad laboral del 84,2 % en 2024**, tendencia que se ha agravado de forma sostenida durante las últimas dos décadas. Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo. En ese contexto, el operador que crece —el que abre una segunda o tercera sucursal, o constituye más de una empresa— se encuentra sin herramientas que le permitan administrarlas de forma centralizada. Este es precisamente el escenario que el presente proyecto aborda.

**Fuentes de los antecedentes**

| Fuente | Tipo |
|---|---|
| INE — Parque Automotor, cuadros estadísticos (datos originados en el RUAT) | Primaria (oficial) |
| INE — Boletín Estadístico Parque Automotor 2023 | Primaria (oficial) |
| INE — Estadísticas del Parque Automotor 2003–2022 (serie histórica) | Primaria (oficial) |

---

## 6. Estado del arte

Construido únicamente con literatura revisada por pares publicada entre **2021 y 2026**, admitiendo tesis de maestría o doctorado en ciencias de la computación y trabajos con problemas arquitectónicos similares aunque el rubro sea distinto. Se excluyen soluciones sobre tecnologías legadas y artículos de opinión sin validación métrica. De cada fuente se consigna su **limitación**, que es donde se abre la oportunidad de este proyecto.

### 6.1 Matriz de extracción

| Referencia (Autor, Año) | Solución tecnológica (arquitectura) | Resultados clave | Vacío identificado (*Research Gap*) |
|---|---|---|---|
| **Dar, Hershcovitch & Morrison (2023)** · *Proc. ACM Management of Data* (SIGMOD), art. 89 · DOI 10.1145/3588943 | Seguridad a nivel de fila (RLS) sobre PostgreSQL y SQL Server, en instancias propias y gestionadas en AWS; proponen un esquema de consulta *data-oblivious* como defensa | RLS impide devolver datos no autorizados, **pero el tiempo de ejecución de la consulta filtra información**: mediante consultas que usan índices, un atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, cuántas veces existe | Modelo de inquilinos **plano y de un solo nivel**, en la capa de consulta. No abordan dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna |
| **Alobaywi, Almutairi & Sheldon (2026)** · *IoT* (MDPI), 7(1), art. 21 · DOI 10.3390/iot7010021 | Revisión sistemática guiada por PRISMA de marcos de seguridad para entornos multi-inquilino IoT–nube | Categorizan las amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos, canal lateral y escalamiento de privilegios** | Al ser una revisión, **no propone ni valida una arquitectura concreta**. Su contexto son dispositivos IoT, no SaaS de gestión empresarial con estructura jerárquica |
| **Andriianenko (2026)** · Tesis de maestría, Universitatea Tehnică a Moldovei | SaaS de gestión de proyectos con microservicios; diseña, implementa y evalúa **esquema compartido** frente a **base por inquilino** | El esquema compartido reduce recursos pero incrementa complejidad y riesgo de aislamiento; la base por inquilino separa mejor a costa de sobrecarga operativa | Evalúa ambos modelos como **alternativas planas y excluyentes**, sin considerar RLS como refuerzo *dentro* del esquema compartido ni una jerarquía de dos niveles |
| **Simić, Dedeić, Stojkov & Prokić (2024)** · *IEEE Access*, 12, pp. 32597–32617 · DOI 10.1109/ACCESS.2024.3369031 | Jerarquía de espacios de nombres sobre nube distribuida en el borde, para crear nubes virtuales con redistribución de CPU, RAM y almacenamiento | La jerarquía de *namespaces* sostiene aislamiento lógico entre inquilinos de distinto nivel, permitiendo que un nivel superior reorganice recursos del inferior | El aislamiento jerárquico es de **infraestructura física**, no de filas de una base relacional compartida. No hay políticas a nivel de fila ni reparto de entidades de negocio por nivel |
| **Olabanji, Fitch & Matthew (2023)** · *WSEAS Transactions on Computers*, 22, pp. 25–43 · DOI 10.37394/23205.2023.22.4 | Revisión de mapeo sistemático sobre multi-tenancy en arquitecturas *cloud-native*: 64 estudios revisados por pares seleccionados de 921 relevados | Documentan retos y tendencias de la multi-tenancy en contenedores y orquestación, confirmando que el aislamiento entre inquilinos es un problema abierto y activo | Cataloga el estado del conocimiento **sin proponer ni validar arquitectura propia**; su dominio es *cloud-native*, no la jerarquía organizacional de dos niveles |

### 6.2 Síntesis comparativa

| Criterio | Dar et al. (2023) | Alobaywi et al. (2026) | Andriianenko (2026) | Simić et al. (2024) | Olabanji et al. (2023) | **Este proyecto** |
|---|---|---|---|---|---|---|
| Tipo de trabajo | Experimental | Revisión sistemática | Tesis con implementación | Experimental | Revisión de mapeo | Tesis con implementación |
| Niveles de inquilino | Uno (plano) | Uno (plano) | Uno (plano) | Jerárquico (infraestructura) | Uno (plano) | **Dos (jerárquico, datos)** |
| Mecanismo de aislamiento | RLS | Varios marcos | Esquema compartido / base por inquilino | Espacios de nombres | Varios | **RLS + verificación en aplicación** |
| ¿Propone arquitectura? | No | No | Sí | Sí | No | Sí |
| ¿Valida empíricamente? | Sí | No | Sí | Sí | No | Sí |
| Dominio | Genérico | IoT–nube | SaaS gestión de proyectos | Nube distribuida | *Cloud-native* | **SaaS gestión de talleres (Bolivia)** |

### 6.3 Evidencia técnica complementaria

No constituye literatura académica —son registros oficiales de vulnerabilidad— pero aporta evidencia verificable de que la aplicación de políticas RLS ha fallado de forma **recurrente** en producción, lo que sustenta no depender de una única capa de aislamiento:

| Identificador | Año | Descripción |
|---|---|---|
| **CVE-2016-2193** | 2016 | Aplicación de política de seguridad de fila incorrecta ante reutilización de planes de consulta |
| **CVE-2023-2455** | 2023 | Nuevo caso del mismo tipo, no cubierto por la corrección anterior |
| **CVE-2024-10976** | 2024 | Seguimiento incompleto de tablas con seguridad de fila en PostgreSQL; aplicar una política incorrecta puede permitir lecturas y modificaciones prohibidas. CVSS 5.4, CWE-1250 |

### 6.4 Vacío de investigación

La solución de **Dar et al. (2023)** demuestra empíricamente que la seguridad a nivel de fila cumple su función como control de acceso; **sin embargo**, su análisis se limita a un modelo de inquilinos plano y se concentra en la capa de consulta, sin abordar la decisión arquitectónica previa: **dónde ubicar el límite de aislamiento cuando el inquilino posee una subdivisión interna** cuyas entidades no comparten el mismo alcance. **Alobaywi et al. (2026)** y **Olabanji et al. (2023)** sistematizan amenazas y tendencias, **pero**, al ser revisiones, identifican riesgos sin proponer ni validar una arquitectura aplicable a un SaaS de gestión empresarial. **Andriianenko (2026)** compara esquema compartido frente a base por inquilino, **no obstante** los evalúa como alternativas planas y excluyentes. **Simić et al. (2024)** sí modelan una jerarquía, **aunque** su aislamiento opera sobre recursos de infraestructura y no sobre filas de una base relacional compartida. A ello se suma que la serie de CVE evidencia que confiar en una sola capa de aislamiento resulta insuficiente en la práctica.

El presente proyecto aborda esta deficiencia mediante el **diseño, implementación y validación de una arquitectura multi-tenant jerárquica (empresa → sucursales)** que mantiene un **único límite de aislamiento verificable** a nivel de empresa, tratando la sucursal como criterio de alcance operativo y no como segunda frontera de seguridad; refuerza la seguridad a nivel de fila con **verificación de membresía en la capa de aplicación**; y **valida empíricamente la separación de datos** por dos vías independientes.

---

## 7. Marco teórico y conceptual

Conforme a la instrucción de que este punto no sea extenso y se amplíe en una fase posterior de la investigación, se presenta aquí la **estructura del marco teórico y conceptual**: las tecnologías y teorías cuya definición es obligatoria, y el orden en que se desarrollarán. Cada entrada indica entre paréntesis la fuente que la sustenta.

### 7.1 Marco conceptual — el «qué»

Definición formal de las tecnologías propias de esta solución. Se excluyen conceptos universales o básicos.

- 7.1.1 Node.js
- 7.1.2 TypeScript
- 7.1.3 API REST
- 7.1.4 JSON Web Token (JWT)
- 7.1.5 PostgreSQL
- 7.1.6 Row-Level Security (RLS)
- 7.1.7 Función serverless
- 7.1.8 Validación por esquema
- 7.1.9 Progressive Web App (PWA)
- 7.1.10 Problem Details

### 7.2 Marco teórico — el «por qué» y el «cómo»

Principios, teoremas, modelos y metodología que sustentan cada decisión de ingeniería.

**7.2.1 Teorías de arquitectura — el diseño global**
- Estilo arquitectónico REST y restricción de ausencia de estado (Fielding, 2000)
- Atributos de calidad y tácticas arquitectónicas (Bass et al., 2021)
- Modelos de multi-tenancy (Krebs et al., 2012; Bezemer & Zaidman, 2010)
- Computación serverless y escalado a cero (Jonas et al., 2019)

**7.2.2 Teorías de backend y persistencia — cómo se procesan y guardan los datos**
- Modelo relacional (Codd, 1970)
- Propiedades transaccionales ACID (Haerder & Reuter, 1983)
- Teorema CAP (Gilbert & Lynch, 2002)
- Sistemas de tipos como verificación estática (Pierce, 2002; Gao et al., 2017)

**7.2.3 Teorías de frontend — cómo interactúa el usuario**
- De la separación por responsabilidades a la composición por componentes (Krasner & Pope, 1988)
- Tiempos de respuesta y percepción (Nielsen, 1993)
- Manifiesto de aplicación web (W3C, 2026)

**7.2.4 Modelos de seguridad — cómo se protege la información**
- Principios de diseño de sistemas protegidos (Saltzer & Schroeder, 1975)
- Control de acceso basado en roles — RBAC (Sandhu et al., 1996)
- Arquitectura de confianza cero (Rose et al., 2020)
- Defensa en profundidad (Dar et al., 2023)

**7.2.5 Metodología de desarrollo — el proceso de trabajo**
- Desarrollo iterativo e incremental (Larman & Basili, 2003)
- Integración continua y entrega (Humble & Farley, 2010; Forsgren et al., 2018)
- Pruebas como especificación previa (Beck, 2002)
- Registro de decisiones de arquitectura (Richards & Ford, 2020)

### 7.3 Revisión crítica de la literatura

Por cada teoría: qué promete, qué limitación documentada tiene y qué adaptación exige el contexto de una pequeña empresa boliviana con un solo desarrollador.

### 7.4 Alineación metodológica

- 7.4.1 El hilo conductor: antecedente → problema → teoría → artefacto
- 7.4.2 Auditoría de pertinencia: lo que se excluyó del marco teórico y por qué

---

## 8. Objetivo general

> **Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (empresa → sucursales) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias empresas de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos.**

---

## 9. Objetivos específicos

Cuatro objetivos secuenciales, uno por fase —**Analizar → Diseñar → Implementar → Validar**—, cada uno correlativo a una pregunta específica y cerrado con un entregable verificable.

| # | Objetivo específico | Entregable verificable |
|---|---|---|
| 1 | **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— y las soluciones de gestión de talleres con presencia en Bolivia, para fundamentar la selección arquitectónica e identificar el vacío que justifica el proyecto | Matriz de extracción del estado del arte · análisis del mercado con el vacío identificado |
| 2 | **Diseñar** el modelo de datos de la jerarquía empresa → sucursales —con el alcance de cada entidad según su nivel y las restricciones de integridad que de él se derivan— y **especificar** las políticas de seguridad a nivel de fila, junto con las funciones auxiliares de verificación de membresía, que sostienen un único límite de aislamiento | Modelo entidad-relación con alcance por nivel · contrato de la interfaz de programación · migración con políticas y funciones de verificación |
| 3 | **Implementar** sobre infraestructura serverless la capa de identidad, la jerarquía organizacional y el control de acceso por rol, junto con el corte vertical que demuestra el alcance diferenciado de datos —clientes (nivel empresa) e inventario (nivel sucursal)—, y **automatizar** un pipeline de integración continua | Sistema con registro, empresas, sucursales, miembros, clientes e inventario operativos · pipeline en verde en cada integración |
| 4 | **Validar** el aislamiento mediante pruebas automatizadas que comprueben, tanto por la interfaz de programación como por acceso directo a la base de datos, que una empresa no puede acceder a datos de otra aun cuando la capa de aplicación omita sus controles, y **evaluar** con operadores del rubro la usabilidad del cambio de contexto entre empresas y sucursales | Suite de pruebas de aislamiento con su matriz requisito → caso → evidencia, reproducible desde una base vacía · informe de evaluación de usabilidad con tasa de éxito por tarea y puntuación SUS |

---

## 10. Hipótesis

Por tratarse de una investigación explicativa que propone aplicar una arquitectura determinada para mejorar una propiedad medible del sistema, corresponde formular hipótesis. Se enuncia como **afirmación factual** —no como promesa futura—, de modo que quede sujeta a comprobación o refutación empírica.

### 10.1 Hipótesis de investigación (H1)

> **La implementación de una arquitectura multi-tenant jerárquica —que sitúa el límite de aislamiento en la empresa y trata la sucursal como criterio de alcance operativo, con políticas de seguridad a nivel de fila reforzadas por verificación de membresía en la capa de aplicación— eliminó el acceso cruzado de datos entre empresas, reduciendo a cero (0) las filas ajenas devueltas, y sostuvo esa separación aun con la verificación de la capa de aplicación deshabilitada.**

### 10.2 Hipótesis nula (H0)

> La arquitectura propuesta no produce una mejora medible del aislamiento: al menos una consulta ejecutada con la identidad de una cuenta ajena devuelve filas de otra empresa, o la separación deja de sostenerse cuando la capa de aplicación omite sus controles.

### 10.3 Criterio de decisión

La H0 se rechaza únicamente si **todas** las condiciones siguientes se cumplen de forma reproducible: cero filas ajenas devueltas por acceso directo a la base de datos en la totalidad de las tablas de negocio, respuesta de autorización correcta en el 100 % de las operaciones evaluadas, y persistencia de ambos resultados con la verificación de la capa de aplicación deshabilitada. Un solo caso en contrario sostiene la H0.

---

## 11. Variables/categorías de investigación

| Tipo | Variable | Definición conceptual |
|---|---|---|
| **Independiente** (causa) | **Arquitectura multi-tenant jerárquica con aislamiento en dos capas** | Modelo de organización de datos que sitúa el límite de aislamiento en la empresa y la sucursal como subdivisión operativa, con políticas de seguridad a nivel de fila en el motor de base de datos reforzadas por verificación de membresía en la capa de aplicación |
| **Dependiente** (efecto) | **Separación verificable de datos entre empresas** | Grado en que los datos de una empresa resultan inaccesibles para cuentas sin membresía activa en ella, comprobable por vías independientes y con independencia de que la capa de aplicación aplique o no sus controles |
| **Dependiente** (efecto) | **Gestión centralizada** | Capacidad de administrar varias empresas y sucursales desde una sola cuenta conservando la visión consolidada del cliente y su historial |
| **Dependiente** (efecto) | **Usabilidad del cambio de contexto** | Grado en que un operador del rubro, sin formación previa, logra situarse en la empresa y la sucursal correctas y percibir el alcance de los datos que está viendo |
| **Interviniente** | Modelo de despliegue serverless | Condición de ejecución que impone ausencia de estado entre peticiones y costo proporcional al uso; no se manipula, se mantiene constante |

---

## 12. Operacionalización de variables

### 12.1 Variable dependiente: Separación verificable de datos entre empresas

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Aislamiento en el motor de base de datos** | • Filas ajenas devueltas por consulta directa (cantidad, entero)<br>• Tablas de negocio con políticas de seguridad a nivel de fila activas (porcentaje %) | • Suite de pruebas de aislamiento (Vitest)<br>• Cliente PostgreSQL autenticado con la identidad de otra cuenta |
| **Aislamiento en la capa de aplicación** | • Operaciones con respuesta de autorización correcta (porcentaje %)<br>• Respuestas que respetan la regla de no divulgación —mismo error para recurso ajeno e inexistente— (porcentaje %) | • Pruebas de contrato HTTP (Vitest)<br>• Cliente HTTP sobre la interfaz de programación |
| **Independencia entre capas (defensa en profundidad)** | • Casos de aislamiento en verde con la verificación de la aplicación deshabilitada (porcentaje %)<br>• Vías independientes de verificación ejecutadas (cantidad, entero) | • Ejecución de la suite con la verificación de membresía desactivada deliberadamente |

### 12.2 Variable dependiente: Gestión centralizada

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Alcance de datos por nivel** | • Entidades de nivel empresa accesibles desde cualquier sucursal (porcentaje %)<br>• Entidades de nivel sucursal visibles fuera de su sucursal (cantidad; esperado 0) | • Casos de prueba de alcance por nivel (Vitest) |
| **Cambio de contexto** | • Empresas administrables por cuenta (cantidad, entero)<br>• Operaciones que exigen reautenticación al cambiar de contexto (cantidad; esperado 0) | • Pruebas de integración sobre el cambio de empresa y sucursal activas |

### 12.3 Variable dependiente: Usabilidad del cambio de contexto

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Eficacia** | • Tasa de éxito por tarea (porcentaje %; umbral ≥ 80 %)<br>• Tareas completadas sin asistencia (cantidad sobre 3) | • Observación estructurada de tarea guiada<br>• Guion de tareas T1–T3 |
| **Eficiencia** | • Tiempo por tarea (segundos)<br>• Errores por tarea (cantidad) | • Cronometraje de la sesión<br>• Registro de incidencias |
| **Satisfacción** | • Puntuación SUS (escala 0 a 100; umbral ≥ 68, promedio de la industria) | • Cuestionario System Usability Scale (Bangor et al., 2008) |

Los indicadores de eficiencia se reportan **sin umbral**: con una muestra dimensionada para detectar problemas no procede afirmar significancia estadística sobre tiempos ni sobre recuentos de error.

### 12.4 Variable independiente: Arquitectura multi-tenant jerárquica

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Jerarquía organizacional** | • Niveles jerárquicos modelados (cantidad; esperado 2)<br>• Límites de aislamiento definidos (cantidad; esperado 1)<br>• Tablas de negocio que portan el identificador de empresa (porcentaje %) | • Modelo entidad-relación<br>• Migraciones versionadas del esquema |
| **Control de acceso** | • Roles definidos por empresa (cantidad; esperado 3)<br>• Funciones de verificación de membresía (cantidad; esperado 2) | • Revisión del esquema y de las políticas declaradas |
| **Automatización de la verificación** | • Errores de verificación estática de tipos (cantidad; esperado 0)<br>• Integraciones con pipeline en verde (porcentaje %) | • Verificador de tipos de TypeScript<br>• Registro de ejecuciones de integración continua |

---

## 13. Matriz de consistencia

| Pregunta / problema | Objetivo general | Objetivos específicos | Hipótesis | Variables e indicadores |
|---|---|---|---|---|
| **General:** ¿De qué manera una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento mediante seguridad a nivel de fila, mejora la gestión centralizada y la seguridad de los datos de operadores de varias empresas y sucursales de servicio de motocicletas en Bolivia?<br><br>**Específicas:**<br>1. ¿Qué estrategias documenta la literatura y qué carencias presenta la oferta boliviana?<br>2. ¿Qué modelo de datos y qué políticas sostienen un único límite de aislamiento?<br>3. ¿Cómo se implementan identidad, jerarquía y control de acceso por rol con verificación automatizada?<br>4. ¿Cómo se comprueba el aislamiento aun ante fallos de la capa de aplicación? | Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (empresa → sucursales) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias empresas de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos. | 1. **Analizar** las estrategias de aislamiento multi-tenant de la literatura y las soluciones con presencia en Bolivia.<br><br>2. **Diseñar y especificar** el modelo de datos de la jerarquía empresa → sucursales y las políticas de seguridad a nivel de fila.<br><br>3. **Implementar y automatizar** la identidad, la jerarquía y el control de acceso por rol, con el corte vertical de clientes e inventario y un pipeline de integración continua.<br><br>4. **Validar** el aislamiento con pruebas por interfaz de programación y por acceso directo a la base de datos. | La implementación de una arquitectura multi-tenant jerárquica, con políticas de seguridad a nivel de fila reforzadas por verificación de membresía en la capa de aplicación, eliminó el acceso cruzado de datos entre empresas: redujo a cero (0) las filas ajenas devueltas y sostuvo la separación aun con la verificación de la capa de aplicación deshabilitada. | **V. Independiente:** arquitectura multi-tenant jerárquica con aislamiento en dos capas.<br><br>**V. Dependiente:** separación verificable de datos entre empresas; gestión centralizada.<br><br>**Indicadores:**<br>• Filas ajenas devueltas por acceso directo: 0<br>• Tablas con políticas activas: 100 % (7 de 7)<br>• Operaciones con autorización correcta: 100 %<br>• Casos en verde sin capa de aplicación: 100 %<br>• Vías independientes de verificación: 2 |

---

## 14. Enfoque y tipo de investigación

| Dimensión | Definición adoptada | Fundamento |
|---|---|---|
| **Tipo de investigación** | **Aplicada** | No busca conocimiento general, sino resolver un problema concreto mediante un artefacto de software verificable |
| **Enfoque** | **Mixto** | El componente cualitativo abarca la revisión de literatura, el relevamiento del mercado, el diseño arquitectónico y la observación de las sesiones con operadores; el cuantitativo, la medición objetiva del aislamiento (filas devueltas, porcentajes de cobertura y de casos en verde) y las métricas de usabilidad (tasa de éxito, tiempos y puntuación SUS) |
| **Alcance** | **Descriptivo → propositivo → explicativo** | Descriptivo en la fase de análisis, propositivo en la de diseño y explicativo-experimental en la de validación, donde se establece la relación causa-efecto entre la arquitectura aplicada y la separación obtenida |
| **Método** | **Hipotético-deductivo** | La hipótesis se formula antes de la validación y se somete a pruebas capaces de refutarla |

---

## 15. Diseño de investigación

### 15.1 Tipo de diseño

**Experimental sobre caso único**, con medición posterior a la intervención. El artefacto construido es la unidad de observación, y las pruebas **manipulan deliberadamente** la condición de aislamiento —incluida la desactivación de la capa de aplicación— para observar su efecto sobre la variable dependiente.

### 15.2 Condiciones experimentales

| Condición | Descripción | Qué se observa |
|---|---|---|
| **C1 · Arquitectura completa** | Ambas capas activas: políticas en el motor de base de datos y verificación de membresía en la aplicación | Comportamiento nominal del sistema |
| **C2 · Sin capa de aplicación** | Se desactiva deliberadamente la verificación de membresía; solo actúan las políticas del motor | Si el aislamiento se sostiene por sí solo en la base de datos |
| **C3 · Acceso directo al motor** | Se consulta la base de datos con la identidad de otra cuenta, sin pasar por la interfaz de programación | Si las políticas filtran las filas ajenas sin intervención de la aplicación |

La comparación entre C1, C2 y C3 es lo que permite afirmar —o refutar— que las dos capas son **independientes**, y no que una encubre el fallo de la otra.

### 15.3 Evaluación de usabilidad

La validación del objetivo 4 incorpora un segundo componente, de naturaleza distinta: un **estudio observacional de tareas guiadas** con operadores del rubro, sobre la aplicación desplegada.

| Elemento | Definición |
|---|---|
| **Diseño** | Observacional, de un solo grupo y una sola medición. No hay grupo de control: no se compara contra otra interfaz, sino contra umbrales establecidos en la literatura |
| **Tareas** | T1 cambiar de empresa y confirmar los datos mostrados · T2 seleccionar sucursal y registrar en ella un repuesto · T3 localizar un cliente registrado en otra sucursal de la misma empresa |
| **Métricas** | Tasa de éxito por tarea (≥ 80 %), tiempo y errores por tarea (descriptivos), y puntuación SUS (≥ 68) |
| **Por qué estas tres tareas** | Cada una ejercita una consecuencia distinta de la jerarquía: el nivel empresa, el nivel sucursal y el beneficio de que el cliente pertenezca a la empresa y no al local. No se evalúa la interfaz en general |

El componente de usabilidad **no forma parte de la hipótesis**: la afirmación sujeta a refutación es la del aislamiento (§10). La usabilidad se reporta como evidencia complementaria del objetivo 4, con sus umbrales declarados de antemano, y un resultado por debajo de ellos constituye un hallazgo que se discute, no un fallo de la tesis.


### 15.4 Escenario de laboratorio

```
Cuenta A ──owner──> Empresa 1 ──> Sucursal 1.1 (repuestos propios)
                        │         └── Sucursal 1.2 (repuestos propios)
                        └── clientes de la Empresa 1

Cuenta A ──owner──> Empresa 2          (misma cuenta, otra empresa)

Cuenta B ──owner──> Empresa 3 ──> Sucursal 3.1 · clientes propios

Cuenta C  ── sin membresía en ninguna de las anteriores
```

Un solo montaje cubre las tres preguntas del aislamiento: **entre cuentas** (A frente a B), **entre empresas de la misma cuenta** (Empresa 1 frente a Empresa 2) y **frente a quien no es miembro de ninguna** (Cuenta C).

### 15.5 Procedimiento

1. Construcción del escenario base por la propia prueba, desde una base vacía reconstruida con migraciones versionadas.
2. Ejecución de los casos bajo la condición C1 y registro de resultados.
3. Repetición bajo C2 y C3.
4. Contraste de los resultados contra el criterio de decisión de la hipótesis (§10.3).
5. Conservación de la evidencia: guion de construcción, salida de la ejecución e identificador de la migración aplicada.

### 15.6 Validez y limitaciones del diseño

| Aspecto | Tratamiento |
|---|---|
| **Validez interna** | El resultado de cada caso es binario y objetivo —pasa o no pasa—, sin interpretación del investigador. Las condiciones se manipulan una a la vez |
| **Fiabilidad** | La suite es automatizada y reproducible desde una base vacía; una segunda persona puede repetirla y obtener el mismo resultado |
| **Validez externa** | Limitada: los resultados se obtienen en un entorno de desarrollo, no productivo, y con un número reducido de inquilinos. No se generaliza el comportamiento bajo carga |
| **Limitación declarada** | No se prueba la fuga por canal lateral temporal documentada por Dar et al. (2023): el aislamiento verificado es el de **contenido** —qué filas se devuelven—, no el de metadatos inferibles por tiempo de ejecución |

---

## 16. Población y muestra

El proyecto trabaja con **tres poblaciones diferenciadas**, porque combina revisión documental, relevamiento de mercado y validación técnica. Se declara cada una con su muestreo, y se explicita también por qué no se toma muestra de usuarios.

### 16.1 Población documental *(objetivo 1)*

| Elemento | Definición |
|---|---|
| **Población** | Publicaciones revisadas por pares sobre aislamiento entre inquilinos en arquitecturas de esquema compartido, publicadas entre 2021 y 2026, indexadas en ACM Digital Library, IEEE Xplore, Scopus, BASE, OATD y Google Scholar |
| **Muestra** | **5 fuentes** seleccionadas |
| **Tipo de muestreo** | No probabilístico, **por criterio**: se aplican los criterios de inclusión y exclusión declarados (ventana 2021–2026; revisión por pares o tesis de posgrado en ciencias de la computación; problema arquitectónico comparable aunque el rubro difiera). Se excluyen soluciones sobre tecnologías legadas y artículos de opinión sin validación métrica |
| **Criterio de suficiencia** | Saturación temática: las fuentes adicionales relevadas repetían las limitaciones ya consignadas sin aportar un vacío nuevo |

### 16.2 Población de soluciones del mercado *(objetivo 1)*

| Elemento | Definición |
|---|---|
| **Población** | Plataformas de software para la gestión de talleres de servicio vehicular con presencia, uso o comercialización en Bolivia |
| **Muestra** | **11 plataformas** relevadas: 5 con presencia directa en Bolivia, 2 regionales de uso extendido en el país y 4 referentes internacionales tomados como estándar de funcionalidades |
| **Tipo de muestreo** | No probabilístico **intencional**, por accesibilidad de la información pública del producto |
| **Criterio de inclusión** | Solo plataformas del **mismo objetivo** —gestión de la operación de talleres—; se excluye software administrativo o contable de propósito general |

### 16.3 Población técnica: unidades de análisis *(objetivos 2, 3 y 4)*

Es la población sobre la que se mide la variable dependiente.

| Elemento | Definición |
|---|---|
| **Población** | Las **tablas de negocio** del esquema de datos y las **operaciones** expuestas por la interfaz de programación del sistema construido |
| **Muestra** | **Censo — el 100 % de la población.** Se evalúan las 7 tablas de negocio (clientes, sucursales, membresías, asignaciones, repuestos, movimientos de existencias y registro de auditoría) y la totalidad de las operaciones del contrato |
| **Justificación de no muestrear** | En validación de aislamiento **no cabe el muestreo probabilístico**: una sola tabla sin política activa constituye una fuga, y una muestra parcial podría declarar seguro un sistema que no lo es. La cobertura total es condición del objetivo 4, no una decisión de conveniencia |
| **Sujetos de prueba** | **3 cuentas sintéticas**, 3 empresas y 3 sucursales, generadas por la propia prueba con identificadores irrepetibles. En esta población **no intervienen personas**: los datos son generados, no reales |

### 16.4 Población de operadores *(objetivo 4 — evaluación de usabilidad)*

Es la única población compuesta por **personas**, y la única que impone consideraciones éticas.

| Elemento | Definición |
|---|---|
| **Población** | Operadores de empresas de servicio de motocicletas en Bolivia que administran —o planean administrar— más de una empresa y/o más de una sucursal: exactamente el perfil que padece el problema descrito en §2 |
| **Muestra** | **De 5 a 8 participantes** |
| **Tipo de muestreo** | No probabilístico **intencional**, por criterio de perfil |
| **Justificación del tamaño** | Nielsen y Landauer (1993) modelan matemáticamente el hallazgo de problemas de usabilidad y muestran que la curva de detección se satura pronto: cinco participantes descubren la mayoría de los problemas de una interfaz, y cada participante adicional aporta cada vez menos. El objetivo es **detectar problemas de uso**, no estimar un parámetro poblacional; por eso ampliar la muestra no mejoraría la conclusión en proporción al esfuerzo |
| **Criterio de exclusión** | Haber participado en el desarrollo o conocer la aplicación antes de la sesión |
| **Consideraciones éticas** | Consentimiento informado previo, con derecho a retirarse en cualquier momento; resultados reportados de forma agregada, con los participantes identificados como P1…P8; no se publica ningún dato que permita identificarlos a ellos ni a sus empresas. Se declara al participante que **se evalúa el sistema, no a la persona** |

### 16.5 Sobre el alcance de esta muestra

Conviene declarar qué **no** permite concluir. La muestra de operadores está dimensionada para detectar problemas de uso, no para sostener inferencia estadística: no se afirma representatividad del sector boliviano ni significancia sobre tiempos o puntuaciones. La caracterización del sector sigue apoyándose en fuentes estadísticas oficiales del INE (§5), no en esta muestra.

Tampoco se evalúa la interfaz completa: la evaluación se acota al **cambio de contexto entre empresas y sucursales**, por ser la manifestación visible del aporte de la tesis. Las demás pantallas no se someten a prueba con usuarios.

---

## 17. Alcance y exclusiones

### 17.1 Alcance funcional

- Registro que crea una cuenta, su primera empresa y su primera sucursal, con el usuario como propietario.
- Creación de empresas adicionales bajo la misma cuenta y de sucursales dentro de cada empresa.
- Listado de empresas según membresía, cambio de empresa activa y selección de sucursal activa.
- Gestión de miembros por empresa —invitar, cambiar rol, remover—, reservada al propietario, y asignación operativa de miembros a sucursales.
- **Corte vertical de demostración**: Clientes (entidad de nivel empresa, visible desde cualquier sucursal) e Inventario de repuestos (entidad de nivel sucursal, acotada a su local).
- Verificación de aislamiento por dos vías independientes.

### 17.2 Alcance técnico

| Componente | Tecnología |
|---|---|
| Servidor | Node.js · TypeScript · Hono · Zod |
| Datos e identidad | PostgreSQL con seguridad a nivel de fila, sobre proveedor gestionado |
| Despliegue | Funciones serverless |
| Interfaz de usuario | React con TypeScript, responsiva e instalable |
| Pruebas | Vitest — unitarias, de contrato, de integración y de aislamiento |
| Integración continua | Pipeline automatizado con verificación de tipos y suite de pruebas |

### 17.3 Exclusiones

El objeto de estudio es la **arquitectura**, no la suite funcional completa. No forman parte de este proyecto:

- Los módulos operativos fuera del corte vertical: motocicletas, órdenes de trabajo, historial de mantenimiento y panel de métricas.
- La auditoría extendida a la totalidad de las entidades de negocio; sí se audita el conjunto acotado de acciones críticas.
- La integración con mensajería por WhatsApp.
- La emisión de factura electrónica del Servicio de Impuestos Nacionales.
- Aplicaciones móviles o de escritorio nativas: solo web responsiva e instalable.
- Migración de datos productivos desde sistemas anteriores.
- Pruebas de carga o rendimiento a escala productiva.

---

## 18. Referencias

Estilo **APA (7.ª edición)**. Todos los identificadores permanentes —DOI e ISBN— fueron verificados contra el registro del editor.

Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. https://doi.org/10.3390/iot7010021

Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. https://repository.utm.md/handle/5014/35481

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human–Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional.

Beck, K. (2002). *Test-driven development: By example*. Addison-Wesley Professional.

Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution and International Workshop on Principles of Software Evolution* (pp. 88–92). ACM. https://doi.org/10.1145/1862372.1862393

Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. https://doi.org/10.1145/362384.362685

Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. https://doi.org/10.1145/3588943

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine].

Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press.

Gao, Z., Bird, C., & Barr, E. T. (2017). To type or not to type: Quantifying detectable bugs in JavaScript. En *2017 IEEE/ACM 39th International Conference on Software Engineering* (pp. 758–769). IEEE. https://doi.org/10.1109/ICSE.2017.75

Gilbert, S., & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News, 33*(2), 51–59. https://doi.org/10.1145/564585.564601

Haerder, T., & Reuter, A. (1983). Principles of transaction-oriented database recovery. *ACM Computing Surveys, 15*(4), 287–317. https://doi.org/10.1145/289.291

Hernández-Sampieri, R., & Mendoza Torres, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education.

Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional.

Instituto Nacional de Estadística de Bolivia. (s. f.). *Parque automotor — Cuadros estadísticos*. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. https://arxiv.org/abs/1902.03383

Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science* (pp. 426–431). SciTePress. https://doi.org/10.5220/0003957604260431

Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. https://doi.org/10.1109/MC.2003.1204375

Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann.

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

Pierce, B. C. (2002). *Types and programming languages*. MIT Press.

Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media.

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft). https://www.w3.org/TR/appmanifest/
