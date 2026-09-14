# Anexo · Verificación de referencias

Estado de comprobación de cada fuente citada en el anteproyecto. Una referencia con datos incorrectos compromete la trazabilidad de la información tanto como una inventada, de modo que cada identificador se contrastó contra el registro del editor.

**Última comprobación**: 14 de septiembre de 2026, para las cuatro fuentes incorporadas al ajustar la documentación a la guía metodológica —Cronbach (1951), Hevner et al. (2004), Brown (s. f.) y la Constitución Política del Estado—. La comprobación general anterior es del 18 de agosto de 2026: en esa fecha se verificaron contra el **texto completo del editor** las entradas antes marcadas `Parcial` por metadatos, y se añadió a cada fuente un **enlace de acceso** localizado en las bases consultadas: [Google Scholar](https://scholar.google.com/), [OATD](https://oatd.org/), [BASE](https://api.base-search.net/), Scopus / Web of Science, IEEE Xplore y ACM DL.

## Cómo se verificó cada tipo de fuente

| Tipo | Método | Qué demuestra |
|---|---|---|
| Artículos y ponencias | Consulta a la **API de Crossref** por DOI (`api.crossref.org/works/{doi}`) | Que el DOI existe y que autores, año, título, revista, volumen y páginas coinciden con lo registrado por el editor |
| Libros | Consulta por **ISBN** al catálogo de OpenLibrary, contrastada con la **página del editor** | Que el ISBN corresponde a la obra, el autor y la editorial declarados |
| Documentos normativos | Resolución del DOI o del identificador del organismo | Que el estándar existe con ese número y esa autoría |
| Enlaces | Petición HTTP a la URL | Que la página está accesible en la fecha de consulta |
| **Contenido** | **Descarga y lectura del texto completo** cuando existe copia de acceso abierto | Que la afirmación atribuida a la fuente **está efectivamente en ella** |

> Los cuatro primeros métodos comprueban los **datos bibliográficos**; el quinto, el **contenido**. Que una referencia figure aquí como comprobada en metadatos no significa que se haya leído su texto completo: esa distinción se marca en la columna «Contenido».

**Estados**: `OK` comprobado · `Parcial` comprobado a medias, con la salvedad indicada · `Falta` no comprobado, requiere acción antes de la entrega.

---

## 1. Estado por referencia

### 1.1 Artículos y ponencias revisadas por pares

| Cap. | Ref. | Autor y año | Metadatos del editor | Contenido | Acceso al texto |
|---|---|---|---|---|---|
| 2 | A1 | Dar, Hershcovitch & Morrison (2023) | OK — *Proc. ACM Manag. Data*, 1(1), art. 89, pp. 1–25 · ACM | OK — texto completo leído | [doi.org/10.1145/3588943](https://doi.org/10.1145/3588943) |
| 2 | A2 | Alobaywi, Almutairi & Sheldon (2026) | OK — *IoT*, 7(1), 21 · MDPI · publicado 22-02-2026 | `Parcial` — solo resumen | **Acceso abierto**: [mdpi.com/2624-831X/7/1/21](https://www.mdpi.com/2624-831X/7/1/21) |
| 2 | A3 | Andriianenko (2026) | OK — repositorio UTM accesible; ficha confirmada: Universidad Técnica de Moldavia, Facultad de Computadores, Informática y Microelectrónica; licencia CC BY-NC-ND 3.0 | `Parcial` — solo resumen | **PDF descargable (353 KB)**: [repository.utm.md/handle/5014/35481](https://repository.utm.md/handle/5014/35481) |
| 2 | A4 | Simić, Dedeić, Stojkov & Prokić (2024) | OK — *IEEE Access*, 12, pp. 32597–32617 · cuatro autores confirmados por Crossref | `Parcial` — solo resumen | **Acceso abierto (CC BY 4.0)**: [ieeexplore.ieee.org/document/10443611](https://ieeexplore.ieee.org/document/10443611/) |
| 2 | A5 | Olabanji, Fitch & Matthew (2023) | OK — *WSEAS Trans. on Computers*, 22, pp. 25–43 · tres autores confirmados por Crossref | `Parcial` — solo resumen | **PDF abierto del editor**: [wseas.com/journals/computers/2023/a105105-1421.pdf](https://wseas.com/journals/computers/2023/a105105-1421.pdf) |
| 3 | A1 | **Bangor, Kortum & Miller (2008)** | OK — *Int. J. Human–Computer Interaction*, 24(6), pp. 574–594 · Taylor & Francis | `Parcial` — se toma de él el umbral SUS = 68 | [doi.org/10.1080/10447310802205776](https://doi.org/10.1080/10447310802205776) |
| 3 | A2 | Bezemer & Zaidman (2010) | OK — IWPSE-EVOL '10, pp. 88–92 · ACM | `Parcial` — solo resumen | **PDF del propio autor**: [azaidman.github.io/publications/bezemerIWPSE2010.pdf](https://azaidman.github.io/publications/bezemerIWPSE2010.pdf) |
| 3 | A3 | Codd (1970) | OK — *CACM*, 13(6), pp. 377–387 | OK — obra canónica | [doi.org/10.1145/362384.362685](https://doi.org/10.1145/362384.362685) |
| 3 | A4 | Dar, Hershcovitch & Morrison (2023) | Ver capítulo 2, ref. A1 | Ver capítulo 2, ref. A1 | Ver capítulo 2, ref. A1 |
| 3 | A5 | Gao, Bird & Barr (2017) | OK — ICSE 2017, pp. 758–769 · IEEE/ACM | **OK — cifra del 15 % verificada en el texto completo** (ver §2) | **PDF abierto (Microsoft Research)**: [microsoft.com/…/gao2017javascript.pdf](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf) |
| 3 | A6 | Gilbert & Lynch (2002) | OK — *ACM SIGACT News*, 33(2), pp. 51–59 | OK — obra canónica | [doi.org/10.1145/564585.564601](https://doi.org/10.1145/564585.564601) |
| 3 | A7 | Haerder & Reuter (1983) | OK — *ACM Computing Surveys*, 15(4), pp. 287–317 | OK — obra canónica | [doi.org/10.1145/289.291](https://doi.org/10.1145/289.291) |
| 3 | A8 | Krasner & Pope (1988) | **OK — resuelto**: sin DOI por ser revista descontinuada, pero **indexado en ACM DL** con identificador estable `10.5555/50757.50759`; *JOOP*, 1(3), pp. 26–49; autores de ParcPlace Systems | `Parcial` — copia escaneada localizada | **ACM DL**: [dl.acm.org/doi/10.5555/50757.50759](https://dl.acm.org/doi/10.5555/50757.50759) · **PDF escaneado (UC Irvine, 18 pp.)**: [ics.uci.edu/~redmiles/…/KrasnerPope88.pdf](https://www.ics.uci.edu/~redmiles/ics227-SQ04/papers/KrasnerPope88.pdf) |
| 3 | A9 | Krebs, Momm & Kounev (2012) | **OK — autoría confirmada en la portada del PDF del editor**: «Krebs R., Momm C. and Kounev S.»; CLOSER-2012, pp. 426–431; ISBN de actas 978-989-8565-05-1 | OK — portada y resumen leídos | **PDF abierto del editor**: [scitepress.org/papers/2012/39576/39576.pdf](https://www.scitepress.org/papers/2012/39576/39576.pdf) |
| 3 | A10 | Larman & Basili (2003) | OK — *Computer*, 36(6), pp. 47–56 · IEEE | OK — obra canónica | [doi.org/10.1109/MC.2003.1204375](https://doi.org/10.1109/MC.2003.1204375) |
| 3 | A11 | **Nielsen & Landauer (1993)** | OK — INTERACT '93 / CHI '93, pp. 206–213 · ACM | `Parcial` — se toma de él la curva de rendimientos decrecientes | [doi.org/10.1145/169059.169166](https://doi.org/10.1145/169059.169166) |
| 3 | A12 | Saltzer & Schroeder (1975) | OK — *Proceedings of the IEEE*, 63(9), pp. 1278–1308 | OK — obra canónica | [doi.org/10.1109/PROC.1975.9939](https://doi.org/10.1109/PROC.1975.9939) |
| 3 | A13 | Sandhu, Coyne, Feinstein & Youman (1996) | OK — *Computer*, 29(2), pp. 38–47 · IEEE | OK — obra canónica | [doi.org/10.1109/2.485845](https://doi.org/10.1109/2.485845) |
| 3 | A14 | Simić et al. (2024) | Ver capítulo 2, ref. A4 | Ver capítulo 2, ref. A4 | Ver capítulo 2, ref. A4 |
| 3 | A15 | **Cronbach (1951)** | OK — *Psychometrika*, 16(3), pp. 297–334 · confirmado por Crossref el 14-09-2026 | `Parcial` — se toma de él el coeficiente α; texto no leído | [doi.org/10.1007/BF02310555](https://doi.org/10.1007/BF02310555) |
| 3 | A16 | Hevner, March, Park & Ram (2004) | OK — *MIS Quarterly*, 28(1), pp. 75–106 · cuatro autores confirmados por Crossref el 14-09-2026 | `Parcial` — solo resumen | [doi.org/10.2307/25148625](https://doi.org/10.2307/25148625) |

### 1.2 Libros

**Las dos discrepancias de metadatos detectadas quedaron resueltas contrastando con la página del editor. En ambos casos el error estaba en el catálogo consultado, no en la cita: las referencias se mantienen sin cambio.**

| Ref. | Obra | Discrepancia que reportaba el catálogo | Resolución contra el editor |
|---|---|---|---|
| Cap. 3 L7 | Newman (2021), *Building microservices*, 2.ª ed. | El catálogo fechaba ese ISBN en 2020 | **Confirmado 2021** — O'Reilly Media, 2.ª ed., publicada el 5 de octubre de 2021, ISBN 978-1-4920-3402-5. [Ficha del editor](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) |
| Cap. 3 L2 | Beck (2002), *Test-driven development: By example* | El catálogo devolvía una reimpresión de 2006 | **Confirmado 2002** — Addison-Wesley Professional, 1.ª ed., 8 de noviembre de 2002, ISBN 978-0-321-14653-3 |

De los **once ISBN** que cita el anteproyecto —diez en la lista de libros del capítulo 3 y uno, Hernández-Sampieri y Mendoza (2018), en las listas del perfil y del anteproyecto integrado—, **diez resuelven correctamente contra el catálogo y uno queda por comprobar**. Sin discrepancias: Bass et al. (2021), Richards & Ford (2020), Kleppmann (2017), Humble & Farley (2010), Forsgren et al. (2018), Nielsen (1993), Pierce (2002) y Hernández-Sampieri & Mendoza (2018), además de los dos resueltos en la tabla anterior.

**La entrada que falta.** Se consigna aquí en lugar de darse por comprobada con el resto, porque la diferencia entre «verificado» y «declarado» es justamente lo que este anexo existe para registrar:

| Ref. | Obra | Estado | Qué falta |
|---|---|---|---|
| Cap. 3 L3 | Brooke, J. (1996). SUS: A quick and dirty usability scale. En *Usability evaluation in industry* (pp. 189–194). Taylor & Francis | `Falta` — el ISBN **978-0-7484-0460-5** se declara a partir de la ficha de la obra y **no se ha contrastado contra el catálogo del editor**. Su **contenido** sí está verificado (§2): el capítulo es la fuente primaria de la escala SUS | Contrastar el ISBN contra el catálogo de Taylor & Francis antes de la entrega final ([PENDIENTES](../PENDIENTES.md) §2) |

#### Obras evaluadas y no incorporadas

APA 7 no admite referencias sin cita. Estas cinco obras se evaluaron como bibliografía de base y no se incorporaron. **Todas son obras publicadas y verificables**, de modo que la exclusión no obedece a falta de fiabilidad sino a **falta de pertinencia**: ninguna sostiene una afirmación del anteproyecto, y conservarlas habría sido engrosar la bibliografía sin uso —lo que la auditoría de pertinencia del capítulo 3 (§3.4.2) descarta expresamente—.

| Obra | Por qué no se cita | Qué la sustituye |
|---|---|---|
| Evans, E. (2003). *Domain-driven design*. Addison-Wesley. | El marco teórico no desarrolla diseño guiado por el dominio, y ninguna decisión del proyecto se deriva de él. La expresión «lenguaje del dominio» del glosario es descriptiva, no una adopción de DDD | — (no había afirmación que sostener) |
| Obe, R. O., & Hsu, L. S. (2017). *PostgreSQL: Up and running* (3.ª ed.). O'Reilly. | Manual de práctica; PostgreSQL y la seguridad a nivel de fila ya se sustentan en la documentación oficial del motor, que es la fuente normativa | PostgreSQL Global Development Group (s. f.-a y s. f.-b) |
| Sbarski, P., Cui, Y., & Nair, A. (2022). *Serverless architectures on AWS* (2.ª ed.). Manning. | Libro de práctica y específico de AWS, mientras el proyecto despliega en otra plataforma; el fundamento de serverless lo aporta una fuente revisada por pares | Jonas et al. (2019) |
| Cohn, M. (2004). *User stories applied*. Addison-Wesley. | **No sale del proyecto, cambia de lugar**: no sostiene nada en el anteproyecto, pero sí es la fuente del formato «Como… quiero… para…» y de los puntos de historia en Fibonacci que el proyecto emplea | Citado ahora en [ingenieria/03-historias-usuario.md](../ingenieria/03-historias-usuario.md), con su ISBN y su entrada en ACM DL (`10.5555/984017`) |
| Hernández Sampieri, R., Fernández Collado, C., & Baptista Lucio, M. P. (2014). *Metodología de la investigación* (6.ª ed.). McGraw-Hill. | Edición **superada**: la clasificación metodológica que emplea el proyecto se toma de la edición posterior, ya citada. Mantener ambas ediciones de la misma obra duplicaría la referencia | Hernández-Sampieri & Mendoza (2018) |

### 1.3 Documentos normativos

| Ref. | Documento | Estado | Acceso |
|---|---|---|---|
| N1 | RFC 7519 — JSON Web Token | OK — DOI resuelve; autores y año confirmados | [doi.org/10.17487/RFC7519](https://doi.org/10.17487/RFC7519) · [rfc-editor.org/rfc/rfc7519](https://www.rfc-editor.org/rfc/rfc7519) |
| N2 | RFC 9457 — Problem Details for HTTP APIs | OK — DOI resuelve; confirma que **sustituye a la RFC 7807** | [doi.org/10.17487/RFC9457](https://doi.org/10.17487/RFC9457) · [rfc-editor.org/rfc/rfc9457](https://www.rfc-editor.org/rfc/rfc9457) |
| N3 | NIST SP 800-207 — Zero Trust Architecture | OK — DOI resuelve; cuatro autores confirmados | [doi.org/10.6028/NIST.SP.800-207](https://doi.org/10.6028/NIST.SP.800-207) |
| N4 | Jonas et al. (2019) — Berkeley View on Serverless | OK — arXiv accesible | [arxiv.org/abs/1902.03383](https://arxiv.org/abs/1902.03383) |
| N5 | Fielding (2000) — Tesis doctoral | OK — alojada en el sitio institucional de UC Irvine | [ics.uci.edu/~fielding/pubs/dissertation/top.htm](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm) |
| N6 | W3C — Web Application Manifest | OK — accesible. **Corrección aplicada**: es un *Working Draft* fechado el 13 de agosto de 2026, no de 2023 | [w3.org/TR/appmanifest/](https://www.w3.org/TR/appmanifest/) |
| — | Estado Plurinacional de Bolivia (2009) — Constitución Política del Estado | OK — texto consultado el 14-09-2026; promulgación del 7 de febrero de 2009 confirmada. **Art. 21, num. 2 verificado literalmente**: «A la privacidad, intimidad, honra, honor, propia imagen y dignidad». Es el único artículo que cita el anteproyecto | [lexivox.org/norms/BO-CPE-20090207.html](https://www.lexivox.org/norms/BO-CPE-20090207.html) |

### 1.4 Documentación técnica con autor corporativo

Incorporada al §7.1 del anteproyecto. Se emplea **solo como sustento del marco conceptual**, nunca como sustento teórico. Al carecer de fecha de publicación fija, todas llevan **fecha de recuperación**.

| Fuente | Enlace | Estado |
|---|---|---|
| OpenJS Foundation — *Node.js documentation* | [nodejs.org/docs/latest/api/](https://nodejs.org/docs/latest/api/) | `Falta` — accesible el 14-08-2026; re-comprobar y fechar |
| Microsoft — *TypeScript documentation* | [typescriptlang.org/docs/](https://www.typescriptlang.org/docs/) | `Falta` — ídem |
| PostgreSQL Global Development Group — *PostgreSQL documentation* (s. f.-a) | [postgresql.org/docs/current/](https://www.postgresql.org/docs/current/) | `Falta` — ídem |
| PostgreSQL Global Development Group — *Row security policies* (s. f.-b) | [postgresql.org/docs/current/ddl-rowsecurity.html](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | `Falta` — ídem |
| Zod — *Zod documentation* | [zod.dev](https://zod.dev/) | `Falta` — ídem |
| Meta Open Source — *React documentation* | [react.dev](https://react.dev/) | `Falta` — ídem |
| Schwaber & Sutherland (2020) — *The Scrum Guide* | [scrumguides.org](https://scrumguides.org/) | `Falta` — ídem |
| Brown (s. f.) — *The C4 model* | [c4model.com](https://c4model.com/) | `Falta` — accesible el 14-09-2026; autoría de Simon Brown y los cuatro niveles del modelo confirmados en la página; re-comprobar y fechar |
| Chong, Carraro & Wolter (2006) — *Multi-tenant data architecture* | [Copia archivada (Wayback, 30-05-2017)](https://web.archive.org/web/20170530080303/https://msdn.microsoft.com/en-us/library/aa479086.aspx) | **Sustituida** — la URL original de MSDN devuelve 404. La atribución teórica se trasladó a Krebs et al. (2012) |

---

## 2. Comprobaciones de contenido realizadas

Lo que se verificó **dentro del texto**, no solo en sus metadatos.

| Afirmación del anteproyecto | Fuente | Resultado |
|---|---|---|
| «Aproximadamente el **15 %** de los errores públicos de proyectos JavaScript habría sido detectado por un verificador de tipos estático como TypeScript» | Gao et al. (2017) | **Confirmada**. El resumen del artículo dice literalmente: *«our central finding is that both static type systems find an important percentage of public bugs: both Flow 0.30 and TypeScript 2.0 successfully detect 15%»*. La cifra mide el porcentaje de **errores públicos corregidos** que el verificador detecta, y aplica por igual a Flow y a TypeScript |
| Autoría de Krebs et al. (2012), que Crossref no listaba | Krebs, Momm & Kounev (2012) | **Confirmada** en la portada del PDF del editor: «Krebs R., Momm C. and Kounev S.» |
| Que Brooke (1996) es la fuente primaria de la escala SUS | Brooke (1996) | **Confirmada**. El documento original —John Brooke, Redhatch Consulting Ltd.— se abre con «*This chapter describes the System Usability Scale (SUS)*», lo que confirma que es el capítulo del libro y no una reimpresión posterior. Se cita en el cuerpo como origen del instrumento (marco teórico §3.2.3, anteproyecto §7.2.3 y perfil §8), manteniendo a Bangor et al. (2008) como fuente del baremo y del umbral de 68 puntos |

---

## 3. Referencias en formato APA 7 con enlace de acceso

Lista consolidada y lista para pegar. El enlace es el **más estable y accesible** que se localizó: se prefiere el DOI; si no existe, el repositorio del editor; si tampoco, una copia institucional o del autor.

### Artículos, ponencias y tesis

Alobaywi, B., Almutairi, M. G., & Sheldon, F. T. (2026). Performance trade-offs in multi-tenant IoT–cloud security: A systematic review of emerging technologies. *IoT, 7*(1), 21. https://doi.org/10.3390/iot7010021

Andriianenko, O. (2026). *Design and evaluation of multi-tenant architectures in microservice based project management systems* [Tesis de maestría, Universitatea Tehnică a Moldovei]. Repositorio institucional UTM. https://repository.utm.md/handle/5014/35481

Bangor, A., Kortum, P. T., & Miller, J. T. (2008). An empirical evaluation of the System Usability Scale. *International Journal of Human–Computer Interaction, 24*(6), 574–594. https://doi.org/10.1080/10447310802205776

Bezemer, C.-P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? En *Proceedings of the Joint ERCIM Workshop on Software Evolution (EVOL) and International Workshop on Principles of Software Evolution (IWPSE)* (pp. 88–92). ACM. https://doi.org/10.1145/1862372.1862393

Codd, E. F. (1970). A relational model of data for large shared data banks. *Communications of the ACM, 13*(6), 377–387. https://doi.org/10.1145/362384.362685

Cronbach, L. J. (1951). Coefficient alpha and the internal structure of tests. *Psychometrika, 16*(3), 297–334. https://doi.org/10.1007/BF02310555

Dar, C., Hershcovitch, M., & Morrison, A. (2023). RLS side channels: Investigating leakage of row-level security protected data through query execution time. *Proceedings of the ACM on Management of Data, 1*(1), Artículo 89, 1–25. https://doi.org/10.1145/3588943

Gao, Z., Bird, C., & Barr, E. T. (2017). To type or not to type: Quantifying detectable bugs in JavaScript. En *2017 IEEE/ACM 39th International Conference on Software Engineering (ICSE)* (pp. 758–769). IEEE. https://doi.org/10.1109/ICSE.2017.75

Gilbert, S., & Lynch, N. (2002). Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services. *ACM SIGACT News, 33*(2), 51–59. https://doi.org/10.1145/564585.564601

Haerder, T., & Reuter, A. (1983). Principles of transaction-oriented database recovery. *ACM Computing Surveys, 15*(4), 287–317. https://doi.org/10.1145/289.291

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly, 28*(1), 75–106. https://doi.org/10.2307/25148625

Krasner, G. E., & Pope, S. T. (1988). A cookbook for using the model-view-controller user interface paradigm in Smalltalk-80. *Journal of Object-Oriented Programming, 1*(3), 26–49. https://dl.acm.org/doi/10.5555/50757.50759

Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. En *Proceedings of the 2nd International Conference on Cloud Computing and Services Science (CLOSER 2012)* (pp. 426–431). SciTePress. https://doi.org/10.5220/0003957604260431

Larman, C., & Basili, V. R. (2003). Iterative and incremental developments: A brief history. *Computer, 36*(6), 47–56. https://doi.org/10.1109/MC.2003.1204375

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

### Libros y capítulos

Bass, L., Clements, P., & Kazman, R. (2021). *Software architecture in practice* (4.ª ed.). Addison-Wesley Professional.

Beck, K. (2002). *Test-driven development: By example*. Addison-Wesley Professional.

Brooke, J. (1996). SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. L. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis. https://digital.ahrq.gov/sites/default/files/docs/survey/systemusabilityscale%2528sus%2529_comp%255B1%255D.pdf

Forsgren, N., Humble, J., & Kim, G. (2018). *Accelerate: The science of lean software and DevOps*. IT Revolution Press.

Humble, J., & Farley, D. (2010). *Continuous delivery: Reliable software releases through build, test, and deployment automation*. Addison-Wesley Professional.

Kleppmann, M. (2017). *Designing data-intensive applications: The big ideas behind reliable, scalable, and maintainable systems*. O'Reilly Media.

Newman, S. (2021). *Building microservices: Designing fine-grained systems* (2.ª ed.). O'Reilly Media.

Nielsen, J. (1993). *Usability engineering*. Morgan Kaufmann.

Pierce, B. C. (2002). *Types and programming languages*. MIT Press.

Richards, M., & Ford, N. (2020). *Fundamentals of software architecture: An engineering approach*. O'Reilly Media.

### Documentos normativos e informes

Estado Plurinacional de Bolivia. (2009). *Constitución Política del Estado* (promulgada el 7 de febrero de 2009). Recuperado el 14 de septiembre de 2026, de https://www.lexivox.org/norms/BO-CPE-20090207.html

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine]. https://ics.uci.edu/~fielding/pubs/dissertation/top.htm

Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. https://arxiv.org/abs/1902.03383

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519

Nottingham, M., Wilde, E., & Dalal, S. (2023). *Problem details for HTTP APIs* (RFC 9457). Internet Engineering Task Force. https://doi.org/10.17487/RFC9457

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft del 13 de agosto de 2026). https://www.w3.org/TR/appmanifest/

### Documentación técnica con autor corporativo

*Al carecer de fecha de publicación fija, cada entrada lleva su fecha de recuperación.*

Brown, S. (s. f.). *The C4 model*. Recuperado el 14 de septiembre de 2026, de https://c4model.com/

Meta Open Source. (s. f.). *React documentation*. Recuperado el 14 de agosto de 2026, de https://react.dev/

Microsoft. (s. f.). *TypeScript documentation*. Recuperado el 14 de agosto de 2026, de https://www.typescriptlang.org/docs/

OpenJS Foundation. (s. f.). *Node.js documentation*. Recuperado el 14 de agosto de 2026, de https://nodejs.org/docs/latest/api/

PostgreSQL Global Development Group. (s. f.-a). *PostgreSQL documentation*. Recuperado el 14 de agosto de 2026, de https://www.postgresql.org/docs/current/

PostgreSQL Global Development Group. (s. f.-b). *Row security policies*. Recuperado el 14 de agosto de 2026, de https://www.postgresql.org/docs/current/ddl-rowsecurity.html

Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum*. Recuperado el 14 de agosto de 2026, de https://scrumguides.org/

Zod. (s. f.). *Zod documentation*. Recuperado el 14 de agosto de 2026, de https://zod.dev/

### Fuentes estadísticas oficiales

Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del Registro Único para la Administración Tributaria Municipal. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

Instituto Nacional de Estadística de Bolivia. (2025). *Boletín estadístico parque automotor 2024*. https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/

Instituto Nacional de Estadística de Bolivia. (2026). *Estadísticas del parque automotor 2003–2025*. https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/

---

## 4. Alcance de esta verificación

Este anexo consigna el **estado por referencia**: qué se comprobó de cada fuente, con qué método y con qué resultado. Las entradas marcadas `Parcial` en la columna «Contenido» tienen sus datos bibliográficos confirmados contra el registro del editor y su afirmación tomada del resumen; las marcadas `OK` fueron contrastadas contra el texto completo. Esa distinción se declara aquí de forma explícita, en lugar de darse por supuesta.

**Lo que queda abierto**, y que ningún otro documento debe dar por cerrado: las seis entradas citadas a partir de su resumen —cuatro del capítulo 2 y dos del capítulo 3, Bezemer y Zaidman (2010) y Hevner et al. (2004)—, cuya lectura completa corresponde antes de la entrega final; el ISBN de Brooke (1996); y las fechas de recuperación de la documentación técnica con autor corporativo y de las fuentes consultadas en línea, que se fijan el día de la entrega. El registro operativo de esas acciones está en [PENDIENTES](../PENDIENTES.md) §2; ni el perfil ni el anteproyecto afirman una verificación mayor que la que esta tabla sostiene.
