# 2. Antecedentes y Estado del Arte

Los **antecedentes** describen el contexto del sector donde ocurre el problema; el **estado del arte**, la frontera del conocimiento científico sobre la tecnología que lo resuelve. Este último se construye únicamente con literatura revisada por pares (ACM, IEEE, Scopus, Google Scholar, OATD, BASE) publicada entre 2021 y 2026, admitiendo tesis de maestría o doctorado en ciencias de la computación y trabajos con problemas arquitectónicos similares aunque el rubro sea distinto; se excluyen las soluciones sobre tecnologías legadas y los artículos de opinión sin validación métrica. De cada fuente se consigna su **limitación**, que es donde se abre la oportunidad de este proyecto.

## 2.1 Antecedentes

**El parque de motocicletas de Bolivia y su demanda de servicio.** La motocicleta es el vehículo más numeroso del país: según el Cuadro N.º 1.2 del Instituto Nacional de Estadística (INE), elaborado con registros del Registro Único para la Administración Tributaria Municipal (RUAT), en **2025** se contabilizaron **931.205 motocicletas** —el **34,8 %** de todo el parque automotor nacional—, cifra que lo encabeza por delante de vagonetas, automóviles y camionetas. Su crecimiento no solo es sostenido, sino **más del doble de rápido** que el del parque en conjunto: entre 2021 y 2025 las motocicletas pasaron de **657.718** a **931.205 unidades** (**+41,6 %**), mientras que el parque automotor total creció un **+20,0 %** en el mismo período. La progresión es continua —657.718 en 2021, 872.550 en 2024 y 931.205 en 2025—, y por eso su participación no deja de subir: del **29,5 % en 2021** al **34,8 % en 2025**. Cada una de esas unidades requiere mantenimiento periódico y reparaciones, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio — una base de negocio que crece año a año y que, al hacerlo, empuja a los operadores más exitosos a abrir locales adicionales.

**Condiciones del sector que explican el problema.** Ese crecimiento ocurre, sin embargo, en una economía marcadamente informal: el INE reporta una **informalidad laboral del 84,2 % en 2024**, una tendencia que se ha agravado de forma sostenida durante las últimas dos décadas. Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo. En ese contexto, el operador que crece —el que abre un segundo o tercer taller, o constituye más de una organización— se encuentra sin herramientas que le permitan administrarlas de forma centralizada: debe optar entre llevar cada local como una instalación independiente, perdiendo la visión unificada del cliente y su historial, o renunciar a la especialización y volver a soluciones genéricas. Este es precisamente el escenario que el presente proyecto aborda.

### Fuentes consultadas para los antecedentes

Se cita el **cuadro estadístico oficial**, no su difusión periodística. El INE publica la serie completa en formato descargable y fija su propia forma de cita para estos archivos de uso público.

| Fuente | Tipo | Enlace |
|---|---|---|
| INE — **Cuadro N.º 1.2**, *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (datos originados en el RUAT). **Cuadro del que proceden todas las cifras de este apartado** | **Primaria** (oficial, descargable) | https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/ |
| INE — *Boletín estadístico parque automotor 2024* (publicado el 28 de mayo de 2025) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/ |
| INE — *Estadísticas del parque automotor 2003–2025* (publicado el 1 de julio de 2026) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/ |
| INE / ANDA — Ficha del producto estadístico *Estadísticas del parque automotor*, identificador `BOL-INE-EPARQAUTO` | **Primaria** (metadatos oficiales) | https://anda.ine.gob.bo/index.php/catalog/205 |
| INE — *Encuesta Continua de Empleo* (fuente del indicador de informalidad laboral del 84,2 %) | Secundaria — dato por remitir a su cuadro oficial | https://www.ine.gob.bo/index.php/desocupacion/ |

> **Salvedad sobre el indicador de informalidad.** A diferencia de las cifras del parque automotor, el 84,2 % de informalidad laboral procede de la Encuesta Continua de Empleo del INE por vía de difusión secundaria, y no del cuadro estadístico original. Se emplea, por tanto, únicamente como **caracterización cualitativa** del sector y no interviene en ningún cálculo del documento.

> **Nota de método.** Las cifras de motocicletas del Cuadro N.º 1.2 se presentan desagregadas por tipo de servicio; el total anual empleado aquí es la suma de las tres categorías (particular, público y oficial). Para 2024, por ejemplo: 855.268 + 2.278 + 15.004 = **872.550**; el total de 2025 se obtiene de la misma forma. Se deja constancia del procedimiento para que cada cifra sea reproducible a partir de la fuente.

> **Año de corte.** La serie se cierra en **2025**, el último año disponible en el momento de redactar: el INE publicó *Estadísticas del parque automotor 2003–2025* el 1 de julio de 2026.

---

## 2.2 Estado del Arte — Matriz de Extracción

Fuentes revisadas por pares, dentro de la ventana 2021–2026, seleccionadas por abordar el aislamiento entre inquilinos en arquitecturas compartidas.

| Referencia (Autor, Año) | Solución tecnológica (arquitectura) | Resultados clave | Vacío identificado (*Research Gap*) |
|---|---|---|---|
| **Dar, Hershcovitch & Morrison (2023)** · *Proc. ACM on Management of Data* (SIGMOD), art. 89 · DOI 10.1145/3588943 | Seguridad a nivel de fila (RLS) sobre PostgreSQL y SQL Server; proponen un esquema de consulta *data-oblivious* como defensa | Demuestran que RLS impide devolver datos no autorizados, **pero el tiempo de ejecución de la consulta filtra información**: mediante consultas que usan índices, un atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, cuántas veces existe. El ataque tuvo éxito contra instancias gestionadas en AWS. Su defensa alcanza seguridad con impacto mínimo en rendimiento para claves únicas | Su análisis se sitúa en un modelo de inquilinos **plano y de un solo nivel**: aborda el ataque y la defensa en la capa de consulta, no la **decisión arquitectónica** de dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna. Señalan además que los *benchmarks* establecidos (YCSB) no soportan multi-tenancy ni RLS |
| **Alobaywi et al. (2026)** · *IoT* (MDPI), 7(1), art. 21 · DOI 10.3390/iot7010021 | Revisión sistemática guiada por PRISMA de marcos de seguridad para entornos multi-inquilino IoT–nube | Categorizan las amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos, ataques de canal lateral y escalamiento de privilegios**. Evalúan marcos de nueva generación que buscan imponer aislamiento sin violar los límites estrictos de latencia y energía de sensores ligeros | Al ser una revisión, **identifica amenazas pero no propone ni valida una arquitectura concreta**. Su contexto son dispositivos IoT con restricciones de latencia y energía, no aplicaciones SaaS de gestión empresarial con estructura organizacional jerárquica |
| **Andriianenko (2026)** · Tesis de maestría, Universitatea Tehnică a Moldovei | Sistema SaaS de gestión de proyectos basado en microservicios; diseña, implementa y evalúa **esquema compartido** frente a **base de datos por inquilino** | El esquema compartido reduce el consumo de recursos pero incrementa la complejidad y los riesgos de aislamiento; la base por inquilino ofrece separación superior a costa de mayor sobrecarga operativa. Entrega recomendaciones prácticas para arquitectos | Evalúa ambos modelos como **alternativas planas y excluyentes**, sin considerar la seguridad a nivel de fila como refuerzo *dentro* del esquema compartido, ni una jerarquía de dos niveles con reglas de alcance distintas por tipo de entidad |
| **Simić, Dedeić, Stojkov & Prokić (2024)** · *IEEE Access*, 12, pp. 32597–32617 · DOI 10.1109/ACCESS.2024.3369031 | Jerarquía de **espacios de nombres** sobre infraestructura de nube distribuida en el borde de la red, para crear nubes virtuales con redistribución de CPU, memoria y almacenamiento entre niveles | La jerarquía de espacios de nombres sostiene el **aislamiento lógico entre inquilinos de distinto nivel**, permitiendo que un inquilino superior reorganice los recursos de los inferiores sin comprometer su separación | Es el trabajo más cercano en cuanto a **jerarquía**, pero su aislamiento opera sobre **recursos de infraestructura** —cómputo, memoria, almacenamiento—, no sobre las filas de una base de datos relacional compartida por una aplicación. No hay políticas de seguridad a nivel de fila ni reparto de entidades de negocio según su nivel |
| **Olabanji, Fitch & Matthew (2023)** · *WSEAS Transactions on Computers*, 22, pp. 25–43 · DOI 10.37394/23205.2023.22.4 | Revisión de **mapeo sistemático** sobre multi-tenancy en arquitecturas *cloud-native*: de 921 publicaciones relevadas seleccionan y clasifican 64 revisadas por pares (2015–2022) | Documentan los retos emergentes y las tendencias de la multi-tenancy en entornos de contenedores y orquestación, y confirman que el aislamiento entre inquilinos **sigue siendo un problema abierto** en la literatura reciente | Al ser una revisión de mapeo, **cataloga el estado del conocimiento sin proponer ni validar una arquitectura propia**. Su dominio es *cloud-native* y contenedores, no la jerarquía organizacional de dos niveles con aislamiento aplicado en el motor de base de datos |

### Fichas analíticas de las fuentes primarias

Desarrollo de cada entrada de la matriz, con el detalle que la tabla no permite condensar.

#### Ficha 1 — Dar, Hershcovitch & Morrison (2023)

| Campo | Contenido |
|---|---|
| **Referencia** | Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS Side Channels: Investigating Leakage of Row-Level Security Protected Data Through Query Execution Time. *Proceedings of the ACM on Management of Data, 1*(1), art. 89. |
| **Filiación / venue** | Tel Aviv University (Israel). *Proc. ACM Manag. Data* — publicación asociada a SIGMOD, una de las conferencias de mayor impacto en bases de datos. Indexada en Scopus y ACM DL. |
| **Problema abordado** | Determinar si la seguridad a nivel de fila, además de impedir la devolución de datos no autorizados, evita también la fuga de información por **efectos colaterales** de la ejecución de la consulta. |
| **Metodología** | Diseño y ejecución de ataques de canal lateral temporal sobre motores reales; desarrollo de un esquema de defensa *data-oblivious*; construcción de un banco de pruebas propio para multi-tenancy con RLS; medición del impacto de la defensa en el rendimiento. |
| **Tecnologías evaluadas** | PostgreSQL y SQL Server, tanto en instalación propia como en **instancias gestionadas en AWS**. |
| **Resultados clave** | (a) Mediante consultas que fuerzan el uso de índices, el atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, **cuántas veces** existe. (b) El ataque tuvo éxito desde máquinas virtuales situadas en el mismo centro de datos y en otros distintos. (c) La defensa propuesta alcanza seguridad con impacto mínimo en rendimiento para claves únicas. (d) Los bancos de prueba establecidos, como YCSB, **no soportan multi-tenancy ni RLS**, lo que obligó a los autores a crear uno. |
| **Limitaciones declaradas por los autores** | La solución *data-oblivious* está resuelta plenamente para **claves únicas**; para claves no únicas los autores analizan los compromisos que introduce, sin cerrar el caso general. |
| **Vacío frente a este proyecto** | Trabajan sobre un modelo de inquilinos **plano y de un solo nivel**, en la capa de consulta. No abordan la decisión arquitectónica previa: dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna con entidades de distinto alcance. |
| **Aporte a este proyecto** | Fundamenta empíricamente que RLS, por sí solo, **no constituye una garantía absoluta**, lo que respalda la decisión de defensa en profundidad (RLS + verificación en la capa de aplicación) adoptada en el diseño. |

#### Ficha 2 — Alobaywi et al. (2026)

| Campo | Contenido |
|---|---|
| **Referencia** | Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. |
| **Filiación / venue** | *IoT* (MDPI), revista de acceso abierto revisada por pares e indexada en Scopus. Publicación: 22 de febrero de 2026. |
| **Problema abordado** | Sistematizar las amenazas de seguridad propias de entornos multi-inquilino en la intersección IoT–nube, y evaluar si los marcos de protección existentes logran imponer aislamiento sin degradar el rendimiento. |
| **Metodología** | Revisión sistemática de literatura conducida según el protocolo **PRISMA**, con selección de estudios de alta calidad y categorización temática de amenazas. |
| **Hallazgos clave** | Clasifican tres familias de amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos**, **ataques de canal lateral** y **escalamiento de privilegios**. Evalúan marcos de nueva generación que buscan garantizar el aislamiento respetando límites estrictos de latencia (por debajo de 10 ms) y de consumo energético propios de sensores ligeros. |
| **Limitaciones** | Al ser una revisión, **no propone ni valida una arquitectura concreta**: sintetiza el estado del conocimiento y señala tensiones, sin evidencia de implementación propia. |
| **Vacío frente a este proyecto** | Su contexto de aplicación son dispositivos IoT con restricciones de latencia y energía, no aplicaciones SaaS de gestión empresarial. Tampoco contempla estructuras organizacionales jerárquicas entre inquilinos. |
| **Aporte a este proyecto** | Confirma que la **fuga entre inquilinos y los canales laterales** son amenazas reconocidas y vigentes en la literatura reciente, lo que sitúa el problema de este proyecto dentro de una línea de investigación activa y no anecdótica. |

#### Ficha 3 — Andriianenko (2026)

| Campo | Contenido |
|---|---|
| **Referencia** | Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. |
| **Filiación / venue** | Universidad Técnica de Moldavia. Repositorio institucional de acceso abierto. Tesis de maestría en ciencias de la computación — categoría admitida explícitamente por los criterios de inclusión declarados al inicio del capítulo. |
| **Problema abordado** | Determinar qué modelo de multi-tenancy en base de datos conviene a un sistema SaaS de gestión de proyectos basado en microservicios que atiende a varias organizaciones. |
| **Metodología** | Diseño, implementación y **evaluación comparativa** de dos arquitecturas sobre el mismo sistema, contrastando sus compromisos en seguridad y eficiencia operativa. |
| **Alternativas evaluadas** | **Esquema compartido** (*shared-database, shared-schema*) frente a **base de datos por inquilino** (*database-per-tenant*). |
| **Resultados clave** | El esquema compartido minimiza el consumo de recursos pero **incrementa la complejidad y el riesgo de aislamiento**; la base por inquilino ofrece una separación de datos superior a costa de una **sobrecarga operativa más elevada**. Deriva recomendaciones prácticas para arquitectos de software y responsables de negocio. |
| **Limitaciones** | Evalúa los dos modelos como alternativas **planas y mutuamente excluyentes**. |
| **Vacío frente a este proyecto** | No considera la seguridad a nivel de fila como mecanismo de refuerzo *dentro* del esquema compartido —es decir, como vía para obtener parte de la separación del modelo por inquilino sin asumir su costo operativo— ni contempla una jerarquía de dos niveles con reglas de alcance diferenciadas por tipo de entidad. |
| **Aporte a este proyecto** | Es el comparable metodológico más cercano: valida que "diseñar, implementar y evaluar arquitecturas multi-tenant" constituye un trabajo de nivel de maestría, y aporta el marco de compromisos (recursos frente a aislamiento) sobre el que se apoya la selección arquitectónica de este proyecto. |

#### Ficha 4 — Simić, Dedeić, Stojkov & Prokić (2024)

| Campo | Contenido |
|---|---|
| **Referencia** | Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. |
| **Filiación / venue** | Universidad de Novi Sad (Serbia). *IEEE Access* — revista de acceso abierto revisada por pares, indexada en Scopus y en IEEE Xplore. |
| **Problema abordado** | Cómo sostener multi-tenancy en el modelo de micro-nube en el borde de la red, organizando y redistribuyendo recursos entre niveles sin perder el aislamiento lógico entre inquilinos. |
| **Metodología** | Diseño de un modelo de nubes virtuales sobre infraestructura física mediante una jerarquía de espacios de nombres, con implementación y evaluación del comportamiento del aislamiento y de la redistribución de recursos. |
| **Resultados clave** | La jerarquía de espacios de nombres permite que un nivel superior reorganice CPU, memoria y almacenamiento de los niveles inferiores conservando la separación lógica entre nubes virtuales. |
| **Vacío frente a este proyecto** | Es el antecedente **más cercano en cuanto a jerarquía**, y por eso resulta el más exigente de contrastar. Su aislamiento, sin embargo, opera sobre **recursos de infraestructura**, no sobre filas de una base de datos relacional compartida: no emplea políticas de seguridad a nivel de fila ni distribuye entidades de negocio entre los niveles de la jerarquía según su alcance. |
| **Aporte a este proyecto** | Demuestra que la multi-tenancy **jerárquica** es una línea de investigación vigente y publicable en un venue de impacto, y delimita con precisión el aporte propio: trasladar la jerarquía desde la capa de infraestructura hasta la capa de datos. |

#### Ficha 5 — Olabanji, Fitch & Matthew (2023)

| Campo | Contenido |
|---|---|
| **Referencia** | Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. |
| **Filiación / venue** | Universidad de Portsmouth y Southampton Solent University (Reino Unido). *WSEAS Transactions on Computers* — revista revisada por pares, de acceso abierto. |
| **Problema abordado** | Sistematizar qué se ha investigado sobre multi-tenancy en arquitecturas *cloud-native* y qué retos permanecen abiertos. |
| **Metodología** | Mapeo sistemático: de **921 publicaciones** potencialmente relevantes se seleccionan **64 revisadas por pares** (2015–2022), clasificadas mediante un marco de caracterización. |
| **Resultados clave** | Identifican los retos emergentes y las tendencias de la multi-tenancy en contenedores y orquestación, y constatan que el aislamiento entre inquilinos permanece como problema abierto pese a los avances del período. |
| **Limitaciones** | Al ser una revisión de mapeo, **no propone ni valida arquitectura alguna**: sintetiza y clasifica el conocimiento existente. |
| **Vacío frente a este proyecto** | Su dominio son las arquitecturas *cloud-native* y los contenedores, no la jerarquía organizacional de dos niveles con aislamiento aplicado en el motor de base de datos. |
| **Aporte a este proyecto** | Aporta **respaldo cuantitativo a la vigencia del problema**: sobre una base de 921 publicaciones relevadas, el aislamiento entre inquilinos sigue catalogado como reto abierto, lo que sitúa este proyecto en una línea activa y no marginal. |

### Síntesis comparativa

| Criterio | Dar et al. (2023) | Alobaywi et al. (2026) | Andriianenko (2026) | Simić et al. (2024) | Olabanji et al. (2023) | **Este proyecto** |
|---|---|---|---|---|---|---|
| Tipo de trabajo | Investigación experimental | Revisión sistemática | Tesis con implementación | Investigación experimental | Revisión de mapeo | Tesis con implementación |
| Niveles de inquilino | Uno (plano) | Uno (plano) | Uno (plano) | Jerárquico (infraestructura) | Uno (plano) | **Dos (jerárquico, en los datos)** |
| Mecanismo de aislamiento estudiado | RLS | Varios marcos | Esquema compartido / base por inquilino | Espacios de nombres | Varios | **RLS + verificación en aplicación** |
| Capa donde se aplica el aislamiento | Consulta | Varias | Base de datos | **Infraestructura** | Varias | **Motor de base de datos + aplicación** |
| ¿Propone arquitectura? | No (ataque y defensa) | No | Sí | Sí | No | Sí |
| ¿Valida empíricamente? | Sí | No | Sí | Sí | No | Sí |
| Dominio de aplicación | Genérico | IoT–nube | SaaS de gestión de proyectos | Nube distribuida en el borde | *Cloud-native* | **SaaS de gestión de talleres (Bolivia)** |
| Despliegue | Instancias gestionadas | No aplica | Microservicios | Micro-nubes en el borde | Contenedores | **Serverless** |

### Evidencia técnica primaria complementaria

No constituye literatura académica —son registros oficiales de vulnerabilidad— pero aporta evidencia verificable de que la aplicación de políticas RLS ha fallado de forma **recurrente** en implementaciones de producción, lo que sustenta el argumento de no depender de una única capa de aislamiento:

| Identificador | Año | Descripción |
|---|---|---|
| **CVE-2016-2193** | 2016 | Aplicación de política de seguridad de fila incorrecta ante reutilización de planes de consulta |
| **CVE-2023-2455** | 2023 | Nuevo caso del mismo tipo, no cubierto por la corrección anterior |
| **CVE-2024-10976** | 2024 | Seguimiento incompleto de tablas con seguridad de fila en PostgreSQL (versiones previas a 17.1, 16.5, 15.9, 14.14, 13.17 y 12.21). Se manifiesta cuando una subconsulta, consulta `WITH`, vista *security invoker* o función SQL referencia una tabla con política RLS; **aplicar una política incorrecta puede permitir lecturas y modificaciones prohibidas**. CVSS 5.4, CWE-1250 |

Referencia: https://www.wiz.io/vulnerability-database/cve/cve-2024-10976 · https://www.suse.com/security/cve/CVE-2024-10976.html

---

## 2.3 Vacío de Investigación

La solución propuesta por **Dar et al. (2023)** es rigurosa y demuestra empíricamente que la seguridad a nivel de fila cumple su función como control de acceso en bases de datos compartidas; **sin embargo**, su análisis se limita a un modelo de inquilinos plano y de un solo nivel, y se concentra en el ataque y la defensa en la capa de consulta, sin abordar la decisión arquitectónica previa: **dónde ubicar el límite de aislamiento cuando el inquilino posee una subdivisión interna** cuyas entidades no comparten el mismo alcance. **Alobaywi et al. (2026)** sistematizan las amenazas de fuga entre inquilinos y de canal lateral, **pero**, al tratarse de una revisión centrada en entornos IoT–nube con restricciones de latencia y energía, identifican riesgos sin proponer ni validar una arquitectura aplicable a un SaaS de gestión empresarial. **Andriianenko (2026)**, por su parte, compara esquema compartido frente a base por inquilino, **no obstante** los evalúa como alternativas planas y mutuamente excluyentes, sin considerar la seguridad a nivel de fila como refuerzo dentro del esquema compartido.

El antecedente que más se aproxima es **Simić et al. (2024)**, que sí modelan una **jerarquía** de inquilinos y demuestran que el aislamiento se sostiene entre sus niveles; **ahora bien**, esa jerarquía organiza **recursos de infraestructura** —cómputo, memoria y almacenamiento— y no las filas de una base de datos relacional compartida, de modo que no responde cómo repartir las entidades de negocio entre los niveles ni cómo hacer cumplir esa separación en el motor de datos. Por último, **Olabanji et al. (2023)**, sobre una base de 921 publicaciones relevadas, confirman que el aislamiento entre inquilinos permanece como reto abierto, **aunque**, al ser una revisión de mapeo, catalogan el conocimiento sin proponer ni validar arquitectura alguna. A todo ello se suma que la serie de vulnerabilidades registradas en la aplicación de políticas RLS (CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976) evidencia que confiar en una sola capa de aislamiento resulta insuficiente en la práctica.

El presente proyecto aborda esta deficiencia mediante el **diseño, implementación y validación de una arquitectura multi-tenant jerárquica (organización → talleres)** que mantiene un **único límite de aislamiento verificable** a nivel de organización, tratando el taller como criterio de alcance operativo y no como segunda frontera de seguridad; refuerza la seguridad a nivel de fila con **verificación de membresía en la capa de aplicación** (defensa en profundidad), en respuesta directa al patrón de fallos evidenciado por los CVE; y **valida empíricamente la separación de datos** por dos vías independientes —a través de la interfaz de programación y mediante acceso directo a la base de datos—, demostrando que el aislamiento se sostiene aun cuando la capa de aplicación omita sus controles.

---

## 2.4 Referencias

Se separan en tres bloques según **cómo se verifica cada uno**: los libros por ISBN en catálogo editorial, los artículos por DOI, y los enlaces por consulta directa de la página. El estado de comprobación de cada entrada está en [Verificación de referencias](anexo-referencias.md).

### A. Libros publicados

*Se verifican por ISBN. No llevan URL: la fuente es la obra impresa o su edición electrónica en catálogo.*

| # | Referencia (APA 7) | ISBN |
|---|---|---|
| L1 | Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional. | 978-0-13-688609-9 |
| L2 | Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media. | 978-1-4920-4345-4 |
| L3 | Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O'Reilly Media. | 978-1-4920-3402-5 |
| L4 | Kleppmann, M. (2017). *Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems*. O'Reilly Media. | 978-1-4493-7332-0 |
| L5 | Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional. | 978-0-321-60191-9 |
| L6 | Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps. Building and scaling high performing technology organizations*. IT Revolution Press. | 978-1-942788-33-1 |
| L7 | Hernández-Sampieri, R., & Mendoza Torres, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education. | 978-1-4562-6096-5 |

> **Alcance de este bloque.** Ninguno de estos libros se cita en el cuerpo del capítulo 2: el estado del arte se sostiene con los artículos del bloque B y las fuentes oficiales del bloque C. La lista reúne la **bibliografía de base del anteproyecto completo**, y todas sus entradas están citadas en algún capítulo — L1 (§3.2.1), L2 (§3.2.1 y §3.2.5), L3 (§3.3), L4 (§3.2.2 y §3.3), L5 y L6 (§3.2.5) y L7 (perfil §9.1 y anteproyecto §14).

### B. Artículos y tesis con identificador permanente

*Se verifican por DOI o por el identificador del repositorio institucional.*

| # | Referencia (APA 7) | Identificador |
|---|---|---|
| A1 | Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. | https://doi.org/10.1145/3588943 |
| A2 | Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. | https://doi.org/10.3390/iot7010021 |
| A3 | Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. Repositorio institucional UTM. | https://repository.utm.md/handle/5014/35481 |
| A4 | Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. | https://doi.org/10.1109/ACCESS.2024.3369031 |
| A5 | Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. | https://doi.org/10.37394/23205.2023.22.4 |

### C. Enlaces — fuentes estadísticas y registros oficiales

*Se verifican consultando la página. Al no tener identificador permanente, requieren fecha de recuperación.*

| # | Referencia (APA 7) | Enlace |
|---|---|---|
| E1 | Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del RUAT. | https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/ |
| E2 | Instituto Nacional de Estadística de Bolivia. (2025). *Boletín estadístico parque automotor 2024*. | https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/ |
| E3 | Instituto Nacional de Estadística de Bolivia. (2026). *Estadísticas del parque automotor 2003–2025*. | https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/ |
| E4 | *CVE-2024-10976: PostgreSQL incomplete tracking of tables with row security*. (2024). Wiz Vulnerability Database. | https://www.wiz.io/vulnerability-database/cve/cve-2024-10976 |

> **Formato**: todas las referencias siguen el estilo **APA (7.ª edición)**. Las obras de esta lista que se emplean como sustento teórico se citan en el cuerpo del [capítulo 3](03-marco-teorico-y-conceptual.md), donde figuran además sus propias referencias; las que sustentan el estado del arte ya están citadas en este capítulo. El estado de comprobación de cada identificador está en el [Anexo de referencias](anexo-referencias.md).
