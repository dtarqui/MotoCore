<div align="center">

**UNIVERSIDAD CATÓLICA BOLIVIANA "SAN PABLO"**

**DIRECCIÓN DE POSTGRADO**

**MAESTRÍA EN FULL STACK DEVELOPMENT**

---

## ANTEPROYECTO

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

## 1. Título del proyecto

> **Diseño, implementación y validación de una arquitectura multi-tenant jerárquica con aislamiento verificable en la base de datos para organizaciones de servicio de motocicletas en Bolivia**

| Campo | Detalle |
|---|---|
| **Línea de investigación** | Arquitectura de software y seguridad de datos en aplicaciones de software como servicio |
| **Área de conocimiento** | Ingeniería de software · Bases de datos · Computación en la nube |
| **Período de ejecución** | Septiembre a diciembre de 2026 |
| **Ámbito de aplicación** | Organizaciones de servicio y reparación de motocicletas en Bolivia |

---

## 2. Planteamiento del problema

### 2.1 Situación problemática

**Síntoma.** Un operador que administra una o varias organizaciones de servicio de motocicletas, cada una con uno o varios talleres, no dispone en Bolivia de una plataforma que le permita gestionarlas desde una sola cuenta con visión consolidada. Hoy debe elegir entre dos malas opciones: llevar cada local como una cuenta independiente —perdiendo la vista unificada del cliente y su historial— o recurrir a hojas de cálculo y software genérico no especializado.

**Causa.** El software de gestión de talleres relevado con presencia en Bolivia (AutoSoft Taller, ServitechApp, TuneraTaller) y el regional (Appli-Car, Garage App) está construido sobre arquitecturas de **un solo inquilino** (*single-tenant*): asumen un taller por cuenta. No modelan ni la pertenencia de varias organizaciones a una misma cuenta, ni la de varios talleres a una misma organización. Cuando existe algún aislamiento entre clientes del sistema, se resuelve **únicamente en el código de la aplicación**: basta que una consulta omita el filtro correspondiente para que se produzca una fuga de datos, porque no hay ningún control por debajo que lo impida.

**Impacto.**

| Efecto | Consecuencia |
|---|---|
| Pérdida de la visión consolidada | El historial del cliente queda fragmentado entre talleres de la misma organización, que es justamente lo que se busca al centralizar |
| Riesgo de fuga de datos entre organizaciones | Al depender el aislamiento de que cada consulta esté correctamente escrita, un solo error de programación expone información de un cliente del sistema a otro |
| Barrera de costo | La infraestructura tradicional (servidor propio, despliegue manual) eleva el costo de entrada, factor crítico en un sector con alta informalidad y bajo presupuesto de tecnología |

### 2.2 Delimitación del problema

| Dimensión | Delimitación |
|---|---|
| **Espacial / organizacional** | Organizaciones de servicio y reparación de motocicletas en Bolivia; específicamente, operadores que administran —o planean administrar— más de una organización y/o más de un taller |
| **Temporal** | Desarrollo y validación entre septiembre y diciembre de 2026 (cuatro meses) |
| **Técnica** | La capa de identidad, jerarquía organizacional y aislamiento de datos: cuentas, organizaciones, talleres, membresías con rol, y las políticas de seguridad que las hacen cumplir en la base de datos. **No** abarca la totalidad de los módulos operativos |

### 2.3 Formulación del problema

> **¿De qué manera el diseño e implementación de una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento aplicado mediante seguridad a nivel de fila, mejora la gestión centralizada y la seguridad de los datos de operadores de varias organizaciones y talleres de servicio de motocicletas en Bolivia?**

---

## 3. Preguntas de investigación

**Pregunta general.** La formulación del problema (§2.3) constituye la pregunta general del estudio.

**Preguntas específicas.** Una por cada objetivo específico, en el mismo orden:

1. ¿Qué estrategias de aislamiento multi-tenant documenta la literatura, con qué ventajas y limitaciones, y qué carencias presentan frente al modelo multiorganización las soluciones de gestión de talleres disponibles en Bolivia? *(Análisis)*
2. ¿Qué modelo de datos y qué políticas de seguridad a nivel de fila permiten representar la jerarquía organización → talleres sin fragmentar la información del cliente y sosteniendo un único límite de aislamiento? *(Diseño)*
3. ¿Cómo se implementan la identidad, la jerarquía organizacional, el control de acceso por rol y el alcance diferenciado de datos sobre una plataforma serverless con verificación automatizada en cada integración? *(Implementación)*
4. ¿Cómo se comprueba, con evidencia reproducible, que el aislamiento entre organizaciones se cumple incluso ante fallos de la capa de aplicación, y que el cambio de contexto entre organizaciones y talleres resulta usable para el operador? *(Validación)*

---

## 4. Justificación

### 4.1 Justificación teórica

El estado del arte aborda el aislamiento entre inquilinos en modelos **planos**, de un solo nivel. Este proyecto extiende el problema a una **multi-tenancy jerárquica**, donde el inquilino posee una subdivisión interna y las entidades no comparten el mismo alcance: unas siguen al cliente y pertenecen a la organización, otras responden a la existencia física de un local y pertenecen al taller. Sostener un aislamiento verificable bajo esa asimetría, con un único límite de seguridad, es el aporte que el proyecto disputa a la literatura revisada.

### 4.2 Justificación práctica

Ofrece a los operadores bolivianos de servicio de motocicletas una capacidad que hoy no existe en su mercado: administrar varias organizaciones desde una sola cuenta, con visión consolidada del cliente entre talleres y con separación de datos demostrable. El relevamiento confirma que la gestión de varias organizaciones por cuenta está **ausente** en la oferta local, y que ninguna solución relevada documenta su aislamiento entre organizaciones.

### 4.3 Justificación metodológica

Aporta un procedimiento reproducible para **verificar** el aislamiento multi-tenant, no solo para afirmarlo: dos vías independientes de comprobación —por la interfaz de programación y por acceso directo al motor de base de datos— con un escenario de datos construido por la propia prueba y una matriz que traza cada requisito hasta su evidencia. El procedimiento es aplicable a cualquier sistema de esquema compartido, con independencia del rubro.

### 4.4 Justificación social y económica

El modelo de despliegue serverless, con escalado a cero y sin costo fijo por organización, hace económicamente viable ofrecer software especializado a un sector con **84,2 % de informalidad laboral** y presupuesto de tecnología mínimo. La barrera de costo identificada en el planteamiento del problema es, en sí misma, una condición de diseño del proyecto.

---

## 5. Antecedentes

**El parque de motocicletas y la demanda de servicio.** La motocicleta es el vehículo más numeroso de Bolivia. Según el Instituto Nacional de Estadística (INE), a partir de los registros del Registro Único para la Administración Tributaria Municipal (RUAT), en **2025** se contabilizaron **931.205 motocicletas**, el **34,8 %** del parque automotor nacional, encabezándolo por delante de vagonetas, automóviles y camionetas. Su crecimiento es sostenido y superior al del parque en conjunto: pasó de **657.718 unidades en 2021** a **872.550 en 2024** y a **931.205 en 2025**, un incremento del **41,6 % en cuatro años**, frente al +20,0 % del parque automotor total en el mismo período. Cada una de esas unidades requiere mantenimiento periódico y reparaciones, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio — una base de negocio que crece año a año y que, al hacerlo, empuja a los operadores más exitosos a abrir locales adicionales.

**Condiciones del sector que explican el problema.** Ese crecimiento ocurre, sin embargo, en una economía marcadamente informal: el indicador de **informalidad laboral del 84,2 % en 2024**, procedente de la Encuesta Continua de Empleo del INE, describe una tendencia agravada de forma sostenida durante las últimas dos décadas. Se emplea como caracterización cualitativa del sector y no interviene en ningún cálculo de este documento. Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo. En ese contexto, el operador que crece —el que abre un segundo o tercer taller, o constituye más de una organización— se encuentra sin herramientas que le permitan administrarlas de forma centralizada. Este es precisamente el escenario que el presente proyecto aborda.

**Fuentes de los antecedentes**

| Fuente | Tipo |
|---|---|
| INE — **Cuadro N.º 1.2**, *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (datos originados en el RUAT). Cuadro del que proceden todas las cifras | Primaria (oficial, descargable) |
| INE — *Boletín estadístico parque automotor 2024* (28 de mayo de 2025) | Primaria (oficial) |
| INE — *Estadísticas del parque automotor 2003–2025* (1 de julio de 2026) | Primaria (oficial) |
| INE — *Encuesta Continua de Empleo* (indicador de informalidad laboral) | Secundaria — dato por remitir a su cuadro oficial |

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

El presente proyecto aborda esta deficiencia mediante el **diseño, implementación y validación de una arquitectura multi-tenant jerárquica (organización → talleres)** que mantiene un **único límite de aislamiento verificable** a nivel de organización, tratando el taller como criterio de alcance operativo y no como segunda frontera de seguridad; refuerza la seguridad a nivel de fila con **verificación de membresía en la capa de aplicación**; y **valida empíricamente la separación de datos** por dos vías independientes.

---

## 7. Marco teórico y conceptual

El **marco conceptual** responde *«¿qué herramientas se usan?»*; el **marco teórico**, *«¿por qué se usan y cómo funcionan internamente?»*. Se presenta en forma condensada: diez definiciones en el conceptual y, en el teórico, el enunciado de cada teoría y la decisión de ingeniería que gobierna — su crítica se remite a §7.3 y su encadenamiento con el problema a §7.4, para no repetirlos. El desarrollo extenso de cada bloque, con la discusión completa de sus limitaciones, está en el [capítulo 3](03-marco-teorico-y-conceptual.md). Toda afirmación no propia lleva crédito a su autor en normas APA 7.ª edición, con autor corporativo cuando la fuente es documentación técnica sin autor humano.

### 7.1 Marco conceptual — el «qué»

Definición formal de las tecnologías propias de esta solución; se excluyen los conceptos universales o básicos.

| # | Término | Definición formal | Fuente |
|---|---|---|---|
| 1 | **Node.js** | Entorno de ejecución de JavaScript del lado del servidor, sobre el motor V8, con entrada/salida no bloqueante y orientada a eventos. | OpenJS Foundation (s. f.) |
| 2 | **TypeScript** | Lenguaje que extiende JavaScript con un sistema de tipos estático opcional, verificado en compilación y borrado en la salida ejecutable. | Microsoft (s. f.) |
| 3 | **API REST** | Estilo arquitectónico definido por seis restricciones —cliente-servidor, **sin estado**, cacheable, interfaz uniforme, sistema por capas y código bajo demanda—, orientado a recursos identificados por URI. | Fielding (2000) |
| 4 | **JSON Web Token (JWT)** | Formato compacto y seguro para URL que representa declaraciones como objeto JSON, verificable mediante firma digital. Estándar RFC 7519. | Jones et al. (2015) |
| 5 | **PostgreSQL** | Gestor de bases de datos objeto-relacional de código abierto, con cumplimiento ACID y soporte extensible de tipos, funciones y políticas de acceso. | PostgreSQL Global Development Group (s. f.-a) |
| 6 | **Row-Level Security (RLS)** | Mecanismo de PostgreSQL que restringe, **dentro del propio motor**, qué filas puede leer o modificar cada usuario, mediante políticas evaluadas en toda consulta con independencia de la aplicación que la origine. | PostgreSQL Global Development Group (s. f.-b) |
| 7 | **Función serverless** | Unidad de cómputo desplegada sin administrar servidores, de ejecución **efímera y sin estado**, invocada por evento, facturada por consumo real y con escalado automático hasta cero. | Jonas et al. (2019) |
| 8 | **Validación por esquema** | Declaración de la forma esperada de un dato como esquema ejecutable, que valida en tiempo de ejecución y del cual se **deriva** el tipo estático, evitando dos definiciones paralelas. | Zod (s. f.) |
| 9 | **Progressive Web App (PWA)** | Aplicación web que, mediante un manifiesto y un *service worker*, resulta instalable en el dispositivo sin distribuirse por una tienda de aplicaciones. | World Wide Web Consortium [W3C] (2026) |
| 10 | **Problem Details** | Formato normalizado de respuesta de error para interfaces HTTP: tipo, título, estado y detalle en un cuerpo estructurado. Estándar RFC 9457, que sustituye al RFC 7807. | Nottingham et al. (2023) |

### 7.2 Marco teórico — el «por qué» y el «cómo»

#### 7.2.1 Teorías de arquitectura — el diseño global

**Estilo REST y ausencia de estado.** Fielding (2000) demostró que la restricción *stateless* —cada petición contiene todo lo necesario para ser atendida— produce visibilidad, fiabilidad y **escalabilidad horizontal**. Es la condición que hace posible el despliegue serverless, donde la función que atiende una petición puede no ser la que atienda la siguiente. Bass et al. (2021) añaden el criterio que ordena el conjunto: la arquitectura se determina por sus **atributos de calidad** y no por su funcionalidad, y cada uno se alcanza con tácticas trazables hasta un requisito; bajo ese marco el aislamiento entre organizaciones es el atributo rector del sistema. Richards y Ford (2020) completan que toda decisión arquitectónica es un intercambio cuyo valor documental está en registrar las alternativas descartadas.

**Modelos de multi-tenancy.** Se reconocen tres estrategias: base de datos por inquilino, esquema por inquilino y **esquema compartido con discriminador**. Krebs et al. (2012) sistematizan sus compromisos entre aprovechamiento de recursos y grado de aislamiento; Bezemer y Zaidman (2010) advierten que compartir instancia dispersa la conciencia de inquilino por toda la base de código, de modo que el olvido en un solo punto compromete el aislamiento. Esto fundamenta la elección del proyecto —esquema compartido, por el costo proporcional al uso que hace viable el escalado a cero de Jonas et al. (2019) en un sector de presupuesto reducido (§5)— y explica por qué **obliga a un mecanismo por debajo de la aplicación**: el punto débil que ambos identifican es el que RLS neutraliza al mover la condición de inquilino desde la consulta hacia el motor.

**De la multi-tenancy plana a la jerárquica.** Esa taxonomía supone inquilinos **planos** e indivisibles, y el caso de este proyecto no encaja: el inquilino tiene una subdivisión interna —la organización opera varios talleres— cuyas entidades **no comparten el mismo alcance**. Simić et al. (2024) son quienes más se aproximan a formalizar una jerarquía de inquilinos, pero la suya organiza recursos de infraestructura y no filas de una base relacional compartida. Queda así planteado el problema teórico que el proyecto debe resolver por su cuenta: **dónde situar el límite de aislamiento cuando el inquilino tiene subdivisiones**. Situarlo en la subdivisión fragmenta la información que se quería centralizar; no modelarla impide distinguir dónde ocurre cada operación; situarlo en el nivel superior y tratar la subdivisión como criterio de alcance conserva ambas propiedades, a costa de que el alcance de cada entidad pase a ser una **decisión de diseño explícita**. El proyecto adopta esta última vía, y en ella reside su aporte.

#### 7.2.2 Teorías de backend y persistencia — cómo se procesan y guardan los datos

**Modelo relacional y transaccionalidad.** Codd (1970) separó la descripción lógica de los datos de su representación física, independencia que permite expresar una regla de acceso como condición lógica sobre una relación —una política— y no como código disperso. Haerder y Reuter (1983) formalizaron las propiedades ACID, fundamento de una regla concreta del sistema: el registro de un movimiento de existencias y la actualización de la existencia del repuesto **deben ocurrir en una sola transacción**, porque un fallo entre ambas dejaría el inventario inconsistente.

**Teorema CAP y consistencia fuerte.** Gilbert y Lynch (2002) demostraron que, ante particiones de red, no cabe garantizar consistencia y disponibilidad a la vez; Kleppmann (2017) matiza que su modelo de fallo es estrecho. De ahí la decisión pertinente: como el aislamiento exige **consistencia fuerte** —una lectura no puede devolver datos de una membresía revocada— y el volumen esperado no justifica un almacén distribuido, se adopta un motor relacional único, y la escalabilidad se obtiene en la capa de cómputo, que sí es sin estado.

**Sistemas de tipos.** Pierce (2002) define un sistema de tipos como método sintáctico tratable para demostrar la ausencia de ciertos comportamientos erróneos: verificación formal ligera previa a la ejecución. Gao et al. (2017) acotan empíricamente su beneficio —cerca del **15 %** de los errores públicos de proyectos JavaScript habría sido detectado por un verificador estático como TypeScript—, lo que fundamenta la elección de lenguaje y a la vez delimita su alcance.

#### 7.2.3 Teorías de frontend — cómo interactúa el usuario

**De las responsabilidades a los componentes.** Krasner y Pope (1988) formularon el paradigma Modelo-Vista-Controlador, cuyo aporte permanente es separar el estado del dominio, su presentación y la gestión de la interacción. Las interfaces web actuales conservan el principio pero cambian la unidad de descomposición: **componentes** que encapsulan estado y presentación con flujo de datos unidireccional (Meta Open Source, s. f.). Nielsen (1993) aporta el criterio de percepción —**0,1 s** para sentir una acción instantánea, **1 s** para no romper el flujo de pensamiento, **10 s** como límite de la atención—, que el proyecto declara como criterio de diseño y **no** como objetivo medido (§19.3); y la opción de aplicación web instalable frente a aplicaciones nativas se apoya en el manifiesto de aplicación web (W3C, 2026).

**Evaluación de usabilidad con muestras pequeñas.** Nielsen y Landauer (1993) modelaron el hallazgo de problemas de usabilidad y mostraron que la detección sigue una **curva de rendimientos decrecientes**. La consecuencia debe enunciarse con precisión: una muestra pequeña es adecuada **para detectar problemas**, que es el objetivo aquí, e insuficiente **para estimar un parámetro poblacional**, que no se pretende (§16.5). La satisfacción se mide con la escala de usabilidad del sistema, formulada por Brooke (1996) y cuyo baremo de interpretación estableció Bangor et al. (2008) sobre casi tres mil aplicaciones del instrumento; de ahí el umbral de **68 puntos**.

#### 7.2.4 Modelos de seguridad — cómo se protege la información

Cuatro de los principios de Saltzer y Schroeder (1975) gobiernan decisiones directas de este sistema:

| Principio | Enunciado | Materialización en el proyecto |
|---|---|---|
| **Mediación completa** | Todo acceso a todo objeto debe ser verificado | Las políticas se evalúan en el motor: ninguna consulta, provenga de donde provenga, elude la verificación |
| **Valores por defecto seguros** | La decisión predeterminada es denegar | Sin membresía activa no hay acceso; si falta la cabecera de contexto, la petición se rechaza en vez de asumir un valor |
| **Mínimo privilegio** | Cada sujeto opera con los permisos mínimos necesarios | El rol se otorga por organización y las operaciones administrativas se reservan al propietario |
| **Economía del mecanismo** | La protección debe ser lo bastante simple para inspeccionarse | Un **único** criterio de aislamiento en todas las tablas, incluidas las de nivel taller |

El cuarto explica una decisión que de otro modo parecería una simplificación: modelar el taller como segunda frontera de seguridad habría duplicado la complejidad de las políticas, y un mecanismo de protección que no puede inspeccionarse con confianza deja de proteger.

**Roles y confianza cero.** Sandhu et al. (1996) formalizaron el modelo en que los permisos se asignan a roles y los usuarios los adquieren por pertenencia, con el concepto de **sesión** en que se activa un subconjunto de ellos; el proyecto aplica RBAC plano con una particularidad derivada del modelo multiorganización —**el rol no es un atributo global del usuario, sino de la relación usuario-organización**— y la «sesión» se corresponde con el contexto activo enviado en cada petición. Rose et al. (2020) eliminan además la confianza implícita basada en la ubicación de red: cada solicitud se autentica y autoriza individualmente, de modo que la interfaz **no confía en el cliente** aunque la credencial sea válida y vuelve a verificar membresía y rol en cada operación.

**Defensa en profundidad.** La redundancia de controles independientes no es doctrinal: Dar et al. (2023) demostraron que RLS, pese a impedir la devolución de datos no autorizados, filtra información por el **tiempo de ejecución** de la consulta, y la serie CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976 evidencia fallos recurrentes del mecanismo en producción (§6.3). Confiar el aislamiento a una sola capa es, a la luz de esa evidencia, insostenible.

#### 7.2.5 Metodología de desarrollo — el proceso de trabajo

Larman y Basili (2003) documentan que la ventaja del desarrollo iterativo frente al modelo en cascada reside en obtener retroalimentación verificable antes de comprometer la totalidad del esfuerzo; el proyecto adopta iteraciones de dos semanas cerradas con software ejecutable y verificado. Scrum, en cambio, define roles y eventos concebidos para coordinar un equipo (Schwaber & Sutherland, 2020): en un proyecto de un solo desarrollador esas ceremonias carecen de contraparte, por lo que se conserva únicamente lo que aporta valor en contexto individual —iteración corta, incremento demostrable y definición de terminado explícita—. Sobre esa base, Humble y Farley (2010) establecen que automatizar compilación, prueba y despliegue reduce el riesgo de la entrega al volverla rutinaria y repetible, y Forsgren et al. (2018) lo validan empíricamente sobre miles de organizaciones. Beck (2002) añade el orden de escritura: la prueba antes que el código, para que actúe como especificación ejecutable — principio que el proyecto aplica donde más importa, escribiendo las **pruebas de aislamiento antes** que la funcionalidad que protegen.

### 7.3 Revisión crítica de la literatura

Ninguna teoría se acepta como verdad absoluta. De cada una se consigna su limitación documentada y la adaptación que impone el contexto real: una organización pequeña boliviana, con presupuesto de tecnología reducido (§5) y un único desarrollador.

| Teoría o modelo | Limitación documentada | Adaptación adoptada |
|---|---|---|
| **Serverless** (Jonas et al., 2019) | Arranque en frío, ausencia de estado entre invocaciones y dependencia del proveedor, señalados por los propios autores | Se asume el arranque en frío —uso interno, sin latencia estricta— y la dependencia se mitiga aislando el acceso al proveedor: el aislamiento reside en el motor, no en él |
| **Row-Level Security** (PostgreSQL GDG, s. f.-b) | Fuga por canal lateral temporal (Dar et al., 2023) y fallos recurrentes de aplicación de políticas (serie de CVE) | No se usa como único control: se refuerza con verificación de membresía en la aplicación. El canal lateral se declara amenaza conocida, fuera del alcance de mitigación |
| **Esquema compartido** (Krebs et al., 2012) | La conciencia de inquilino se dispersa por la base de código y degrada la mantenibilidad (Bezemer & Zaidman, 2010) | Se elige igualmente: una base por inquilino impone costo fijo por organización, incompatible con el mercado. La dispersión se contiene concentrando la regla en el motor y en un punto único de verificación |
| **Microservicios** (Newman, 2021) | Complejidad operativa que el propio autor desaconseja asumir sin una organización que la sostenga | Se descartan pese a que el comparable más cercano (Andriianenko, 2026) los emplea: se adopta una aplicación modular desplegada como funciones |
| **Confianza cero** (Rose et al., 2020) | Supone una arquitectura empresarial completa —motor de políticas, telemetría continua— inviable a esta escala | Se adopta el **principio**, no la arquitectura: verificación explícita en cada petición y ningún contexto asumido por defecto |
| **Tipado estático** (Pierce, 2002; Gao et al., 2017) | El beneficio medido ronda el **15 %** de los errores detectables; no verifica reglas de negocio | Se combina obligatoriamente con la suite de pruebas: primera barrera, no garantía de corrección |
| **Multi-tenancy jerárquica** (Simić et al., 2024) | Su jerarquía organiza recursos de infraestructura y no resuelve el reparto de entidades de negocio entre niveles | Se retiene el principio —el aislamiento se sostiene entre niveles— trasladándolo a la capa de datos, con el reparto como decisión de diseño explícita |
| **Muestras pequeñas** (Nielsen & Landauer, 1993) | Vale para detectar problemas, no para estimar parámetros poblacionales | Se adopta el tamaño de 5 a 8 participantes declarando qué **no** permite concluir (§16.5) |

**Sobre la viabilidad en el contexto boliviano.** La literatura de arquitectura asume condiciones —despliegue multirregión, equipos de plataforma, presupuesto de observabilidad— que no se sostienen en un sector con 84,2 % de informalidad laboral (§5). Criticar la teoría, aquí, consiste en **retener el principio y descartar la implantación** cuando esta excede los medios disponibles.

### 7.4 Alineación metodológica

**El hilo conductor.** Si el antecedente describe un riesgo de fuga de datos y el problema busca cómo evitarlo, el marco teórico debe consistir en modelos de aislamiento y control de acceso — y en nada más.

| Antecedente (§5) | Problema (§2) | Teoría que lo sustenta (§7.2) | Artefacto del proyecto |
|---|---|---|---|
| Operadores que abren más de un local | Pérdida de la visión consolidada del cliente entre talleres | Modelos de multi-tenancy (Krebs et al., 2012) | Jerarquía organización → talleres con alcance por nivel |
| Aislamiento resuelto solo en el código en las soluciones relevadas | Riesgo de fuga entre organizaciones ante un solo error de programación | Mediación completa y valores por defecto seguros (Saltzer & Schroeder, 1975); RBAC (Sandhu et al., 1996) | Políticas a nivel de fila más verificación de membresía |
| Fallos documentados del mecanismo en producción | Insuficiencia de una única capa de control | Defensa en profundidad; Dar et al. (2023) y serie de CVE | Aislamiento en dos capas independientes |
| Alta informalidad y bajo presupuesto de tecnología | Barrera de costo de la infraestructura tradicional | Serverless y escalado a cero (Jonas et al., 2019) | Despliegue en funciones serverless sin costo fijo |
| Ausencia de plataforma con visión consolidada | Operar varias organizaciones desde una cuenta | Ausencia de estado del estilo REST (Fielding, 2000) | Contexto activo declarado por petición y validado |
| Operadores sin formación previa en la herramienta | Que la jerarquía resulte comprensible para quien la opera | Muestras pequeñas (Nielsen & Landauer, 1993); satisfacción (Bangor et al., 2008) | Evaluación de usabilidad del cambio de contexto |
| — | Verificar que la separación se cumple | Pruebas como especificación previa (Beck, 2002); integración continua (Humble & Farley, 2010; Forsgren et al., 2018) | Suite de aislamiento por dos vías y pipeline automatizado |

**Auditoría de pertinencia.** La prueba aplicada a cada tema fue la misma —si explicarlo no ayuda a resolver el problema de §2, se excluye—, y por ella quedaron fuera la arquitectura de microservicios en profundidad (solo figura como alternativa descartada en §7.3), el aprendizaje automático, la cadena de bloques —la trazabilidad se resuelve con historial inmutable en una tabla de solo inserción—, la teoría de colas y el modelado de rendimiento —las pruebas de carga están excluidas del alcance (§19.3)—, la criptografía aplicada —la gestión de credenciales está delegada en el proveedor de identidad— y la interoperabilidad con la facturación electrónica del SIN.

---

## 8. Objetivo general

> **Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (organización → talleres) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias organizaciones de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos.**

---

## 9. Objetivos específicos

Cuatro objetivos secuenciales, uno por fase —**Analizar → Diseñar → Implementar → Validar**—, cada uno correlativo a una pregunta específica y cerrado con un entregable verificable.

| # | Objetivo específico | Entregable verificable |
|---|---|---|
| 1 | **Analizar** las estrategias de aislamiento multi-tenant documentadas en la literatura —base por inquilino, esquema por inquilino y esquema compartido con seguridad a nivel de fila— y las soluciones de gestión de talleres con presencia en Bolivia, para fundamentar la selección arquitectónica e identificar el vacío que justifica el proyecto | Matriz de extracción del estado del arte · análisis del mercado con el vacío identificado |
| 2 | **Diseñar** el modelo de datos de la jerarquía organización → talleres —con el alcance de cada entidad según su nivel y las restricciones de integridad que de él se derivan— y **especificar** las políticas de seguridad a nivel de fila, junto con las funciones auxiliares de verificación de membresía, que sostienen un único límite de aislamiento | Modelo entidad-relación con alcance por nivel · contrato de la interfaz de programación · migración con políticas y funciones de verificación |
| 3 | **Implementar** sobre infraestructura serverless la capa de identidad, la jerarquía organizacional y el control de acceso por rol, junto con el corte vertical que demuestra el alcance diferenciado de datos —clientes (nivel organización) e inventario (nivel taller)—, y **automatizar** un pipeline de integración continua | Sistema con registro, organizaciones, talleres, miembros, clientes e inventario operativos · pipeline en verde en cada integración |
| 4 | **Validar** el aislamiento mediante pruebas automatizadas que comprueben, tanto por la interfaz de programación como por acceso directo a la base de datos, que una organización no puede acceder a datos de otra aun cuando la capa de aplicación omita sus controles, y **evaluar** con operadores del rubro la usabilidad del cambio de contexto entre organizaciones y talleres | Suite de pruebas de aislamiento con su matriz requisito → caso → evidencia, reproducible desde una base vacía · informe de evaluación de usabilidad con tasa de éxito por tarea y puntuación SUS |

---

## 10. Hipótesis

Por tratarse de una investigación explicativa que propone aplicar una arquitectura determinada para mejorar una propiedad medible del sistema, corresponde formular hipótesis. Se enuncia como **afirmación factual** —no como promesa futura—, de modo que quede sujeta a comprobación o refutación empírica.

### 10.1 Hipótesis de investigación (H1)

> **La implementación de una arquitectura multi-tenant jerárquica —que sitúa el límite de aislamiento en la organización y trata el taller como criterio de alcance operativo, con políticas de seguridad a nivel de fila reforzadas por verificación de membresía en la capa de aplicación— eliminó el acceso cruzado de datos entre organizaciones, reduciendo a cero (0) las filas ajenas devueltas, y sostuvo esa separación aun con la verificación de la capa de aplicación deshabilitada.**

### 10.2 Hipótesis nula (H0)

> La arquitectura propuesta no produce una mejora medible del aislamiento: al menos una consulta ejecutada con la identidad de una cuenta ajena devuelve filas de otra organización, o la separación deja de sostenerse cuando la capa de aplicación omite sus controles.

### 10.3 Criterio de decisión

La H0 se rechaza únicamente si **todas** las condiciones siguientes se cumplen de forma reproducible: cero filas ajenas devueltas por acceso directo a la base de datos en la totalidad de las tablas de negocio, respuesta de autorización correcta en el 100 % de las operaciones evaluadas, y persistencia de ambos resultados con la verificación de la capa de aplicación deshabilitada. Un solo caso en contrario sostiene la H0.

---

## 11. Variables/categorías de investigación

| Tipo | Variable | Definición conceptual |
|---|---|---|
| **Independiente** (causa) | **Arquitectura multi-tenant jerárquica con aislamiento en dos capas** | Modelo de organización de datos que sitúa el límite de aislamiento en la organización y el taller como subdivisión operativa, con políticas de seguridad a nivel de fila en el motor de base de datos reforzadas por verificación de membresía en la capa de aplicación |
| **Dependiente** (efecto) | **Separación verificable de datos entre organizaciones** | Grado en que los datos de una organización resultan inaccesibles para cuentas sin membresía activa en ella, comprobable por vías independientes y con independencia de que la capa de aplicación aplique o no sus controles |
| **Dependiente** (efecto) | **Gestión centralizada** | Capacidad de administrar varias organizaciones y talleres desde una sola cuenta conservando la visión consolidada del cliente y su historial |
| **Dependiente** (efecto) | **Usabilidad del cambio de contexto** | Grado en que un operador del rubro, sin formación previa, logra situarse en la organización y el taller correctas y percibir el alcance de los datos que está viendo |
| **Interviniente** | Modelo de despliegue serverless | Condición de ejecución que impone ausencia de estado entre peticiones y costo proporcional al uso; no se manipula, se mantiene constante |

---

## 12. Operacionalización de variables

### 12.1 Variable dependiente: Separación verificable de datos entre organizaciones

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Aislamiento en el motor de base de datos** | • Filas ajenas devueltas por consulta directa (cantidad, entero)<br>• Tablas de negocio con políticas de seguridad a nivel de fila activas (porcentaje %) | • Suite de pruebas de aislamiento (Vitest)<br>• Cliente PostgreSQL autenticado con la identidad de otra cuenta |
| **Aislamiento en la capa de aplicación** | • Operaciones con respuesta de autorización correcta (porcentaje %)<br>• Respuestas que respetan la regla de no divulgación —mismo error para recurso ajeno e inexistente— (porcentaje %) | • Pruebas de contrato HTTP (Vitest)<br>• Cliente HTTP sobre la interfaz de programación |
| **Independencia entre capas (defensa en profundidad)** | • Casos de aislamiento en verde con la verificación de la aplicación deshabilitada (porcentaje %)<br>• Vías independientes de verificación ejecutadas (cantidad, entero) | • Ejecución de la suite con la verificación de membresía desactivada deliberadamente |

### 12.2 Variable dependiente: Gestión centralizada

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Alcance de datos por nivel** | • Entidades de nivel organización accesibles desde cualquier taller (porcentaje %)<br>• Entidades de nivel taller visibles fuera de su taller (cantidad; esperado 0) | • Casos de prueba de alcance por nivel (Vitest) |
| **Cambio de contexto** | • Organizaciones administrables por cuenta (cantidad, entero)<br>• Operaciones que exigen reautenticación al cambiar de contexto (cantidad; esperado 0) | • Pruebas de integración sobre el cambio de organización y taller activos |

### 12.3 Variable dependiente: Usabilidad del cambio de contexto

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Eficacia** | • Tasa de éxito por tarea (porcentaje %; umbral ≥ 80 %)<br>• Tareas completadas sin asistencia (cantidad sobre 3) | • Observación estructurada de tarea guiada<br>• Guion de tareas T1–T3 |
| **Eficiencia** | • Tiempo por tarea (segundos)<br>• Errores por tarea (cantidad) | • Cronometraje de la sesión<br>• Registro de incidencias |
| **Satisfacción** | • Puntuación SUS (escala 0 a 100; umbral ≥ 68, promedio de la industria) | • Cuestionario System Usability Scale (Brooke, 1996), interpretado con el baremo de Bangor et al. (2008) |

Los indicadores de eficiencia se reportan **sin umbral**: con una muestra dimensionada para detectar problemas no procede afirmar significancia estadística sobre tiempos ni sobre recuentos de error.

### 12.4 Variable independiente: Arquitectura multi-tenant jerárquica

| Dimensión | Indicadores (unidad de medida) | Instrumento / herramienta |
|---|---|---|
| **Jerarquía organizacional** | • Niveles jerárquicos modelados (cantidad; esperado 2)<br>• Límites de aislamiento definidos (cantidad; esperado 1)<br>• Tablas de negocio que portan el identificador de organización (porcentaje %) | • Modelo entidad-relación<br>• Migraciones versionadas del esquema |
| **Control de acceso** | • Roles definidos por organización (cantidad; esperado 3)<br>• Funciones de verificación de membresía (cantidad; esperado 2) | • Revisión del esquema y de las políticas declaradas |
| **Automatización de la verificación** | • Errores de verificación estática de tipos (cantidad; esperado 0)<br>• Integraciones con pipeline en verde (porcentaje %) | • Verificador de tipos de TypeScript<br>• Registro de ejecuciones de integración continua |

---

## 13. Matriz de consistencia

| Pregunta / problema | Objetivo general | Objetivos específicos | Hipótesis | Variables, indicadores y metodología (población, muestra e instrumentos) |
|---|---|---|---|---|
| **General:** ¿De qué manera una arquitectura multi-tenant jerárquica sobre infraestructura serverless, con aislamiento mediante seguridad a nivel de fila, mejora la gestión centralizada y la seguridad de los datos de operadores de varias organizaciones y talleres de servicio de motocicletas en Bolivia?<br><br>**Específicas:**<br>1. ¿Qué estrategias documenta la literatura y qué carencias presenta la oferta boliviana?<br>2. ¿Qué modelo de datos y qué políticas sostienen un único límite de aislamiento?<br>3. ¿Cómo se implementan identidad, jerarquía y control de acceso por rol con verificación automatizada?<br>4. ¿Cómo se comprueba el aislamiento aun ante fallos de la capa de aplicación, y que el cambio de contexto resulta usable? | Diseñar, implementar y validar una arquitectura multi-tenant jerárquica (organización → talleres) sobre infraestructura serverless, que aplique el aislamiento de datos en el motor de base de datos mediante seguridad a nivel de fila, para permitir la gestión centralizada de varias organizaciones de servicio de motocicletas en Bolivia garantizando la separación verificable de sus datos. | 1. **Analizar** las estrategias de aislamiento multi-tenant de la literatura y las soluciones con presencia en Bolivia.<br><br>2. **Diseñar y especificar** el modelo de datos de la jerarquía organización → talleres y las políticas de seguridad a nivel de fila.<br><br>3. **Implementar y automatizar** la identidad, la jerarquía y el control de acceso por rol, con el corte vertical de clientes e inventario y un pipeline de integración continua.<br><br>4. **Validar** el aislamiento con pruebas por interfaz de programación y por acceso directo a la base de datos, y **evaluar** la usabilidad del cambio de contexto con operadores del rubro. | La implementación de una arquitectura multi-tenant jerárquica, con políticas de seguridad a nivel de fila reforzadas por verificación de membresía en la capa de aplicación, eliminó el acceso cruzado de datos entre organizaciones: redujo a cero (0) las filas ajenas devueltas y sostuvo la separación aun con la verificación de la capa de aplicación deshabilitada. | **VARIABLES**<br>*Independiente:* arquitectura multi-tenant jerárquica con aislamiento en dos capas —seguridad a nivel de fila reforzada por verificación de membresía—.<br>*Dependientes:* separación verificable de datos entre organizaciones · gestión centralizada · usabilidad del cambio de contexto.<br><br>**INDICADORES**<br>• Filas ajenas devueltas por acceso directo a la base de datos: **0**<br>• Tablas de negocio con políticas de seguridad a nivel de fila activas: **100 % (7 de 7)**<br>• Operaciones con respuesta de autorización correcta: **100 %**<br>• Casos de aislamiento en verde con la verificación de la capa de aplicación deshabilitada: **100 %**<br>• Vías independientes de verificación: **2**<br>• Tasa de éxito por tarea: **≥ 80 %**<br>• Puntuación SUS: **≥ 68**<br><br>**POBLACIÓN**<br>**a) Documental** *(obj. 1)*: publicaciones revisadas por pares sobre aislamiento entre inquilinos en esquema compartido, 2021–2026.<br>**b) De mercado** *(obj. 1)*: plataformas de gestión de talleres con presencia, uso o comercialización en Bolivia.<br>**c) Técnica** *(obj. 2, 3 y 4 — es donde se mide la variable dependiente)*: las **tablas de negocio** del esquema y las **operaciones** expuestas por la interfaz de programación del sistema construido. **No son personas: son datos y operaciones.**<br>**d) De operadores** *(obj. 4 — usabilidad)*: operadores de organizaciones de servicio de motocicletas en Bolivia que administran más de una organización y/o más de un taller. Única población compuesta por personas.<br><br>**MUESTRA**<br>**a)** 5 fuentes — no probabilístico **por criterio**; suficiencia por saturación temática.<br>**b)** 10 plataformas — no probabilístico **intencional**, por accesibilidad de la información pública del producto.<br>**c) Censo: el 100 % de la población** — 7 tablas de negocio y la totalidad de las operaciones del contrato, ejercidas sobre un escenario de 3 cuentas sintéticas, 3 organizaciones y 3 talleres. Muestreo **no probabilístico intencional por caso crítico**: se ejerce el peor escenario de aislamiento —una cuenta sin membresía alguna y una cuenta de otra organización consultando datos ajenos, con y sin la capa de aplicación activa—, no el uso nominal. **No cabe muestreo probabilístico**: una sola tabla sin política activa constituye una fuga, y una muestra parcial podría declarar seguro un sistema que no lo es.<br>**d)** De 5 a 8 participantes — no probabilístico **intencional** por perfil; tamaño justificado por Nielsen y Landauer (1993).<br><br>**ENFOQUE Y TIPO**<br>Investigación **aplicada**, de enfoque **mixto**, alcance descriptivo → propositivo → explicativo, método **hipotético-deductivo** y diseño **experimental sobre caso único** (§14, §15).<br><br>**INSTRUMENTOS**<br>• **Suite automatizada de pruebas (Vitest)**, niveles N1 a N4, ejecutada sobre una base reconstruida desde las migraciones versionadas — recolecta los indicadores de aislamiento.<br>• **Cliente PostgreSQL autenticado con la identidad de otra cuenta**: vía 2, consulta directa al motor sin pasar por la interfaz de programación.<br>• **Cliente HTTP de contrato** sobre la interfaz de programación: vía 1.<br>• **Banco de pruebas con la verificación de membresía sustituida** por versiones permisivas: condición C2, que aísla el aporte de la capa del motor.<br>• **Pipeline de integración continua (GitHub Actions)**: verificación estática de tipos y ejecución de la suite en cada integración.<br>• **Guion de tareas T1–T3** con observación estructurada, cronometraje y registro de incidencias.<br>• **Cuestionario System Usability Scale** (Brooke, 1996), interpretado con el baremo de Bangor et al. (2008).<br>• **Matriz de extracción bibliográfica** y **matriz comparativa de capacidades** del mercado. |

---

## 14. Enfoque y tipo de investigación

Las categorías empleadas —tipo, enfoque, alcance y método— siguen la clasificación de Hernández-Sampieri y Mendoza (2018).

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
| **Tareas** | T1 cambiar de organización y confirmar los datos mostrados · T2 seleccionar taller y registrar en él un repuesto · T3 localizar un cliente registrado en otro taller de la misma organización |
| **Métricas** | Tasa de éxito por tarea (≥ 80 %), tiempo y errores por tarea (descriptivos), y puntuación SUS (≥ 68) |
| **Por qué estas tres tareas** | Cada una ejercita una consecuencia distinta de la jerarquía: el nivel organización, el nivel taller y el beneficio de que el cliente pertenezca a la organización y no al local. No se evalúa la interfaz en general |

El componente de usabilidad **no forma parte de la hipótesis**: la afirmación sujeta a refutación es la del aislamiento (§10). La usabilidad se reporta como evidencia complementaria del objetivo 4, con sus umbrales declarados de antemano, y un resultado por debajo de ellos constituye un hallazgo que se discute, no un fallo de la tesis.


### 15.4 Escenario de laboratorio

```
Cuenta A ──owner──> Organización 1 ──> Taller 1.1 (repuestos propios)
                        │         └── Taller 1.2 (repuestos propios)
                        └── clientes de la Organización 1

Cuenta A ──owner──> Organización 2          (misma cuenta, otra organización)

Cuenta B ──owner──> Organización 3 ──> Taller 3.1 · clientes propios

Cuenta C  ── sin membresía en ninguna de las anteriores
```

Un solo montaje cubre las tres preguntas del aislamiento: **entre cuentas** (A frente a B), **entre organizaciones de la misma cuenta** (Organización 1 frente a Organización 2) y **frente a quien no es miembro de ninguna** (Cuenta C).

### 15.5 Secuencia del experimento

Lo que sigue es la **lógica** del experimento —qué se manipula y en qué orden—; el procedimiento operativo con que se recolecta cada dato está en §17.1, y no se repite aquí.

1. Construcción del escenario base (§15.4) por la propia prueba, desde una base vacía reconstruida con las migraciones versionadas.
2. Ejecución de los casos bajo la condición **C1** y registro de resultados.
3. Repetición bajo **C2** y **C3**, manipulando **una sola condición por vez**, de modo que el efecto observado sea atribuible a la capa desactivada y no a otro factor.
4. Repetición del ciclo completo **tres veces**, en momentos distintos y sobre entornos reconstruidos (*test–retest*): una sola ejecución no distingue entre «el aislamiento se sostiene» y «esta vez se sostuvo».
5. Contraste de los resultados contra el criterio de decisión de la hipótesis (§10.3).
6. Conservación de la evidencia: guion de construcción, salida de la ejecución e identificador de la migración aplicada.

### 15.6 Validez y limitaciones del diseño

| Aspecto | Tratamiento |
|---|---|
| **Validez interna** | El resultado de cada caso es binario y objetivo —pasa o no pasa—, sin interpretación del investigador. Las condiciones se manipulan una a la vez |
| **Fiabilidad** | La suite es automatizada y reproducible desde una base vacía; una segunda persona puede repetirla y obtener el mismo resultado |
| **Validez externa** | Limitada: los resultados se obtienen en un entorno de desarrollo, no productivo, y con un número reducido de inquilinos. No se generaliza el comportamiento bajo carga |
| **Limitación declarada** | No se prueba la fuga por canal lateral temporal documentada por Dar et al. (2023): el aislamiento verificado es el de **contenido** —qué filas se devuelven—, no el de metadatos inferibles por tiempo de ejecución |

---

## 16. Población y muestra

El proyecto trabaja con **cuatro poblaciones diferenciadas**, porque combina revisión documental, relevamiento de mercado, validación técnica y evaluación con operadores. Cada una se declara con su muestra, su tipo de muestreo y la razón del tamaño elegido.

La distinción que ordena el conjunto: la población sobre la que se mide la variable dependiente **no son personas, son datos y operaciones** (§16.3). Las personas intervienen en una sola de las cuatro, y solo para la evidencia complementaria de usabilidad (§16.4).

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
| **Muestra** | **10 plataformas** relevadas: 4 con presencia o uso directo en Bolivia, 2 regionales de uso extendido en el país y 4 referentes internacionales tomados como estándar de funcionalidades |
| **Tipo de muestreo** | No probabilístico **intencional**, por accesibilidad de la información pública del producto |
| **Criterio de inclusión** | Solo plataformas del **mismo objetivo** —gestión de la operación de talleres—; se excluye el software administrativo o contable de propósito general. Los comparadores y directorios de mercado se emplean como **fuente de relevamiento** y no se cuentan como plataformas ([Análisis del mercado](../ingenieria/09-analisis-mercado.md)) |

### 16.3 Población técnica: unidades de análisis *(objetivos 2, 3 y 4)*

Es la población sobre la que se mide la variable dependiente.

| Elemento | Definición |
|---|---|
| **Población** | Las **tablas de negocio** del esquema de datos y las **operaciones** expuestas por la interfaz de programación del sistema construido |
| **Muestra** | **Censo — el 100 % de la población.** Se evalúan las 7 tablas de negocio (clientes, talleres, membresías, asignaciones, repuestos, movimientos de existencias y registro de auditoría) y la totalidad de las operaciones del contrato |
| **Tipo de muestreo** | No probabilístico **intencional por caso crítico**. El censo fija *qué* se evalúa; el caso crítico, *bajo qué condición*: se ejerce el **peor escenario de aislamiento** —una cuenta sin membresía alguna y una cuenta de otra organización consultando datos ajenos, con la capa de aplicación activa y desactivada—, no el uso nominal. Probar que el sistema aísla cuando nadie lo ataca no demuestra nada |
| **Justificación de no muestrear** | En validación de aislamiento **no cabe el muestreo probabilístico**: una sola tabla sin política activa constituye una fuga, y una muestra parcial podría declarar seguro un sistema que no lo es. La cobertura total es condición del objetivo 4, no una decisión de conveniencia |
| **Sujetos de prueba** | **3 cuentas sintéticas**, 3 organizaciones y 3 talleres, generadas por la propia prueba con identificadores irrepetibles. En esta población **no intervienen personas**: los datos son generados, no reales |

### 16.4 Población de operadores *(objetivo 4 — evaluación de usabilidad)*

Es la única población compuesta por **personas**. No es, sin embargo, la única que impone compromisos éticos: el §18 declara cinco, y solo uno de ellos trata de participantes humanos.

| Elemento | Definición |
|---|---|
| **Población** | Operadores de organizaciones de servicio de motocicletas en Bolivia que administran —o planean administrar— más de una organización y/o más de un taller: exactamente el perfil que padece el problema descrito en §2 |
| **Muestra** | **De 5 a 8 participantes** |
| **Tipo de muestreo** | No probabilístico **intencional**, por criterio de perfil |
| **Justificación del tamaño** | Nielsen y Landauer (1993) modelan matemáticamente el hallazgo de problemas de usabilidad y muestran que la curva de detección se satura pronto: cinco participantes descubren la mayoría de los problemas de una interfaz, y cada participante adicional aporta cada vez menos. El objetivo es **detectar problemas de uso**, no estimar un parámetro poblacional; por eso ampliar la muestra no mejoraría la conclusión en proporción al esfuerzo |
| **Criterio de exclusión** | Haber participado en el desarrollo o conocer la aplicación antes de la sesión |
| **Consideraciones éticas** | Consentimiento informado previo, anonimización con participantes identificados como P1…P8 y confidencialidad de sus organizaciones. Los cuatro compromisos, con su alcance exacto, están en **§18.3** |

### 16.5 Sobre el alcance de esta muestra

Conviene declarar qué **no** permite concluir. La muestra de operadores está dimensionada para detectar problemas de uso, no para sostener inferencia estadística: no se afirma representatividad del sector boliviano ni significancia sobre tiempos o puntuaciones. La caracterización del sector sigue apoyándose en fuentes estadísticas oficiales del INE (§5), no en esta muestra.

Tampoco se evalúa la interfaz completa: la evaluación se acota al **cambio de contexto entre organizaciones y talleres**, por ser la manifestación visible del aporte de la tesis. Las demás pantallas no se someten a prueba con usuarios.

---

## 17. Procedimientos de recolección y análisis de datos

Los indicadores declarados en §12 no se recogen preguntando a nadie: se obtienen **ejecutando el instrumento sobre el artefacto** y exportando su salida a un formato auditable. El procedimiento se declara aquí de forma exacta porque un resultado cuyo modo de obtención no consta no es verificable por un tercero, y la reproducibilidad es condición del objetivo 4.

**Los instrumentos y su configuración.** Un instrumento no queda declarado por su nombre sino por **cómo se ejecuta**: qué indicador recoge, con qué parámetros y cómo se procesa su salida. Decir «se usará Vitest» no permite a un tercero repetir nada.

| Instrumento | Qué indicador recoge | Configuración con la que se ejecuta |
|---|---|---|
| **Suite automatizada (Vitest)**, niveles N1 a N4 | Casos en verde, filas ajenas devueltas, códigos de respuesta | Base reconstruida desde las migraciones versionadas; escenario de 3 cuentas, 3 organizaciones y 3 talleres creado por la propia prueba; una condición experimental por ejecución; salida conservada por caso |
| **Cliente PostgreSQL con la identidad de otra cuenta** | Filas ajenas devueltas por consulta directa | Conexión autenticada como la cuenta B, **sin pasar por la interfaz de programación**; una consulta por cada una de las 7 tablas de negocio; se registra el recuento, no solo el éxito |
| **Cliente HTTP de contrato** | Operaciones con respuesta de autorización correcta | Recorrido de la totalidad de las operaciones del contrato con contexto ajeno declarado y sin declarar; se contrasta estado y código `modulo.razon` contra el esperado |
| **Banco de pruebas con la verificación de membresía sustituida** | Casos en verde bajo la condición C2 | Las funciones de verificación se reemplazan por versiones que conceden sin comprobar, **solo en el banco de pruebas**; el resto del sistema queda intacto |
| **Pipeline de integración continua** | Integraciones en verde, errores de tipos | Verificación estática y ejecución de la suite en cada integración al ramal principal; un fallo bloquea la incorporación |
| **Guion de tareas T1–T3** | Éxito, tiempo y errores por tarea | Sesión individual sobre la aplicación desplegada, datos precargados, sin asistencia; la intervención del observador se anota como fallo |
| **Cuestionario SUS** (Brooke, 1996) | Puntuación de satisfacción | Diez ítems al terminar la sesión; puntuación calculada por participante y media del grupo, contra el baremo de Bangor et al. (2008) |

### 17.1 Recolección de los datos de aislamiento *(objetivos 2, 3 y 4)*

| Fase | Qué se hace | Qué produce |
|---|---|---|
| **1 · Preparar el entorno** | Proyecto de base de datos **dedicado y desechable**, reconstruido desde cero aplicando en orden las migraciones versionadas. Sin datos preexistentes de ninguna clase | Esquema en estado conocido e identificador de la última migración aplicada |
| **2 · Construir el escenario** | La propia prueba crea las tres cuentas, las tres organizaciones y los tres talleres de §15.4, con correos irrepetibles por ejecución sobre un dominio reservado de pruebas | Escenario base reproducible, independiente del orden de los casos |
| **3 · Ejecutar** | Se corre la suite completa bajo las condiciones C1, C2 y C3 (§15.2), **una condición por vez** | Resultado binario por caso, con su código de respuesta y el recuento de filas devueltas |
| **4 · Extraer la evidencia** | Se conservan la salida del ejecutor de pruebas, el guion de construcción del escenario y la versión del esquema contra la que se ejecutó | Registro auditable de la ejecución |
| **5 · Repetir** | Tres ejecuciones independientes del ciclo completo, en momentos distintos y sobre entornos reconstruidos (*test–retest*) | Confirmación de que el resultado no depende de una ejecución particular |

**Condiciones que hacen limpia la recolección.** No se recolecta sobre el equipo de desarrollo con procesos de fondo compitiendo por recursos, sino sobre un entorno gestionado dedicado exclusivamente a la prueba; los datos son generados por la propia prueba y **nunca provienen de una instalación productiva**; y un caso omitido por falta de credenciales del entorno se reporta como **omitido**, no como pasado ([Plan de pruebas](../ingenieria/11-plan-pruebas.md) §6.2).

### 17.2 Recolección de los datos de usabilidad *(objetivo 4)*

Sesión individual sobre la aplicación desplegada, con el escenario de datos ya cargado —el participante no lo construye—. El orden es fijo: explicación del propósito y firma del consentimiento informado, ejecución de T1, T2 y T3 sin asistencia, cuestionario SUS y comentario abierto sobre qué resultó confuso. Se registra, por participante: éxito o fallo de cada tarea, tiempo, incidencias y las diez respuestas del cuestionario. Una intervención del observador se anota como **fallo** de la tarea, no como éxito asistido.

### 17.3 Análisis de los datos

El proyecto analiza **dos clases de datos de naturaleza distinta**, y las trata con procedimientos distintos.

| Indicador | Dato crudo recolectado | Tratamiento | Resultado que se reporta |
|---|---|---|---|
| Filas ajenas devueltas | Recuento de filas por consulta, tabla por tabla | Verificación de igualdad a cero en el censo de 7 tablas | Cero filas ajenas en las 7 tablas, o la tabla exacta donde se produjo la fuga |
| Tablas con políticas activas | Estado de la seguridad a nivel de fila por tabla | Porcentaje sobre el censo de 7 | Cobertura alcanzada, con el detalle de la tabla que faltara |
| Operaciones con autorización correcta | Código de estado y código de negocio de cada respuesta | Contraste uno a uno contra el contrato esperado | Porcentaje de coincidencia y lista de discrepancias |
| Casos en verde sin la capa de aplicación | Resultado por caso bajo C2 | Comparación C1 · C2 · C3 | Si el aislamiento se sostiene por sí solo en el motor |
| Tasa de éxito por tarea | Éxito o fallo por participante y tarea | Porcentaje por tarea sobre el total de participantes | Porcentaje por tarea, contra el umbral del 80 % |
| Tiempo y errores por tarea | Segundos y recuento por participante | Media, mediana y rango | **Descriptivo, sin umbral** y sin afirmación de significancia |
| Puntuación SUS | Diez respuestas por participante | Cálculo de la puntuación estándar por participante y media del grupo | Media contra el umbral de 68 (Bangor et al., 2008) |

**Por qué no se aplica estadística inferencial al aislamiento.** No hay muestra ni azar que controlar: se evalúa el **100 % de la población** y el resultado de cada caso es determinista. Aplicar una prueba de significancia a un censo de resultados binarios sería un error de método, no un refuerzo. La decisión sobre la hipótesis nula se toma con el criterio de conjunción de §10.3 —todas las condiciones se cumplen, o H0 se sostiene—, nunca con un valor *p*.

**Representación de los resultados.** Tabla de cobertura de políticas por tabla de negocio; gráfico comparativo de las condiciones C1, C2 y C3 que muestre si el aislamiento se sostiene en las tres; gráfico de barras de la tasa de éxito por tarea con la línea del umbral trazada; y distribución de las puntuaciones SUS individuales frente al baremo de referencia.

**Herramientas de procesamiento.** El volumen es reducido —decenas de casos y a lo sumo ocho participantes, no millones de registros—, de modo que el procesamiento se realiza con **hoja de cálculo** sobre la salida exportada de la suite y sobre la planilla de las sesiones. No se emplean herramientas de datos masivos porque el problema no lo es; declararlas sería sobredimensionar el método.

### 17.4 Validez y confiabilidad de los instrumentos

La validez del diseño experimental y sus limitaciones están en §15.6; lo que se declara aquí es la de los **instrumentos**.

| Principio | Cómo lo satisface este proyecto |
|---|---|
| **Validez** | El aislamiento se mide con el propio motor de base de datos, contando las filas que una identidad ajena obtiene, y con los códigos de respuesta del contrato. **No se pregunta a ningún usuario si percibe que sus datos están aislados**: la percepción no es instrumento válido para medir aislamiento. La única variable medida con instrumento de percepción es la usabilidad, donde la percepción **es** el objeto de medida y se emplea una escala validada (Brooke, 1996) |
| **Validez de contenido** | La medición cubre el censo completo —las 7 tablas de negocio y la totalidad de las operaciones del contrato—, no una selección |
| **Validez de criterio** | Las dos vías, interfaz de programación y acceso directo al motor, se contrastan entre sí; una discrepancia entre ellas es en sí misma un hallazgo |
| **Validez de constructo** | Las condiciones C1, C2 y C3 manipulan **una sola** condición por vez, de modo que el efecto observado sea atribuible a la capa desactivada y no a otro factor |
| **Confiabilidad** | La recolección está **automatizada de extremo a extremo**: la construye y la ejecuta un guion, no una secuencia de acciones manuales. El entorno se reconstruye desde las migraciones y el ciclo se repite tres veces en momentos distintos (*test–retest*). El factor humano queda fuera de la recolección del dato cuantitativo |

**Sobre los identificadores del escenario.** La práctica habitual para hacer repetible una prueba es fijar una **semilla constante**, de modo que los datos generados sean idénticos en cada ejecución. Aquí se hace lo contrario —cada ejecución crea cuentas y organizaciones con identificadores **irrepetibles**— y conviene justificarlo, porque parece contradecir la confiabilidad.

La razón es que lo que debe repetirse no son los datos, sino el **resultado**. Una semilla constante sobre un entorno persistente haría que la segunda ejecución encontrase las filas de la primera, y entonces la prueba ya no partiría de una base vacía: el aislamiento se estaría comprobando sobre un escenario contaminado por la corrida anterior. La repetibilidad se obtiene aquí por otra vía —reconstruir el esquema desde las migraciones y que la propia prueba construya su escenario—, que es más fuerte: el resultado no depende ni de los datos previos ni de los identificadores concretos. Que el aislamiento se sostenga con identificadores distintos en cada corrida es, de hecho, evidencia adicional de que no depende de un caso particular.

---

## 18. Consideraciones éticas

La investigación se ejecuta sobre un artefacto de software, no sobre pacientes ni sobre expedientes de personas; eso **no** la exime de compromisos éticos, porque su objeto es precisamente el manejo de datos ajenos. Se declaran cinco.

### 18.1 Manejo de datos y privacidad

**No se emplea ningún dato productivo, real o personal en la validación técnica.** La totalidad del escenario de prueba es **sintética y generada por la propia prueba** en tiempo de ejecución: cuentas, organizaciones, talleres, clientes y repuestos se crean con identificadores irrepetibles sobre un dominio de correo reservado para pruebas, y se descartan junto con el entorno. En ningún momento se descarga, copia ni consulta la base de datos de una organización real, ni se aplica enmascaramiento de datos productivos —porque no hay datos productivos que enmascarar—. La ausencia de información personal identificable es una **propiedad del diseño del experimento**, no una medida correctiva aplicada después.

Si en trabajo posterior el sistema operase con datos reales, el propio objeto de esta tesis —el aislamiento aplicado en el motor de base de datos— sería la garantía técnica que los protegería: la privacidad desde el diseño no es aquí un añadido al método, sino la hipótesis sometida a prueba.

### 18.2 Protección de los entornos productivos

Las pruebas **no se ejecutan contra ningún entorno productivo ni contra infraestructura de terceros**. Se ejecutan sobre un proyecto de base de datos dedicado y desechable, reconstruido desde las migraciones en cada ciclo, cuya destrucción no afecta a nadie. El proyecto **excluye explícitamente** las pruebas de carga, de rendimiento a escala productiva y de penetración (§19.3), de modo que el procedimiento carece por construcción de la capacidad de degradar el servicio de una organización real o de provocar una denegación de servicio accidental.

La credencial privilegiada del sistema se lee **únicamente del entorno**, nunca del repositorio, y su ausencia en el código versionado se verifica por inspección (RNF-103). Ninguna clave, correo o identificador real se incorpora al material de la tesis.

### 18.3 Participación de personas

La evaluación de usabilidad es el único componente en el que participan personas, y se rige por cuatro compromisos: **consentimiento informado** firmado antes de la sesión, con explicación del propósito, del uso de los datos y del derecho a retirarse en cualquier momento y sin dar motivo; **anonimización**, con resultados reportados de forma agregada y participantes identificados como P1…P8; **confidencialidad de sus organizaciones**, que no se nombran ni se describen de modo que permita reconocerlas; y la declaración explícita, al inicio de cada sesión, de que **se evalúa el sistema y no a la persona**, porque condiciona su disposición a intentar sin temor a equivocarse. Ninguna sesión se graba en vídeo ni se registra dato alguno que permita identificar al participante.

### 18.4 Propiedad intelectual y licencias

El sistema se construye sobre componentes de terceros de código abierto —entre otros Node.js, TypeScript, React, Hono, Zod, Vitest y PostgreSQL—, cuyos avisos de licencia se conservan íntegros y cuya autoría **no se atribuye el investigador**; el trabajo propio se publica bajo licencia MIT. Toda fuente bibliográfica se cita en estilo APA (7.ª edición) con su identificador permanente verificado (§20).

Sobre el uso de asistentes de inteligencia artificial se declara el límite adoptado: pueden emplearse para código repetitivo y tareas mecánicas de redacción, pero **el planteamiento del problema, el diseño arquitectónico, las decisiones registradas y la interpretación de los resultados son de autoría intelectual del investigador**. No se reutiliza ningún algoritmo propietario de terceros.

### 18.5 Integridad de los resultados

El fraude característico de una tesis de ingeniería no es el plagio de texto, sino el **maquillaje de la evidencia**: depurar de la salida los casos que fallaron para que la gráfica salga en verde. Se declara por anticipado lo contrario.

- Un caso **omitido** por falta de entorno se reporta como omitido y **no cubre su requisito** ([Plan de pruebas](../ingenieria/11-plan-pruebas.md) §6.2). Un informe con casos omitidos en los niveles de integración y aislamiento no constituye evidencia de cumplimiento.
- Si **una sola** tabla devolviera filas ajenas, se reporta la fuga con su tabla y su caso, y la hipótesis nula se sostiene (§10.3). El resultado negativo se publica; no se reformula la hipótesis para acomodarlo.
- Si la usabilidad quedara por debajo de sus umbrales, se reporta y se discute como hallazgo. La hipótesis de la tesis es sobre el aislamiento, y un resultado adverso en usabilidad no se oculta para preservar la apariencia del conjunto.
- La evidencia conservada (§15.5 y §17.1) permite que un tercero repita la ejecución y contraste los números frente a los declarados. Esa posibilidad de refutación es lo que da valor a la afirmación.

---

## 19. Alcance y exclusiones

### 19.1 Alcance funcional

- Registro que crea una cuenta, su primera organización y su primer taller, con el usuario como propietario.
- Creación de organizaciones adicionales bajo la misma cuenta y de talleres dentro de cada organización.
- Listado de organizaciones según membresía, cambio de organización activa y selección de taller activo.
- Gestión de miembros por organización —invitar, cambiar rol, remover—, reservada al propietario, y asignación operativa de miembros a talleres.
- **Corte vertical de demostración**: Clientes (entidad de nivel organización, visible desde cualquier taller) e Inventario de repuestos (entidad de nivel taller, acotada a su local).
- Verificación de aislamiento por dos vías independientes.
- **Evaluación de usabilidad del cambio de contexto** con operadores del rubro, mediante tareas guiadas.

### 19.2 Alcance técnico

| Componente | Tecnología |
|---|---|
| Servidor | Node.js · TypeScript · Hono · Zod |
| Datos e identidad | PostgreSQL con seguridad a nivel de fila, sobre proveedor gestionado |
| Despliegue | Funciones serverless |
| Interfaz de usuario | React con TypeScript, responsiva e instalable |
| Pruebas | Vitest — unitarias, de contrato, de integración y de aislamiento |
| Integración continua | Pipeline automatizado con verificación de tipos y suite de pruebas |

### 19.3 Exclusiones

El objeto de estudio es la **arquitectura**, no la suite funcional completa. No forman parte de este proyecto:

- Los módulos operativos fuera del corte vertical: motocicletas, órdenes de trabajo, historial de mantenimiento y panel de métricas.
- La auditoría extendida a la totalidad de las entidades de negocio; sí se audita el conjunto acotado de acciones críticas.
- La integración con mensajería por WhatsApp.
- La emisión de factura electrónica del Servicio de Impuestos Nacionales.
- Aplicaciones móviles o de escritorio nativas: solo web responsiva e instalable.
- Migración de datos productivos desde sistemas anteriores.
- Pruebas de carga o rendimiento a escala productiva.
- La evaluación de usabilidad de la **totalidad** de la interfaz: se evalúa el cambio de contexto entre organizaciones y talleres, no las demás pantallas.

---

## 20. Referencias

Estilo **APA (7.ª edición)**. Todos los identificadores permanentes —DOI e ISBN— fueron verificados contra el registro del editor. La documentación técnica sin autor humano se cita con **autor corporativo** y, al carecer de fecha de publicación fija, con fecha de recuperación; se emplea únicamente como sustento del marco conceptual (§7.1), nunca como sustento teórico.

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

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519

Kleppmann, M. (2017). *Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems*. O'Reilly Media.

Krasner, G. E., & Pope, S. T. (1988). A cookbook for using the model-view-controller user interface paradigm in Smalltalk-80. *Journal of Object-Oriented Programming, 1*(3), 26–49.

Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science* (pp. 426–431). SciTePress. https://doi.org/10.5220/0003957604260431

Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. https://doi.org/10.1109/MC.2003.1204375

Meta Open Source. (s. f.). *React documentation*. Recuperado el 14 de agosto de 2026, de https://react.dev/

Microsoft. (s. f.). *TypeScript documentation*. Recuperado el 14 de agosto de 2026, de https://www.typescriptlang.org/docs/

Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O'Reilly Media.

Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann.

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Nottingham, M., Wilde, E., & Dalal, S. (2023). *Problem details for HTTP APIs* (RFC 9457). Internet Engineering Task Force. https://doi.org/10.17487/RFC9457

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

OpenJS Foundation. (s. f.). *Node.js documentation*. Recuperado el 14 de agosto de 2026, de https://nodejs.org/docs/latest/api/

Pierce, B. C. (2002). *Types and programming languages*. MIT Press.

PostgreSQL Global Development Group. (s. f.-a). *PostgreSQL documentation*. Recuperado el 14 de agosto de 2026, de https://www.postgresql.org/docs/current/

PostgreSQL Global Development Group. (s. f.-b). *Row security policies*. Recuperado el 14 de agosto de 2026, de https://www.postgresql.org/docs/current/ddl-rowsecurity.html

Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media.

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum*. Recuperado el 14 de agosto de 2026, de https://scrumguides.org/

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft del 13 de agosto de 2026). https://www.w3.org/TR/appmanifest/

Zod. (s. f.). *Zod documentation*. Recuperado el 14 de agosto de 2026, de https://zod.dev/
