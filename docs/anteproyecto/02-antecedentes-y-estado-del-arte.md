# 2. Antecedentes y Estado del Arte

Son dos secciones distintas. Los **antecedentes** responden *¿qué se ha usado históricamente para resolver esto?*: el contexto del sector donde ocurre el problema, con evidencia empírica, y la evolución de las soluciones y arquitecturas que lo han atendido. El **estado del arte** responde *¿hasta dónde llegó la investigación actual y cuáles son sus límites?*: la frontera del conocimiento científico entre 2021 y 2026, construida con el protocolo de §2.2.1. De cada fuente se consigna su **limitación**, porque esa columna es la que alimenta el enunciado del vacío (§2.3) y demuestra que la propuesta no reinventa software existente.

## 2.1 Antecedentes

### 2.1.1 Contexto del sector

**El parque de motocicletas de Bolivia y su demanda de servicio.** La motocicleta es el vehículo más numeroso del país: según el Cuadro N.º 1.2 del Instituto Nacional de Estadística (INE), elaborado con registros del Registro Único para la Administración Tributaria Municipal (RUAT), en **2025** se contabilizaron **931.205 motocicletas** —el **34,8 %** de todo el parque automotor nacional—, cifra que lo encabeza por delante de vagonetas, automóviles y camionetas. Su crecimiento no solo es sostenido, sino **más del doble de rápido** que el del parque en conjunto: entre 2021 y 2025 las motocicletas pasaron de **657.718** a **931.205 unidades** (**+41,6 %**), mientras que el parque automotor total creció un **+20,0 %** en el mismo período. La progresión es continua —657.718 en 2021, 872.550 en 2024 y 931.205 en 2025—, y por eso su participación no deja de subir: del **29,5 % en 2021** al **34,8 % en 2025**. Cada una de esas unidades requiere mantenimiento periódico y reparaciones, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio — una base de negocio que crece año a año y que, al hacerlo, empuja a los operadores más exitosos a abrir locales adicionales.

**Condiciones del sector que explican el problema.** Ese crecimiento ocurre, sin embargo, en una economía marcadamente informal: el INE reporta una **informalidad laboral del 84,2 % en 2024**, una tendencia que se ha agravado de forma sostenida durante las últimas dos décadas. Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo. En ese contexto, el operador que crece —el que abre un segundo o tercer taller, o constituye más de una organización— se encuentra sin herramientas que le permitan administrarlas de forma centralizada: debe optar entre llevar cada local como una instalación independiente, perdiendo la visión unificada del cliente y su historial, o renunciar a la especialización y volver a soluciones genéricas.

#### Fuentes consultadas para el contexto del sector

Se cita el **cuadro estadístico oficial**, no su difusión periodística. El INE publica la serie completa en formato descargable y fija su propia forma de cita para estos archivos de uso público.

| Fuente | Tipo | Enlace |
|---|---|---|
| INE — **Cuadro N.º 1.2**, *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (datos originados en el RUAT). **Cuadro del que proceden todas las cifras de este apartado** | **Primaria** (oficial, descargable) | https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/ |
| INE — *Boletín estadístico parque automotor 2024* (publicado el 28 de mayo de 2025) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/ |
| INE — *Estadísticas del parque automotor 2003–2025* (publicado el 1 de julio de 2026) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/ |
| INE / ANDA — Ficha del producto estadístico *Estadísticas del parque automotor*, identificador `BOL-INE-EPARQAUTO` | **Primaria** (metadatos oficiales) | https://anda.ine.gob.bo/index.php/catalog/205 |
| INE — *Encuesta Continua de Empleo* (fuente del indicador de informalidad laboral del 84,2 %) | Secundaria — dato por remitir a su cuadro oficial | https://www.ine.gob.bo/index.php/desocupacion/ |

> **Salvedad sobre el indicador de informalidad.** A diferencia de las cifras del parque automotor, el 84,2 % de informalidad laboral procede de la Encuesta Continua de Empleo del INE por vía de difusión secundaria, y no del cuadro estadístico original. Se emplea, por tanto, únicamente como **caracterización cualitativa** del sector y no interviene en ningún cálculo del documento.

> **Nota de método.** Las cifras de motocicletas del Cuadro N.º 1.2 se presentan desagregadas por tipo de servicio; el total anual empleado aquí es la suma de las tres categorías (particular, público y oficial). Para 2024, por ejemplo: 855.268 + 2.278 + 15.004 = **872.550**; el total de 2025 se obtiene de la misma forma.

> **Año de corte.** La serie se cierra en **2025**, el último año disponible en el momento de redactar: el INE publicó *Estadísticas del parque automotor 2003–2025* el 1 de julio de 2026.

### 2.1.2 Antecedentes tecnológicos

Enfoque histórico-evolutivo: qué soluciones y arquitecturas han atendido la gestión de talleres y el aislamiento entre clientes de un mismo sistema, y dónde se detuvo cada una frente al problema de este proyecto.

| Etapa | Solución | Dónde se detiene frente al problema |
|---|---|---|
| **Software de escritorio por local** | Programa de gestión de taller instalado en el equipo del local, con su base de datos local | Cada local es una isla: sin visión consolidada ni acceso remoto, y con el mantenimiento a cargo de cada instalación |
| **Software como servicio de un solo inquilino por cuenta** | La oferta comercial relevada con presencia en Bolivia y en la región ([Análisis del mercado](../ingenieria/09-analisis-mercado.md)) | Traslada el sistema a la nube pero conserva el supuesto de un taller por cuenta; el aislamiento entre cuentas, cuando existe, vive en el código |
| **Multi-tenancy con base o esquema por inquilino** | Una base de datos o un esquema separados por cliente del sistema (Krebs et al., 2012) | Aísla con fuerza, pero impone costo fijo y operación por inquilino, incompatibles con el presupuesto del sector |
| **Esquema compartido con discriminador en la aplicación** | Todas las organizaciones en las mismas tablas, filtradas por un identificador en cada consulta (Krebs et al., 2012) | Aprovecha recursos, pero dispersa la conciencia de inquilino por toda la base de código: un solo olvido produce una fuga (Bezemer & Zaidman, 2010) |
| **Esquema compartido con políticas en el motor** | Políticas de seguridad a nivel de fila evaluadas por el propio motor de base de datos en toda consulta (PostgreSQL Global Development Group, s. f.-b) | Traslada la condición de inquilino al motor, pero la literatura la estudia sobre inquilinos **planos** y documenta fallos del propio mecanismo (§2.2) |

Esta evolución deja dos límites abiertos que el estado del arte debe examinar: cómo sostener el aislamiento cuando el inquilino tiene **subdivisiones internas** con entidades de alcance distinto, y cómo **demostrar** que ese aislamiento no depende de la aplicación.

---

## 2.2 Estado del Arte

### 2.2.1 Protocolo de revisión

| Etapa | Aplicación |
|---|---|
| **Planificación** | Pregunta de revisión: ¿qué arquitecturas y mecanismos sostienen el aislamiento entre inquilinos en esquemas compartidos, y con qué limitaciones? Ventana temporal: **2021 a 2026** |
| **Búsqueda** | Cadena booleana `("multi-tenant" OR "multi-tenancy" OR "multitenancy") AND ("row-level security" OR "tenant isolation" OR "data isolation") AND ("SaaS" OR "shared schema" OR "cloud")`, con términos del *ACM Computing Classification System* —*Security and privacy → Database and storage security*; *Software and its engineering → Software architectures*—, en ACM Digital Library, IEEE Xplore, Scopus, Google Scholar, BASE y OATD |
| **Selección** | Lectura progresiva título → resumen → conclusiones. **Inclusión**: revisión por pares o tesis de maestría o doctorado en ciencias de la computación; problema arquitectónico comparable aunque el rubro difiera. **Exclusión**: soluciones sobre tecnologías legadas y artículos de opinión sin validación métrica |
| **Síntesis** | Análisis **crítico**: de cada trabajo se consigna dónde falla frente al problema, no qué dice. La columna de limitaciones alimenta el enunciado del vacío |

### 2.2.2 Matriz del estado del arte

| Autor | Metodología | Aporte | Limitaciones |
|---|---|---|---|
| **Dar, Hershcovitch & Morrison (2023)** · *Proc. ACM on Management of Data* (SIGMOD), art. 89 · DOI 10.1145/3588943 | Experimental: diseño y ejecución de ataques de canal lateral temporal sobre PostgreSQL y SQL Server, en instancias propias y gestionadas en AWS; construcción de un banco de pruebas multi-tenant con RLS y de una defensa *data-oblivious*, con medición de su impacto en rendimiento | Demuestran que RLS impide devolver datos no autorizados, **pero el tiempo de ejecución de la consulta filtra información**: mediante consultas que usan índices, un atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, cuántas veces existe. Su defensa alcanza seguridad con impacto mínimo en rendimiento para claves únicas | Modelo de inquilinos **plano y de un solo nivel**, en la capa de consulta: no abordan dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna. La defensa queda resuelta solo para claves únicas, y los *benchmarks* establecidos (YCSB) no soportan multi-tenancy ni RLS |
| **Alobaywi et al. (2026)** · *IoT* (MDPI), 7(1), art. 21 · DOI 10.3390/iot7010021 | Revisión sistemática de literatura guiada por el protocolo PRISMA, con categorización temática de amenazas | Clasifican las amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos, ataques de canal lateral y escalamiento de privilegios**, y evalúan marcos que buscan imponer aislamiento sin violar los límites de latencia y energía de sensores ligeros | Al ser una revisión, **identifica amenazas pero no propone ni valida una arquitectura**. Su contexto son dispositivos IoT, no SaaS de gestión empresarial con estructura organizacional jerárquica |
| **Andriianenko (2026)** · Tesis de maestría, Universitatea Tehnică a Moldovei | Diseño, implementación y **evaluación comparativa** de dos arquitecturas sobre un mismo SaaS de gestión de proyectos basado en microservicios | El **esquema compartido** reduce el consumo de recursos pero incrementa la complejidad y el riesgo de aislamiento; la **base de datos por inquilino** separa mejor a costa de mayor sobrecarga operativa | Evalúa ambos modelos como **alternativas planas y excluyentes**, sin considerar la seguridad a nivel de fila como refuerzo dentro del esquema compartido, ni una jerarquía de dos niveles con reglas de alcance distintas por entidad |
| **Simić, Dedeić, Stojkov & Prokić (2024)** · *IEEE Access*, 12, pp. 32597–32617 · DOI 10.1109/ACCESS.2024.3369031 | Diseño e implementación de un modelo de nubes virtuales mediante una jerarquía de espacios de nombres sobre infraestructura distribuida en el borde, con evaluación del aislamiento y de la redistribución de recursos | La jerarquía de espacios de nombres sostiene el **aislamiento lógico entre inquilinos de distinto nivel**, permitiendo que un nivel superior reorganice CPU, memoria y almacenamiento de los inferiores | Su aislamiento opera sobre **recursos de infraestructura**, no sobre filas de una base relacional compartida: no hay políticas a nivel de fila ni reparto de entidades de negocio según su nivel |
| **Olabanji, Fitch & Matthew (2023)** · *WSEAS Transactions on Computers*, 22, pp. 25–43 · DOI 10.37394/23205.2023.22.4 | Mapeo sistemático: de 921 publicaciones relevadas seleccionan y clasifican 64 revisadas por pares (2015–2022) | Documentan los retos y tendencias de la multi-tenancy en contenedores y orquestación, y confirman que el aislamiento entre inquilinos **sigue siendo un problema abierto** | Cataloga el conocimiento **sin proponer ni validar arquitectura propia**; su dominio es *cloud-native*, no la jerarquía organizacional de dos niveles |

### 2.2.3 Fichas analíticas de las fuentes primarias

Desarrollo de cada entrada de la matriz, con el detalle que la tabla no permite condensar.

#### Ficha 1 — Dar, Hershcovitch & Morrison (2023)

| Campo | Contenido |
|---|---|
| **Referencia** | Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS Side Channels: Investigating Leakage of Row-Level Security Protected Data Through Query Execution Time. *Proceedings of the ACM on Management of Data, 1*(1), art. 89. |
| **Filiación / venue** | Tel Aviv University (Israel). *Proc. ACM Manag. Data* — publicación asociada a SIGMOD. Indexada en Scopus y ACM DL. |
| **Problema abordado** | Determinar si la seguridad a nivel de fila, además de impedir la devolución de datos no autorizados, evita también la fuga de información por **efectos colaterales** de la ejecución de la consulta. |
| **Metodología** | Diseño y ejecución de ataques de canal lateral temporal sobre motores reales; desarrollo de un esquema de defensa *data-oblivious*; construcción de un banco de pruebas propio para multi-tenancy con RLS; medición del impacto de la defensa en el rendimiento. |
| **Tecnologías evaluadas** | PostgreSQL y SQL Server, tanto en instalación propia como en **instancias gestionadas en AWS**. |
| **Resultados clave** | (a) Mediante consultas que fuerzan el uso de índices, el atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, **cuántas veces** existe. (b) El ataque tuvo éxito desde máquinas virtuales situadas en el mismo centro de datos y en otros distintos. (c) La defensa propuesta alcanza seguridad con impacto mínimo en rendimiento para claves únicas. (d) Los bancos de prueba establecidos, como YCSB, **no soportan multi-tenancy ni RLS**. |
| **Limitaciones declaradas por los autores** | La solución *data-oblivious* está resuelta plenamente para **claves únicas**; para claves no únicas se analizan los compromisos sin cerrar el caso general. |
| **Vacío frente a este proyecto** | Trabajan sobre un modelo de inquilinos **plano y de un solo nivel**, en la capa de consulta. No abordan dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna. |
| **Aporte a este proyecto** | Fundamenta empíricamente que RLS, por sí solo, **no constituye una garantía absoluta**, lo que respalda la defensa en profundidad adoptada en el diseño. |

#### Ficha 2 — Alobaywi et al. (2026)

| Campo | Contenido |
|---|---|
| **Referencia** | Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. |
| **Filiación / venue** | *IoT* (MDPI), revista de acceso abierto revisada por pares e indexada en Scopus. Publicación: 22 de febrero de 2026. |
| **Problema abordado** | Sistematizar las amenazas de seguridad propias de entornos multi-inquilino en la intersección IoT–nube, y evaluar si los marcos existentes imponen aislamiento sin degradar el rendimiento. |
| **Metodología** | Revisión sistemática de literatura conducida según el protocolo **PRISMA**, con categorización temática de amenazas. |
| **Hallazgos clave** | Tres familias de amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos**, **ataques de canal lateral** y **escalamiento de privilegios**. |
| **Limitaciones** | Al ser una revisión, **no propone ni valida una arquitectura concreta**. |
| **Vacío frente a este proyecto** | Su contexto son dispositivos IoT con restricciones de latencia y energía, no aplicaciones SaaS de gestión empresarial, y no contempla estructuras jerárquicas entre inquilinos. |
| **Aporte a este proyecto** | Confirma que la fuga entre inquilinos y los canales laterales son amenazas vigentes en la literatura reciente. |

#### Ficha 3 — Andriianenko (2026)

| Campo | Contenido |
|---|---|
| **Referencia** | Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. |
| **Filiación / venue** | Universidad Técnica de Moldavia. Repositorio institucional de acceso abierto. Tesis de maestría en ciencias de la computación, categoría admitida por los criterios de inclusión (§2.2.1). |
| **Problema abordado** | Qué modelo de multi-tenancy en base de datos conviene a un SaaS de gestión de proyectos basado en microservicios que atiende a varias organizaciones. |
| **Metodología** | Diseño, implementación y **evaluación comparativa** de dos arquitecturas sobre el mismo sistema. |
| **Alternativas evaluadas** | **Esquema compartido** frente a **base de datos por inquilino**. |
| **Resultados clave** | El esquema compartido minimiza recursos pero **incrementa la complejidad y el riesgo de aislamiento**; la base por inquilino separa mejor con **sobrecarga operativa más elevada**. |
| **Limitaciones** | Evalúa los dos modelos como alternativas **planas y mutuamente excluyentes**. |
| **Vacío frente a este proyecto** | No considera la seguridad a nivel de fila como refuerzo dentro del esquema compartido, ni una jerarquía de dos niveles con reglas de alcance por entidad. |
| **Aporte a este proyecto** | Es el comparable metodológico más cercano: valida que diseñar y evaluar empíricamente arquitecturas multi-tenant constituye un trabajo de nivel de maestría, y aporta el marco de compromisos entre recursos y aislamiento. |

#### Ficha 4 — Simić, Dedeić, Stojkov & Prokić (2024)

| Campo | Contenido |
|---|---|
| **Referencia** | Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. |
| **Filiación / venue** | Universidad de Novi Sad (Serbia). *IEEE Access* — revista de acceso abierto revisada por pares, indexada en Scopus y en IEEE Xplore. |
| **Problema abordado** | Cómo sostener multi-tenancy en micro-nubes en el borde, redistribuyendo recursos entre niveles sin perder el aislamiento lógico. |
| **Metodología** | Modelo de nubes virtuales mediante una jerarquía de espacios de nombres, con implementación y evaluación del aislamiento y la redistribución de recursos. |
| **Resultados clave** | La jerarquía permite que un nivel superior reorganice CPU, memoria y almacenamiento de los inferiores conservando la separación lógica. |
| **Vacío frente a este proyecto** | Es el antecedente **más cercano en cuanto a jerarquía**, pero su aislamiento opera sobre **recursos de infraestructura**, no sobre filas de una base relacional compartida. |
| **Aporte a este proyecto** | Demuestra que la multi-tenancy **jerárquica** es una línea vigente y delimita el aporte propio: trasladar la jerarquía a la capa de datos. |

#### Ficha 5 — Olabanji, Fitch & Matthew (2023)

| Campo | Contenido |
|---|---|
| **Referencia** | Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. |
| **Filiación / venue** | Universidad de Portsmouth y Southampton Solent University (Reino Unido). Revista revisada por pares, de acceso abierto. |
| **Problema abordado** | Qué se ha investigado sobre multi-tenancy en arquitecturas *cloud-native* y qué retos permanecen abiertos. |
| **Metodología** | Mapeo sistemático: de **921 publicaciones** se seleccionan **64 revisadas por pares** (2015–2022). |
| **Resultados clave** | El aislamiento entre inquilinos permanece como problema abierto pese a los avances del período. |
| **Limitaciones** | Al ser una revisión de mapeo, **no propone ni valida arquitectura alguna**. |
| **Vacío frente a este proyecto** | Su dominio son contenedores y orquestación, no la jerarquía organizacional de dos niveles en el motor de base de datos. |
| **Aporte a este proyecto** | Respaldo cuantitativo a la vigencia del problema. |

### 2.2.4 Síntesis comparativa

| Criterio | Dar et al. (2023) | Alobaywi et al. (2026) | Andriianenko (2026) | Simić et al. (2024) | Olabanji et al. (2023) | **Este proyecto** |
|---|---|---|---|---|---|---|
| Tipo de trabajo | Investigación experimental | Revisión sistemática | Tesis con implementación | Investigación experimental | Revisión de mapeo | **Design Science Research con validación cuasiexperimental** |
| Niveles de inquilino | Uno (plano) | Uno (plano) | Uno (plano) | Jerárquico (infraestructura) | Uno (plano) | **Dos (jerárquico, en los datos)** |
| Mecanismo de aislamiento estudiado | RLS | Varios marcos | Esquema compartido / base por inquilino | Espacios de nombres | Varios | **RLS + verificación en aplicación** |
| Capa donde se aplica el aislamiento | Consulta | Varias | Base de datos | **Infraestructura** | Varias | **Motor de base de datos + aplicación** |
| ¿Propone arquitectura? | No (ataque y defensa) | No | Sí | Sí | No | Sí |
| ¿Valida frente a una línea base? | Sí | No | Sí | Sí | No | Sí |
| Dominio de aplicación | Genérico | IoT–nube | SaaS de gestión de proyectos | Nube distribuida en el borde | *Cloud-native* | **SaaS de gestión de talleres (Bolivia)** |
| Despliegue | Instancias gestionadas | No aplica | Microservicios | Micro-nubes en el borde | Contenedores | **Serverless** |

### 2.2.5 Evidencia técnica primaria complementaria

No constituye literatura académica —son registros oficiales de vulnerabilidad— pero aporta evidencia verificable de que la aplicación de políticas RLS ha fallado de forma **recurrente** en producción, lo que sustenta no depender de una única capa de aislamiento:

| Identificador | Año | Descripción |
|---|---|---|
| **CVE-2016-2193** | 2016 | Aplicación de política de seguridad de fila incorrecta ante reutilización de planes de consulta |
| **CVE-2023-2455** | 2023 | Nuevo caso del mismo tipo, no cubierto por la corrección anterior |
| **CVE-2024-10976** | 2024 | Seguimiento incompleto de tablas con seguridad de fila en PostgreSQL (versiones previas a 17.1, 16.5, 15.9, 14.14, 13.17 y 12.21). Se manifiesta cuando una subconsulta, consulta `WITH`, vista *security invoker* o función SQL referencia una tabla con política RLS; **aplicar una política incorrecta puede permitir lecturas y modificaciones prohibidas**. CVSS 5.4, CWE-1250 |

Referencia: https://www.wiz.io/vulnerability-database/cve/cve-2024-10976 · https://www.suse.com/security/cve/CVE-2024-10976.html

---

## 2.3 Vacío de Investigación

**Enunciado del vacío** — tecnología + condición + deficiencia:

> **Seguridad a nivel de fila** en esquemas compartidos cuyos **inquilinos son jerárquicos y sus entidades tienen alcance distinto por nivel**: falta una arquitectura que sitúe el único límite de aislamiento y **lo valide empíricamente frente a una línea base, con independencia de la capa de aplicación**.

La solución propuesta por **Dar et al. (2023)** es rigurosa y demuestra empíricamente que la seguridad a nivel de fila cumple su función como control de acceso en bases de datos compartidas; **sin embargo**, su análisis se limita a un modelo de inquilinos plano y de un solo nivel, y se concentra en el ataque y la defensa en la capa de consulta, sin abordar la decisión arquitectónica previa: **dónde ubicar el límite de aislamiento cuando el inquilino posee una subdivisión interna** cuyas entidades no comparten el mismo alcance. **Alobaywi et al. (2026)** sistematizan las amenazas de fuga entre inquilinos y de canal lateral, **pero**, al tratarse de una revisión centrada en entornos IoT–nube, identifican riesgos sin proponer ni validar una arquitectura aplicable a un SaaS de gestión empresarial. **Andriianenko (2026)**, por su parte, compara esquema compartido frente a base por inquilino, **no obstante** los evalúa como alternativas planas y mutuamente excluyentes, sin considerar la seguridad a nivel de fila como refuerzo dentro del esquema compartido.

El antecedente que más se aproxima es **Simić et al. (2024)**, que sí modelan una **jerarquía** de inquilinos y demuestran que el aislamiento se sostiene entre sus niveles; **ahora bien**, esa jerarquía organiza **recursos de infraestructura** y no las filas de una base de datos relacional compartida, de modo que no responde cómo repartir las entidades de negocio entre los niveles ni cómo hacer cumplir esa separación en el motor. Por último, **Olabanji et al. (2023)**, sobre 921 publicaciones relevadas, confirman que el aislamiento entre inquilinos permanece como reto abierto, **aunque**, al ser una revisión de mapeo, catalogan el conocimiento sin proponer ni validar arquitectura alguna. A todo ello se suma que la serie de vulnerabilidades registradas en la aplicación de políticas RLS (CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976) evidencia que confiar en una sola capa de aislamiento resulta insuficiente en la práctica.

El presente proyecto aborda esta deficiencia mediante el **diseño, desarrollo y validación de una arquitectura multi-tenant jerárquica (organización → talleres)** que mantiene un **único límite de aislamiento verificable** a nivel de organización, tratando el taller como criterio de alcance operativo y no como segunda frontera de seguridad; refuerza la seguridad a nivel de fila con **verificación de membresía en la capa de aplicación** (defensa en profundidad), en respuesta directa al patrón de fallos evidenciado por los CVE; y **contrasta la separación obtenida con una línea base** de aislamiento solo en la aplicación, por dos vías independientes —la interfaz de programación y el acceso directo a la base de datos—, demostrando que el aislamiento se sostiene aun cuando la capa de aplicación omita sus controles.

---

## 2.4 Referencias

Se separan en dos bloques según **cómo se verifica cada uno**: los artículos y tesis por DOI o por identificador de repositorio, y los enlaces por consulta directa de la página. Solo figuran obras citadas en este capítulo, como exige APA 7; los libros de base se referencian donde se citan, en el [capítulo 3](03-marco-teorico-y-conceptual.md) §3.5 y en las listas del perfil y del anteproyecto. El estado de comprobación de cada entrada está en [Verificación de referencias](anexo-referencias.md).

### A. Artículos y tesis con identificador permanente

*Se verifican por DOI o por el identificador del repositorio institucional.*

| # | Referencia (APA 7) | Identificador |
|---|---|---|
| A1 | Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. | https://doi.org/10.1145/3588943 |
| A2 | Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. | https://doi.org/10.3390/iot7010021 |
| A3 | Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. Repositorio institucional UTM. | https://repository.utm.md/handle/5014/35481 |
| A4 | Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. | https://doi.org/10.1109/ACCESS.2024.3369031 |
| A5 | Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. | https://doi.org/10.37394/23205.2023.22.4 |
| A6 | Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution (EVOL) and International Workshop on Principles of Software Evolution (IWPSE)* (pp. 88–92). ACM. **(cap. 3)** | https://doi.org/10.1145/1862372.1862393 |
| A7 | Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science (CLOSER 2012)* (pp. 426–431). SciTePress. **(cap. 3)** | https://doi.org/10.5220/0003957604260431 |

> A6 y A7 sostienen los antecedentes tecnológicos (§2.1.2), no el estado del arte: son anteriores a la ventana 2021–2026 porque describen la evolución de las arquitecturas, que es lo que los antecedentes exigen.

### B. Enlaces — fuentes estadísticas, registros y documentación oficiales

*Se verifican consultando la página. Al no tener identificador permanente, requieren fecha de recuperación.*

| # | Referencia (APA 7) | Enlace |
|---|---|---|
| E1 | Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del RUAT. | https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/ |
| E2 | Instituto Nacional de Estadística de Bolivia. (2025). *Boletín estadístico parque automotor 2024*. | https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/ |
| E3 | Instituto Nacional de Estadística de Bolivia. (2026). *Estadísticas del parque automotor 2003–2025*. | https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/ |
| E4 | *CVE-2024-10976: PostgreSQL incomplete tracking of tables with row security*. (2024). Wiz Vulnerability Database. | https://www.wiz.io/vulnerability-database/cve/cve-2024-10976 |
| E5 | PostgreSQL Global Development Group. (s. f.-b). *Row security policies*. Recuperado el 14 de agosto de 2026. **(cap. 3)** | https://www.postgresql.org/docs/current/ddl-rowsecurity.html |

> **Formato**: todas las referencias siguen el estilo **APA (7.ª edición)**. Las obras que se emplean como sustento teórico se citan en el cuerpo del [capítulo 3](03-marco-teorico-y-conceptual.md), donde figuran además sus propias referencias. El estado de comprobación de cada identificador está en el [Anexo de referencias](anexo-referencias.md).
