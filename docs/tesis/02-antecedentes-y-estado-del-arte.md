# 2. Antecedentes y Estado del Arte

*(Sesión 2 del Seminario: Antecedentes locales → Estado del Arte global → Matriz de Extracción → Vacío de Investigación.)*

## Reglas del módulo aplicadas

- **Antecedentes ≠ Estado del Arte.** Antecedentes = contexto del sector donde ocurre el problema. Estado del Arte = frontera científica global sobre la tecnología.
- El Estado del Arte se construye **solo con fuentes revisadas por pares** (ACM, IEEE, Scopus, Google Scholar, OATD, BASE). No se cita ningún blog, tutorial de Medium/YouTube ni Wikipedia.
- **Criterios de inclusión**: publicaciones de los últimos cinco años (2021–2026), tesis de maestría o doctorado en ciencias de la computación, y trabajos con problemas arquitectónicos similares aunque el rubro sea distinto.
- **Criterios de exclusión**: soluciones sobre tecnologías legadas y artículos de opinión sin validación métrica.
- De cada fuente no se busca el resumen, sino su **limitación** — el "SIN EMBARGO" que abre la oportunidad de este proyecto.

---

## 2.1 Antecedentes

**El parque de motocicletas de Bolivia y su demanda de servicio.** La motocicleta es el vehículo más numeroso del país: según el Instituto Nacional de Estadística (INE), a partir de los registros del Registro Único para la Administración Tributaria Municipal (RUAT), en 2024 se contabilizaron **872.550 motocicletas**, cifra que encabeza el parque automotor nacional por delante de vagonetas, automóviles y camionetas, sobre un total de **2.583.319 vehículos**. Su crecimiento es sostenido y superior al del parque en conjunto: pasó de **657.718 unidades en 2021** a **800.890 en 2023** y a **872.550 en 2024**, un incremento cercano al **33 % en tres años**, frente al 4,6 % de crecimiento interanual del parque total. Cada una de esas unidades requiere mantenimiento periódico y reparaciones, lo que sostiene una red amplia de talleres de servicio distribuida por todo el territorio — una base de negocio que crece año a año y que, al hacerlo, empuja a los operadores más exitosos a abrir locales adicionales.

**Condiciones del sector que explican el problema.** Ese crecimiento ocurre, sin embargo, en una economía marcadamente informal: el INE reporta una **informalidad laboral del 84,2 % en 2024**, una tendencia que se ha agravado de forma sostenida durante las últimas dos décadas. Para el rubro de talleres esto se traduce en unidades de negocio pequeñas, con presupuesto de tecnología muy limitado y baja adopción de software especializado, donde la gestión se apoya todavía en registros en papel u hojas de cálculo. En ese contexto, el operador que crece —el que abre una segunda o tercera sucursal, o constituye más de una empresa— se encuentra sin herramientas que le permitan administrarlas de forma centralizada: debe optar entre llevar cada local como una instalación independiente, perdiendo la visión unificada del cliente y su historial, o renunciar a la especialización y volver a soluciones genéricas. Este es precisamente el escenario que el presente proyecto aborda.

### Fuentes consultadas para los antecedentes

| Fuente | Tipo | Enlace |
|---|---|---|
| INE — Parque Automotor, cuadros estadísticos (datos originados en el RUAT) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/ |
| INE — Boletín Estadístico Parque Automotor 2023 | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2023/ |
| INE — Estadísticas del Parque Automotor 2003–2022 (serie histórica) | **Primaria** (oficial) | https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2022/ |
| Reporte de prensa sobre el crecimiento del parque automotor (cifras del INE) | Secundaria | https://www.abi.bo/index.php/economia2/36609-en-2022-el-parque-automotor-crecio-en-12-y-llego-a-2-493-753-vehiculos |
| Reporte de prensa sobre informalidad laboral (cifras del INE) | Secundaria | https://lapatria.bo/dinero-negocios/la-informalidad-laboral-en-bolivia-se-eleva-al-842-en-2024/ |

> Las cifras citadas provienen del INE; las notas de prensa se listan únicamente como vía de acceso a los datos publicados. **Antes de la entrega final conviene descargar el boletín del INE del año correspondiente y citar la tabla exacta**, para que la referencia sea al documento oficial y no a su difusión periodística.

---

## 2.2 Estado del Arte — Matriz de Extracción

Fuentes revisadas por pares, dentro de la ventana 2021–2026, seleccionadas por abordar el aislamiento entre inquilinos en arquitecturas compartidas.

| Referencia (Autor, Año) | Solución tecnológica (arquitectura) | Resultados clave | Vacío identificado (*Research Gap*) |
|---|---|---|---|
| **Dar, Hershcovitch & Morrison (2023)** · *Proc. ACM on Management of Data* (SIGMOD), art. 89 · DOI 10.1145/3588943 | Seguridad a nivel de fila (RLS) sobre PostgreSQL y SQL Server; proponen un esquema de consulta *data-oblivious* como defensa | Demuestran que RLS impide devolver datos no autorizados, **pero el tiempo de ejecución de la consulta filtra información**: mediante consultas que usan índices, un atacante determina si existe un valor que no está autorizado a ver y, en ciertos casos, cuántas veces existe. El ataque tuvo éxito contra instancias gestionadas en AWS. Su defensa alcanza seguridad con impacto mínimo en rendimiento para claves únicas | Su análisis se sitúa en un modelo de inquilinos **plano y de un solo nivel**: aborda el ataque y la defensa en la capa de consulta, no la **decisión arquitectónica** de dónde ubicar el límite de aislamiento cuando el inquilino tiene una subdivisión interna. Señalan además que los *benchmarks* establecidos (YCSB) no soportan multi-tenancy ni RLS |
| **Almutairi & Sheldon (2026)** · *IoT* (MDPI), 7(1), art. 21 · DOI 10.3390/iot7010021 | Revisión sistemática guiada por PRISMA de marcos de seguridad para entornos multi-inquilino IoT–nube | Categorizan las amenazas de intersección entre inquilinos: **fuga de datos entre inquilinos, ataques de canal lateral y escalamiento de privilegios**. Evalúan marcos de nueva generación que buscan imponer aislamiento sin violar los límites estrictos de latencia y energía de sensores ligeros | Al ser una revisión, **identifica amenazas pero no propone ni valida una arquitectura concreta**. Su contexto son dispositivos IoT con restricciones de latencia y energía, no aplicaciones SaaS de gestión empresarial con estructura organizacional jerárquica |
| **Andriianenko (2026)** · Tesis de maestría, Universitatea Tehnică a Moldovei | Sistema SaaS de gestión de proyectos basado en microservicios; diseña, implementa y evalúa **esquema compartido** frente a **base de datos por inquilino** | El esquema compartido reduce el consumo de recursos pero incrementa la complejidad y los riesgos de aislamiento; la base por inquilino ofrece separación superior a costa de mayor sobrecarga operativa. Entrega recomendaciones prácticas para arquitectos | Evalúa ambos modelos como **alternativas planas y excluyentes**, sin considerar la seguridad a nivel de fila como refuerzo *dentro* del esquema compartido, ni una jerarquía de dos niveles con reglas de alcance distintas por tipo de entidad |

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

#### Ficha 2 — Almutairi & Sheldon (2026)

| Campo | Contenido |
|---|---|
| **Referencia** | Almutairi, M. G., & Sheldon, F. T. (2026). Performance Trade-Offs in Multi-Tenant IoT–Cloud Security: A Systematic Review of Emerging Technologies. *IoT, 7*(1), 21. |
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
| **Filiación / venue** | Universidad Técnica de Moldavia. Repositorio institucional de acceso abierto. Tesis de maestría en ciencias de la computación — categoría admitida explícitamente por los criterios de inclusión del módulo. |
| **Problema abordado** | Determinar qué modelo de multi-tenancy en base de datos conviene a un sistema SaaS de gestión de proyectos basado en microservicios que atiende a varias organizaciones. |
| **Metodología** | Diseño, implementación y **evaluación comparativa** de dos arquitecturas sobre el mismo sistema, contrastando sus compromisos en seguridad y eficiencia operativa. |
| **Alternativas evaluadas** | **Esquema compartido** (*shared-database, shared-schema*) frente a **base de datos por inquilino** (*database-per-tenant*). |
| **Resultados clave** | El esquema compartido minimiza el consumo de recursos pero **incrementa la complejidad y el riesgo de aislamiento**; la base por inquilino ofrece una separación de datos superior a costa de una **sobrecarga operativa más elevada**. Deriva recomendaciones prácticas para arquitectos de software y responsables de negocio. |
| **Limitaciones** | Evalúa los dos modelos como alternativas **planas y mutuamente excluyentes**. |
| **Vacío frente a este proyecto** | No considera la seguridad a nivel de fila como mecanismo de refuerzo *dentro* del esquema compartido —es decir, como vía para obtener parte de la separación del modelo por inquilino sin asumir su costo operativo— ni contempla una jerarquía de dos niveles con reglas de alcance diferenciadas por tipo de entidad. |
| **Aporte a este proyecto** | Es el comparable metodológico más cercano: valida que "diseñar, implementar y evaluar arquitecturas multi-tenant" constituye un trabajo de nivel de maestría, y aporta el marco de compromisos (recursos frente a aislamiento) sobre el que se apoya la selección arquitectónica de este proyecto. |

### Síntesis comparativa

| Criterio | Dar et al. (2023) | Almutairi & Sheldon (2026) | Andriianenko (2026) | **Este proyecto** |
|---|---|---|---|---|
| Tipo de trabajo | Investigación experimental | Revisión sistemática | Tesis con implementación | Tesis con implementación |
| Niveles de inquilino | Uno (plano) | Uno (plano) | Uno (plano) | **Dos (jerárquico)** |
| Mecanismo de aislamiento estudiado | RLS | Varios marcos | Esquema compartido / base por inquilino | **RLS + verificación en aplicación** |
| ¿Propone arquitectura? | No (ataque y defensa) | No | Sí | Sí |
| ¿Valida empíricamente? | Sí | No | Sí | Sí |
| Dominio de aplicación | Genérico | IoT–nube | SaaS de gestión de proyectos | **SaaS de gestión de talleres (Bolivia)** |
| Despliegue | Instancias gestionadas | No aplica | Microservicios | **Serverless** |

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

La solución propuesta por **Dar et al. (2023)** es rigurosa y demuestra empíricamente que la seguridad a nivel de fila cumple su función como control de acceso en bases de datos compartidas; **SIN EMBARGO**, su análisis se limita a un modelo de inquilinos plano y de un solo nivel, y se concentra en el ataque y la defensa en la capa de consulta, sin abordar la decisión arquitectónica previa: **dónde ubicar el límite de aislamiento cuando el inquilino posee una subdivisión interna** cuyas entidades no comparten el mismo alcance. **Almutairi & Sheldon (2026)** sistematizan las amenazas de fuga entre inquilinos y de canal lateral, **PERO**, al tratarse de una revisión centrada en entornos IoT–nube con restricciones de latencia y energía, identifican riesgos sin proponer ni validar una arquitectura aplicable a un SaaS de gestión empresarial. **Andriianenko (2026)**, por su parte, compara esquema compartido frente a base por inquilino, **NO OBSTANTE** los evalúa como alternativas planas y mutuamente excluyentes, sin considerar la seguridad a nivel de fila como refuerzo dentro del esquema compartido. A ello se suma que la serie de vulnerabilidades registradas en la aplicación de políticas RLS (CVE-2016-2193, CVE-2023-2455 y CVE-2024-10976) evidencia que confiar en una sola capa de aislamiento resulta insuficiente en la práctica.

El presente proyecto aborda esta deficiencia mediante el **diseño, implementación y validación de una arquitectura multi-tenant jerárquica (empresa → sucursales)** que mantiene un **único límite de aislamiento verificable** a nivel de empresa, tratando la sucursal como criterio de alcance operativo y no como segunda frontera de seguridad; refuerza la seguridad a nivel de fila con **verificación de membresía en la capa de aplicación** (defensa en profundidad), en respuesta directa al patrón de fallos evidenciado por los CVE; y **valida empíricamente la separación de datos** por dos vías independientes —a través de la interfaz de programación y mediante acceso directo a la base de datos—, demostrando que el aislamiento se sostiene aun cuando la capa de aplicación omita sus controles.

---

## 2.4 Referencias

**Literatura revisada por pares**

1. Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS Side Channels: Investigating Leakage of Row-Level Security Protected Data Through Query Execution Time. *Proceedings of the ACM on Management of Data*, 1(1), Artículo 89, 25 pp. https://doi.org/10.1145/3588943

2. Almutairi, M. G., & Sheldon, F. T. (2026). Performance Trade-Offs in Multi-Tenant IoT–Cloud Security: A Systematic Review of Emerging Technologies. *IoT*, 7(1), 21. https://doi.org/10.3390/iot7010021

3. Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. https://repository.utm.md/handle/5014/35481

**Libros — arquitectura de software**

4. Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional. ISBN 978-0-13-688609-9

5. Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media. ISBN 978-1-4920-4345-4

6. Evans, E. (2003). *Domain-driven design: Tackling complexity in the heart of software*. Addison-Wesley Professional. ISBN 978-0-321-12521-7

7. Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O'Reilly Media. ISBN 978-1-4920-3402-5

**Libros — datos, persistencia y bases de datos**

8. Kleppmann, M. (2017). *Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems*. O'Reilly Media. ISBN 978-1-4493-7332-0

9. Obe, R. O., & Hsu, L. S. (2017). *PostgreSQL: Up and running. A practical guide to the advanced open source database* (3.ª ed.). O'Reilly Media. ISBN 978-1-4919-6341-8

**Libros — computación en la nube y arquitecturas serverless**

10. Sbarski, P., Cui, Y., & Nair, A. (2022). *Serverless architectures on AWS* (2.ª ed.). Manning Publications. ISBN 978-1-61729-542-3

**Libros — ingeniería de software, entrega continua y requisitos**

11. Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional. ISBN 978-0-321-60191-9

12. Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps. Building and scaling high performing technology organizations*. IT Revolution Press. ISBN 978-1-942788-33-1

13. Cohn, M. (2004). *User stories applied: For agile software development*. Addison-Wesley Professional. ISBN 978-0-321-20568-1

**Libros — metodología de la investigación**

14. Hernández-Sampieri, R., & Mendoza Torres, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill Education. ISBN 978-1-4562-6096-5

15. Hernández Sampieri, R., Fernández Collado, C., & Baptista Lucio, M. P. (2014). *Metodología de la investigación* (6.ª ed.). McGraw-Hill Interamericana. ISBN 978-1-4562-2396-0

**Fuentes estadísticas oficiales**

16. Instituto Nacional de Estadística de Bolivia. (s. f.). *Parque automotor — Cuadros estadísticos*. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

17. Instituto Nacional de Estadística de Bolivia. (2023). *Boletín estadístico parque automotor 2023*. https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2023/

**Registros de vulnerabilidad**

18. *CVE-2024-10976: PostgreSQL incomplete tracking of tables with row security*. (2024). https://www.wiz.io/vulnerability-database/cve/cve-2024-10976

### Uso previsto de la bibliografía de libros

Cada obra sustenta una parte concreta del trabajo; no se incluyen como relleno bibliográfico:

| Obra | Sustenta |
|---|---|
| Bass, Clements & Kazman (2021) | Marco conceptual de atributos de calidad y tácticas arquitectónicas; base para justificar la seguridad como atributo de calidad dirigido por el diseño |
| Richards & Ford (2020) | Criterios de decisión arquitectónica y registro de decisiones (ADR); estilo de documentación adoptado en el proyecto |
| Evans (2003) | Modelado del dominio: delimitación de las entidades empresa, sucursal, membresía y su lenguaje ubicuo (glosario) |
| Newman (2021) | Contraste con el enfoque de microservicios que emplean los comparables del estado del arte |
| Kleppmann (2017) | Fundamentos de sistemas de datos: modelos de almacenamiento, consistencia y transacciones, aplicados a las operaciones de existencias |
| Obe & Hsu (2017) | Referencia técnica de PostgreSQL, motor sobre el que se implementan las políticas de seguridad a nivel de fila |
| Sbarski, Cui & Nair (2022) | Fundamento del modelo de despliegue serverless y sus compromisos operativos |
| Humble & Farley (2010) | Diseño del pipeline de integración y entrega continua |
| Forsgren, Humble & Kim (2018) | Justificación empírica de las prácticas de entrega continua y su relación con el desempeño |
| Cohn (2004) | Formato y criterios de aceptación de las historias de usuario |
| Hernández-Sampieri & Mendoza (2018); Hernández Sampieri et al. (2014) | Marco metodológico: tipo y enfoque de investigación, y diseño de la validación |

> **Formato**: todas las referencias siguen el estilo **APA (7.ª edición)**. Falta añadir las citas dentro del cuerpo del texto conforme se redacten los capítulos siguientes; las de este capítulo ya están incorporadas.

> **Nota de verificación**: la referencia 1 fue verificada mediante **extracción del texto completo** del artículo (título, autores, filiación, venue, DOI y resumen confirmados directamente del documento). Las referencias 2 y 3 se verificaron contra la ficha del editor y del repositorio institucional respectivamente; **antes de la defensa conviene acceder a su texto completo** para citar resultados concretos y no solo lo declarado en sus resúmenes. Los datos bibliográficos de los libros (autoría, edición, año, editorial e ISBN) se verificaron contra catálogos editoriales y de distribución.
