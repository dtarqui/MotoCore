# Anexo — Verificación de referencias

Estado de comprobación de cada fuente citada en el anteproyecto. Una referencia con datos incorrectos compromete la trazabilidad de la información tanto como una inventada, de modo que cada identificador se contrastó contra el registro del editor.

**Última comprobación**: 14 de septiembre de 2026, para las nueve fuentes incorporadas al ajustar la documentación a la guía metodológica —Cronbach (1951), Hevner et al. (2004), Brown (s. f.), la Constitución Política del Estado y los cinco artículos de IEEE que completan la matriz del estado del arte: Zhang et al. (2021), Yassin et al. (2022), Zhu et al. (2024), Yin et al. (2025) y Leburu (2026)—. Los cinco se localizaron consultando Crossref por revista y editor, y se retuvieron tras leer su resumen. **Ese mismo día se comprobaron además**: el ISBN de Brooke (1996) contra el catálogo de OpenLibrary; la accesibilidad por HTTP de las nueve fuentes con autor corporativo; el texto de la Constitución en el PDF oficial del Ministerio de Planificación del Desarrollo; la declaración de cifrado en reposo del proveedor de datos; el Cuadro 7 de UDAPE, del que procede la cifra de empleo informal; y el texto completo de Olabanji et al. (2023) y de Bezemer y Zaidman (2010). La comprobación general anterior es del 18 de agosto de 2026: en esa fecha se verificaron contra el **texto completo del editor** las entradas antes marcadas `Parcial` por metadatos, y se añadió a cada fuente un **enlace de acceso** localizado en las bases consultadas: [Google Scholar](https://scholar.google.com/), [OATD](https://oatd.org/), [BASE](https://api.base-search.net/), Scopus / Web of Science, IEEE Xplore y ACM DL.

## Cómo se verificó cada tipo de fuente

| Tipo | Método | Qué demuestra |
|---|---|---|
| Artículos y ponencias | Consulta a la **API de Crossref** por DOI (`api.crossref.org/works/{doi}`) | Que el DOI existe y que autores, año, título, revista, volumen y páginas coinciden con lo registrado por el editor |
| Libros | Consulta por **ISBN** al catálogo de OpenLibrary, contrastada con la **página del editor** | Que el ISBN corresponde a la obra, el autor y la editorial declarados |
| Documentos normativos | Resolución del DOI o del identificador del organismo | Que el estándar existe con ese número y esa autoría |
| Enlaces | Petición HTTP a la URL | Que la página está accesible en la fecha de consulta |
| **Contenido** | **Descarga y lectura del texto completo** cuando existe copia de acceso abierto | Que la afirmación atribuida a la fuente **está efectivamente en ella** |

> Los cuatro primeros métodos comprueban los **datos bibliográficos**; el quinto, el **contenido**. Que una referencia figure aquí como comprobada en metadatos no significa que se haya leído su texto completo: esa distinción se marca en la columna «Contenido».

**Estados**: `OK` comprobado; `Parcial` comprobado a medias, con la salvedad indicada; `Falta` no comprobado, requiere acción antes de la entrega.

---

## 1. Estado por referencia

### 1.1 Artículos y ponencias revisadas por pares

| Cap. | Ref. | Autor y año | Metadatos del editor | Contenido | Acceso al texto |
|---|---|---|---|---|---|
| 2 | A1 | Dar, Hershcovitch & Morrison (2023) | OK — *Proc. ACM Manag. Data*, 1(1), art. 89, pp. 1–25; ACM; consultado el 18-08-2026 | OK — texto completo leído | [doi.org/10.1145/3588943](https://doi.org/10.1145/3588943) |
| 2 | A2 | Alobaywi, Almutairi & Sheldon (2026) | OK — *IoT*, 7(1), 21; MDPI; publicado 22-02-2026; consultado el 18-08-2026 | `Parcial` — solo resumen; MDPI rechaza la descarga automatizada (HTTP 403 el 14-09-2026) | **Acceso abierto**: [mdpi.com/2624-831X/7/1/21](https://www.mdpi.com/2624-831X/7/1/21) |
| 2 | A3 | Andriianenko (2026) | OK — repositorio UTM accesible; ficha confirmada: Universidad Técnica de Moldavia, Facultad de Computadores, Informática y Microelectrónica; licencia CC BY-NC-ND 3.0; consultado el 18-08-2026 | `Parcial` — el repositorio publica **solo la anotación**, leída el 14-09-2026; el texto completo no es de acceso público | **PDF descargable (353 KB)**: [repository.utm.md/handle/5014/35481](https://repository.utm.md/handle/5014/35481) |
| 2 | A4 | Simić, Dedeić, Stojkov & Prokić (2024) | OK — *IEEE Access*, 12, pp. 32597–32617; cuatro autores confirmados por Crossref; consultado el 18-08-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | **Acceso abierto (CC BY 4.0)**: [ieeexplore.ieee.org/document/10443611](https://ieeexplore.ieee.org/document/10443611/) |
| 2 | A5 | Olabanji, Fitch & Matthew (2023) | OK — *WSEAS Trans. on Computers*, 22, pp. 25–43; tres autores confirmados por Crossref; consultado el 18-08-2026 | **OK — texto completo leído el 14-09-2026** | **PDF abierto del editor**: [wseas.com/journals/computers/2023/a105105-1421.pdf](https://wseas.com/journals/computers/2023/a105105-1421.pdf) |
| 2 | A8 | Zhang, Yang, Du, Li, Chen & Sun (2021) | OK — *IEEE Access*, 9, pp. 15156–15169; seis autores confirmados por Crossref; consultado el 14-09-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | **Acceso abierto**: [ieeexplore.ieee.org/document/9319865](https://ieeexplore.ieee.org/document/9319865/) |
| 2 | A9 | Yassin, Ould-Slimane, Talhi & Boucheneb (2022) | OK — *IEEE Transactions on Services Computing*, 15(5), pp. 2925–2938; cuatro autores confirmados por Crossref; consultado el 14-09-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | [ieeexplore.ieee.org/document/9424427](https://ieeexplore.ieee.org/document/9424427/) |
| 2 | A10 | Zhu, Shen, Dai, Xu & Hu (2024) | OK — *IEEE Transactions on Information Forensics and Security*, 19, pp. 4316–4330; cinco autores confirmados por Crossref; consultado el 14-09-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | [ieeexplore.ieee.org/document/10472543](https://ieeexplore.ieee.org/document/10472543/) |
| 2 | A11 | Yin, Morvan, Martinez-Gil & Hameurlain (2025) | OK — *IEEE Transactions on Knowledge and Data Engineering*, 37(5), pp. 2743–2755; cuatro autores confirmados por Crossref; consultado el 14-09-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | [ieeexplore.ieee.org/document/10897901](https://ieeexplore.ieee.org/document/10897901/) |
| 2 | A12 | Leburu (2026) | OK — *IEEE Access*, 14, pp. 97094–97117; autor único confirmado por Crossref; consultado el 14-09-2026 | `Parcial` — solo resumen; IEEE Xplore exige verificación de navegador para la descarga | **Acceso abierto**: [ieeexplore.ieee.org/document/11574655](https://ieeexplore.ieee.org/document/11574655/) |
| 3 | A1 | **Bangor, Kortum & Miller (2008)** | OK — *Int. J. Human–Computer Interaction*, 24(6), pp. 574–594; Taylor & Francis | `Parcial` — se toma de él el umbral SUS = 68 | [doi.org/10.1080/10447310802205776](https://doi.org/10.1080/10447310802205776) |
| 3 | A2 | Bezemer & Zaidman (2010) | OK — IWPSE-EVOL '10, pp. 88–92; ACM | **OK — texto completo leído el 14-09-2026** | **PDF del propio autor**: [azaidman.github.io/publications/bezemerIWPSE2010.pdf](https://azaidman.github.io/publications/bezemerIWPSE2010.pdf) |
| 3 | A3 | Codd (1970) | OK — *CACM*, 13(6), pp. 377–387 | OK — obra canónica | [doi.org/10.1145/362384.362685](https://doi.org/10.1145/362384.362685) |
| 3 | A4 | Dar, Hershcovitch & Morrison (2023) | Ver capítulo 2, ref. A1 | Ver capítulo 2, ref. A1 | Ver capítulo 2, ref. A1 |
| 3 | A5 | Gao, Bird & Barr (2017) | OK — ICSE 2017, pp. 758–769; IEEE/ACM | **OK — cifra del 15 % verificada en el texto completo** (ver la sección 2) | **PDF abierto (Microsoft Research)**: [microsoft.com/…/gao2017javascript.pdf](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf) |
| 3 | A6 | Gilbert & Lynch (2002) | OK — *ACM SIGACT News*, 33(2), pp. 51–59 | OK — obra canónica | [doi.org/10.1145/564585.564601](https://doi.org/10.1145/564585.564601) |
| 3 | A7 | Haerder & Reuter (1983) | OK — *ACM Computing Surveys*, 15(4), pp. 287–317 | OK — obra canónica | [doi.org/10.1145/289.291](https://doi.org/10.1145/289.291) |
| 3 | A8 | Krasner & Pope (1988) | **OK — resuelto**: sin DOI por ser revista descontinuada, pero **indexado en ACM DL** con identificador estable `10.5555/50757.50759`; *JOOP*, 1(3), pp. 26–49; autores de ParcPlace Systems | `Parcial` — copia escaneada localizada | **ACM DL**: [dl.acm.org/doi/10.5555/50757.50759](https://dl.acm.org/doi/10.5555/50757.50759); **PDF escaneado (UC Irvine, 18 pp.)**: [ics.uci.edu/~redmiles/…/KrasnerPope88.pdf](https://www.ics.uci.edu/~redmiles/ics227-SQ04/papers/KrasnerPope88.pdf) |
| 3 | A9 | Krebs, Momm & Kounev (2012) | **OK — autoría confirmada en la portada del PDF del editor**: «Krebs R., Momm C. and Kounev S.»; CLOSER-2012, pp. 426–431; ISBN de actas 978-989-8565-05-1 | OK — portada y resumen leídos | **PDF abierto del editor**: [scitepress.org/papers/2012/39576/39576.pdf](https://www.scitepress.org/papers/2012/39576/39576.pdf) |
| 3 | A10 | Larman & Basili (2003) | OK — *Computer*, 36(6), pp. 47–56; IEEE | OK — obra canónica | [doi.org/10.1109/MC.2003.1204375](https://doi.org/10.1109/MC.2003.1204375) |
| 3 | A11 | **Nielsen & Landauer (1993)** | OK — INTERACT '93 / CHI '93, pp. 206–213; ACM | `Parcial` — se toma de él la curva de rendimientos decrecientes | [doi.org/10.1145/169059.169166](https://doi.org/10.1145/169059.169166) |
| 3 | A12 | Saltzer & Schroeder (1975) | OK — *Proceedings of the IEEE*, 63(9), pp. 1278–1308 | OK — obra canónica | [doi.org/10.1109/PROC.1975.9939](https://doi.org/10.1109/PROC.1975.9939) |
| 3 | A13 | Sandhu, Coyne, Feinstein & Youman (1996) | OK — *Computer*, 29(2), pp. 38–47; IEEE | OK — obra canónica | [doi.org/10.1109/2.485845](https://doi.org/10.1109/2.485845) |
| 3 | A14 | Simić et al. (2024) | Ver capítulo 2, ref. A4 | Ver capítulo 2, ref. A4 | Ver capítulo 2, ref. A4 |
| 3 | A15 | **Cronbach (1951)** | OK — *Psychometrika*, 16(3), pp. 297–334; confirmado por Crossref el 14-09-2026 | `Parcial` — se toma de él el coeficiente α; texto no leído | [doi.org/10.1007/BF02310555](https://doi.org/10.1007/BF02310555) |
| 3 | A16 | Hevner, March, Park & Ram (2004) | OK — *MIS Quarterly*, 28(1), pp. 75–106; cuatro autores confirmados por Crossref el 14-09-2026 | `Parcial` — solo resumen | [doi.org/10.2307/25148625](https://doi.org/10.2307/25148625) |
| 3 | A17 | **Sevilla-González et al. (2020)** | OK — *JMIR Human Factors*, 7(4), e21161; siete autores confirmados por Crossref el 14-09-2026 | `Parcial` — se toma de ella la **versión en español validada** del SUS; los diez ítems deben transcribirse del material complementario ([PENDIENTES](../PENDIENTES.md), sección 5) | **Acceso abierto**: [doi.org/10.2196/21161](https://doi.org/10.2196/21161) |

### 1.2 Libros

**Las dos discrepancias de metadatos detectadas quedaron resueltas contrastando con la página del editor. En ambos casos el error estaba en el catálogo consultado, no en la cita: las referencias se mantienen sin cambio.**

| Ref. | Obra | Discrepancia que reportaba el catálogo | Resolución contra el editor |
|---|---|---|---|
| Cap. 3 L7 | Newman (2021), *Building microservices*, 2.ª ed. | El catálogo fechaba ese ISBN en 2020 | **Confirmado 2021** — O'Reilly Media, 2.ª ed., publicada el 5 de octubre de 2021, ISBN 978-1-4920-3402-5. [Ficha del editor](https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/) |
| Cap. 3 L2 | Beck (2002), *Test-driven development: By example* | El catálogo devolvía una reimpresión de 2006 | **Confirmado 2002** — Addison-Wesley Professional, 1.ª ed., 8 de noviembre de 2002, ISBN 978-0-321-14653-3 |

De los **once ISBN** que cita el anteproyecto —diez en la lista de libros del capítulo 3 y uno, Hernández-Sampieri y Mendoza (2018), en las listas del perfil y del anteproyecto integrado—, **los once resuelven correctamente contra el catálogo**. Sin discrepancias: Bass et al. (2021), Richards & Ford (2020), Kleppmann (2017), Humble & Farley (2010), Forsgren et al. (2018), Nielsen (1993), Pierce (2002) y Hernández-Sampieri & Mendoza (2018), además de los dos resueltos en la tabla anterior.

**La entrada que faltaba, ya resuelta.** Se consigna aquí, y no junto al resto, porque la diferencia entre «verificado» y «declarado» es justamente lo que este anexo existe para registrar:

| Ref. | Obra | Estado | Qué falta |
|---|---|---|---|
| Cap. 3 L3 | Brooke, J. (1996). SUS: A quick and dirty usability scale. En *Usability evaluation in industry* (pp. 189–194). Taylor & Francis | **OK — resuelto el 14-09-2026**: el ISBN **978-0-7484-0460-5** corresponde a *Usability evaluation in industry*, Taylor & Francis / CRC Press, 1996, editado por Patrick W. Jordan y otros; registro `OL587988M` de OpenLibrary, con ISBN-10 `0-7484-0460-0`, 252 pp. y número de control LC `96178477`. Su **contenido** ya estaba verificado (sección 2) | — |

#### Obras evaluadas y no incorporadas

APA 7 no admite referencias sin cita. Estas cinco obras se evaluaron como bibliografía de base y no se incorporaron. **Todas son obras publicadas y verificables**, de modo que la exclusión no obedece a falta de fiabilidad sino a **falta de pertinencia**: ninguna sostiene una afirmación del anteproyecto, y conservarlas habría sido engrosar la bibliografía sin uso —lo que la auditoría de pertinencia del capítulo 3 (sección 3.4.2) descarta expresamente—.

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
| N1 | RFC 7519 — JSON Web Token | OK — DOI resuelve; autores y año confirmados | [doi.org/10.17487/RFC7519](https://doi.org/10.17487/RFC7519); [rfc-editor.org/rfc/rfc7519](https://www.rfc-editor.org/rfc/rfc7519) |
| N2 | RFC 9457 — Problem Details for HTTP APIs | OK — DOI resuelve; confirma que **sustituye a la RFC 7807** | [doi.org/10.17487/RFC9457](https://doi.org/10.17487/RFC9457); [rfc-editor.org/rfc/rfc9457](https://www.rfc-editor.org/rfc/rfc9457) |
| N3 | NIST SP 800-207 — Zero Trust Architecture | OK — DOI resuelve; cuatro autores confirmados | [doi.org/10.6028/NIST.SP.800-207](https://doi.org/10.6028/NIST.SP.800-207) |
| N4 | Jonas et al. (2019) — Berkeley View on Serverless | OK — arXiv accesible | [arxiv.org/abs/1902.03383](https://arxiv.org/abs/1902.03383) |
| N5 | Fielding (2000) — Tesis doctoral | OK — alojada en el sitio institucional de UC Irvine | [ics.uci.edu/~fielding/pubs/dissertation/top.htm](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm) |
| N6 | W3C — Web Application Manifest | OK — accesible. **Corrección aplicada**: es un *Working Draft* fechado el 13 de agosto de 2026, no de 2023 | [w3.org/TR/appmanifest/](https://www.w3.org/TR/appmanifest/) |
| N7 | SIN — RND 102600000007, de 25 de marzo de 2026 (prórroga de la facturación en línea) | OK — PDF del emisor accesible el 14-09-2026; amplía el plazo al 30 de septiembre de 2026 para los grupos noveno a duodécimo | [RND 102600000007](https://www.impuestos.gob.bo/wp-content/uploads/2026/03/RND-102600000007.pdf) |
| — | Estado Plurinacional de Bolivia (2009) — Constitución Política del Estado | OK — texto consultado el 14-09-2026; promulgación del 7 de febrero de 2009 confirmada. **Art. 21, num. 2 verificado literalmente**: «A la privacidad, intimidad, honra, honor, propia imagen y dignidad». Es el único artículo que cita el anteproyecto | [PDF oficial del Ministerio de Planificación del Desarrollo](https://www.planificacion.gob.bo/uploads/marco-legal/nueva_constitucion_politica_del_estado.pdf); el enlace de LexiVox devolvió **HTTP 500** el 14-09-2026 |

### 1.4 Documentación técnica con autor corporativo

Incorporada a la sección 7.1 del anteproyecto. Se emplea **solo como sustento del marco conceptual**, nunca como sustento teórico. Al carecer de fecha de publicación fija, todas llevan **fecha de recuperación**.

| Fuente | Enlace | Estado |
|---|---|---|
| OpenJS Foundation — *Node.js documentation* | [nodejs.org/docs/latest/api/](https://nodejs.org/docs/latest/api/) | OK — accesible el 14-09-2026 (respuesta HTTP 200); la fecha definitiva se fija el día de la entrega |
| Microsoft — *TypeScript documentation* | [typescriptlang.org/docs/](https://www.typescriptlang.org/docs/) | OK — ídem |
| PostgreSQL Global Development Group — *PostgreSQL documentation* (s. f.-a) | [postgresql.org/docs/current/](https://www.postgresql.org/docs/current/) | OK — ídem |
| PostgreSQL Global Development Group — *Row security policies* (s. f.-b) | [postgresql.org/docs/current/ddl-rowsecurity.html](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | OK — ídem |
| Zod — *Zod documentation* | [zod.dev](https://zod.dev/) | OK — ídem |
| Meta Open Source — *React documentation* | [react.dev](https://react.dev/) | OK — ídem |
| Schwaber & Sutherland (2020) — *The Scrum Guide* | [scrumguides.org](https://scrumguides.org/) | OK — ídem |
| Brown (s. f.) — *The C4 model* | [c4model.com](https://c4model.com/) | OK — accesible el 14-09-2026 (respuesta HTTP 200); autoría de Simon Brown y los cuatro niveles del modelo confirmados en la página |
| Chong, Carraro & Wolter (2006) — *Multi-tenant data architecture* | [Copia archivada (Wayback, 30-05-2017)](https://web.archive.org/web/20170530080303/https://msdn.microsoft.com/en-us/library/aa479086.aspx) | **Sustituida** — la URL original de MSDN devuelve 404. La atribución teórica se trasladó a Krebs et al. (2012) |

---

## 2. Comprobaciones de contenido realizadas

Lo que se verificó **dentro del texto**, no solo en sus metadatos.

| Afirmación del anteproyecto | Fuente | Resultado |
|---|---|---|
| «Aproximadamente el **15 %** de los errores públicos de proyectos JavaScript habría sido detectado por un verificador de tipos estático como TypeScript» | Gao et al. (2017) | **Confirmada**. El resumen del artículo dice literalmente: *«our central finding is that both static type systems find an important percentage of public bugs: both Flow 0.30 and TypeScript 2.0 successfully detect 15%»*. La cifra mide el porcentaje de **errores públicos corregidos** que el verificador detecta, y aplica por igual a Flow y a TypeScript |
| Autoría de Krebs et al. (2012), que Crossref no listaba | Krebs, Momm & Kounev (2012) | **Confirmada** en la portada del PDF del editor: «Krebs R., Momm C. and Kounev S.» |
| Que Brooke (1996) es la fuente primaria de la escala SUS | Brooke (1996) | **Confirmada**. El documento original —John Brooke, Redhatch Consulting Ltd.— se abre con «*This chapter describes the System Usability Scale (SUS)*», lo que confirma que es el capítulo del libro y no una reimpresión posterior. Se cita en el cuerpo como origen del instrumento (marco teórico, sección 3.2.3, anteproyecto, sección 7.2.3 y perfil, sección 8), manteniendo a Bangor et al. (2008) como fuente del baremo y del umbral de 68 puntos |

| El proveedor de datos cifra los datos **en reposo con AES-256** y en tránsito con TLS | Supabase — página de seguridad | **Confirmada** el 14-09-2026. La página declara literalmente: *«All customer data is encrypted at rest with AES-256 and in transit via TLS»*, y añade que los secretos se cifran además en la capa de aplicación. Declara SOC 2 Tipo 2, ISO 27001 y HIPAA |
| El **empleo informal** fue del **86,8 %** de la población ocupada en 2024 | UDAPE (2025), Cuadro 7 | **Confirmada** el 14-09-2026 en el PDF del organismo: 6,0 millones de 6,9 (86,8 %) a nivel nacional, 83,0 % urbano y 94,7 % rural. En esa serie el 84,2 % corresponde a **2017**, lo que descarta la atribución de esa cifra a 2024 que circula en prensa |
| El **artículo 21, numeral 2** de la Constitución reconoce el derecho a la privacidad | CPE (2009), PDF oficial | **Confirmada** el 14-09-2026: *«A la privacidad, intimidad, honra, honor, propia imagen y dignidad»*. El enlace de LexiVox devolvió **HTTP 500** ese día, de modo que la referencia pasó al PDF del Ministerio de Planificación del Desarrollo |

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

Leburu, N. (2026). Trust-aware orchestration architecture for LLM-assisted workflows in multi-tenant enterprise systems. *IEEE Access, 14*, 97094–97117. https://doi.org/10.1109/ACCESS.2026.3706063

Nielsen, J., & Landauer, T. K. (1993). A mathematical model of the finding of usability problems. En *Proceedings of the INTERACT '93 and CHI '93 Conference on Human Factors in Computing Systems* (pp. 206–213). ACM. https://doi.org/10.1145/169059.169166

Olabanji, D., Fitch, T., & Matthew, O. (2023). Multi-tenancy in cloud-native architecture: A systematic mapping study. *WSEAS Transactions on Computers, 22*, 25–43. https://doi.org/10.37394/23205.2023.22.4

Saltzer, J. H., & Schroeder, M. D. (1975). The protection of information in computer systems. *Proceedings of the IEEE, 63*(9), 1278–1308. https://doi.org/10.1109/PROC.1975.9939

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer, 29*(2), 38–47. https://doi.org/10.1109/2.485845

Sevilla-González, M. del R., Moreno Loaeza, L., Lazaro-Carrera, L. S., Bourguet Ramirez, B., Vázquez Rodríguez, A., Peralta-Pedrero, M. L., & Almeda-Valdes, P. (2020). Spanish version of the System Usability Scale for the assessment of electronic tools: Development and validation. *JMIR Human Factors, 7*(4), e21161. https://doi.org/10.2196/21161

Simić, M., Dedeić, J., Stojkov, M., & Prokić, I. (2024). A hierarchical namespace approach for multi-tenancy in distributed clouds. *IEEE Access, 12*, 32597–32617. https://doi.org/10.1109/ACCESS.2024.3369031

Yassin, M., Ould-Slimane, H., Talhi, C., & Boucheneb, H. (2022). Multi-tenant intrusion detection framework as a service for SaaS. *IEEE Transactions on Services Computing, 15*(5), 2925–2938. https://doi.org/10.1109/TSC.2021.3077852

Yin, S., Morvan, F., Martinez-Gil, J., & Hameurlain, A. (2025). MTD-DS: An SLA-aware decision support benchmark for multi-tenant parallel DBMSs. *IEEE Transactions on Knowledge and Data Engineering, 37*(5), 2743–2755. https://doi.org/10.1109/TKDE.2025.3543727

Zhang, Z., Yang, Z., Du, X., Li, W., Chen, X., & Sun, L. (2021). Tenant-led ciphertext information flow control for cloud virtual machines. *IEEE Access, 9*, 15156–15169. https://doi.org/10.1109/ACCESS.2021.3051061

Zhu, X., Shen, P., Dai, Y., Xu, L., & Hu, J. (2024). Privacy-preserving and trusted keyword search for multi-tenancy cloud. *IEEE Transactions on Information Forensics and Security, 19*, 4316–4330. https://doi.org/10.1109/TIFS.2024.3377549

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

Estado Plurinacional de Bolivia. (2009). *Constitución Política del Estado* (promulgada el 7 de febrero de 2009). Recuperado el 14 de septiembre de 2026, de https://www.planificacion.gob.bo/uploads/marco-legal/nueva_constitucion_politica_del_estado.pdf

Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* [Tesis doctoral, University of California, Irvine]. https://ics.uci.edu/~fielding/pubs/dissertation/top.htm

Jonas, E., Schleier-Smith, J., Sreekanti, V., Tsai, C.-C., Khandelwal, A., Pu, Q., Shankar, V., Carreira, J., Krauth, K., Yadwadkar, N., Gonzalez, J. E., Popa, R. A., Stoica, I., & Patterson, D. A. (2019). *Cloud programming simplified: A Berkeley view on serverless computing* (Informe técnico N.º UCB/EECS-2019-3). University of California, Berkeley. https://arxiv.org/abs/1902.03383

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)* (RFC 7519). Internet Engineering Task Force. https://doi.org/10.17487/RFC7519

Nottingham, M., Wilde, E., & Dalal, S. (2023). *Problem details for HTTP APIs* (RFC 9457). Internet Engineering Task Force. https://doi.org/10.17487/RFC9457

Rose, S., Borchert, O., Mitchell, S., & Connelly, S. (2020). *Zero trust architecture* (NIST Special Publication 800-207). National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-207

World Wide Web Consortium. (2026). *Web application manifest* (W3C Working Draft del 13 de agosto de 2026). https://www.w3.org/TR/appmanifest/

### Documentación técnica con autor corporativo

*Al carecer de fecha de publicación fija, cada entrada lleva su fecha de recuperación.*

Brown, S. (s. f.). *The C4 model*. Recuperado el 14 de septiembre de 2026, de https://c4model.com/

Meta Open Source. (s. f.). *React documentation*. Recuperado el 14 de septiembre de 2026, de https://react.dev/

Microsoft. (s. f.). *TypeScript documentation*. Recuperado el 14 de septiembre de 2026, de https://www.typescriptlang.org/docs/

OpenJS Foundation. (s. f.). *Node.js documentation*. Recuperado el 14 de septiembre de 2026, de https://nodejs.org/docs/latest/api/

PostgreSQL Global Development Group. (s. f.-a). *PostgreSQL documentation*. Recuperado el 14 de septiembre de 2026, de https://www.postgresql.org/docs/current/

PostgreSQL Global Development Group. (s. f.-b). *Row security policies*. Recuperado el 14 de septiembre de 2026, de https://www.postgresql.org/docs/current/ddl-rowsecurity.html

Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum*. Recuperado el 14 de septiembre de 2026, de https://scrumguides.org/

Zod. (s. f.). *Zod documentation*. Recuperado el 14 de septiembre de 2026, de https://zod.dev/

### Fuentes estadísticas oficiales

Instituto Nacional de Estadística de Bolivia. (2026). *Bolivia: parque automotor por tipo de servicio y clase de vehículo, 2003–2025* (Cuadro N.º 1.2) [Conjunto de datos]. Elaborado con registros del Registro Único para la Administración Tributaria Municipal. https://www.ine.gob.bo/index.php/estadisticas-economicas/transportes/parque-automotor-cuadros-estadisticos/

Instituto Nacional de Estadística de Bolivia. (2025). *Boletín estadístico parque automotor 2024*. https://www.ine.gob.bo/index.php/boletin-estadistico-parque-automotor-2024/

Instituto Nacional de Estadística de Bolivia. (2026). *Estadísticas del parque automotor 2003–2025*. https://www.ine.gob.bo/index.php/estadisticas-del-parque-automotor-2003-2025/

Unidad de Análisis de Políticas Sociales y Económicas. (2025). *Análisis de la población ocupada, desocupada e inactiva en Bolivia entre los años 2015 y 2024*. UDAPE. https://www.udape.gob.bo/wp-content/uploads/2026/03/Analisis-de-la-condicion-actividad-2025.pdf

---

## 4. Alcance de esta verificación

Este anexo consigna el **estado por referencia**: qué se comprobó de cada fuente, con qué método y con qué resultado. Las entradas marcadas `Parcial` en la columna «Contenido» tienen sus datos bibliográficos confirmados contra el registro del editor y su afirmación tomada del resumen; las marcadas `OK` fueron contrastadas contra el texto completo. Esa distinción se declara aquí de forma explícita, en lugar de darse por supuesta.

**Lo que queda abierto**, y que ningún otro documento debe dar por cerrado: las nueve entradas citadas a partir de su resumen —ocho del capítulo 2 y una del capítulo 3, Hevner et al. (2004)—, cuya lectura completa corresponde antes de la entrega final; y las fechas de recuperación de la documentación técnica con autor corporativo y de las fuentes consultadas en línea, que se fijan el día de la entrega. El registro operativo de esas acciones está en [PENDIENTES](../PENDIENTES.md), sección 2; ni el perfil ni el anteproyecto afirman una verificación mayor que la que esta tabla sostiene.
