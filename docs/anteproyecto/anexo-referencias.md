# Anexo · Verificación de referencias

Estado de comprobación de cada fuente citada en el anteproyecto. Una referencia con datos incorrectos compromete la trazabilidad de la información tanto como una inventada, de modo que cada identificador se contrastó contra el registro del editor.

**Última comprobación**: 14 de agosto de 2026.

## Cómo se verificó cada tipo de fuente

| Tipo | Método | Qué demuestra |
|---|---|---|
| Artículos y ponencias | Consulta a la **API de Crossref** por DOI (`api.crossref.org/works/{doi}`) | Que el DOI existe y que autores, año, título, revista, volumen y páginas coinciden con lo registrado por el editor |
| Libros | Consulta por **ISBN** al catálogo de OpenLibrary | Que el ISBN corresponde a la obra, el autor y la editorial declarados |
| Documentos normativos | Resolución del DOI o del identificador del organismo | Que el estándar existe con ese número y esa autoría |
| Enlaces | Petición HTTP a la URL | Que la página está accesible en la fecha de consulta |

> Estos métodos comprueban los **datos bibliográficos**, no el contenido. Que una referencia figure aquí como comprobada significa que la fuente existe y está bien citada — no que se haya leído su texto completo. Esa distinción se marca en la última columna.

**Estados empleados en las tablas siguientes**: `OK` comprobado · `Parcial` comprobado a medias, con la salvedad indicada · `Falta` no comprobado, requiere acción antes de la entrega.

## Estado por referencia

### Artículos y ponencias revisadas por pares

| Cap. | Ref. | Autor y año | Metadatos del editor | Contenido |
|---|---|---|---|---|
| 2 | A1 | Dar, Hershcovitch & Morrison (2023) | OK — *Proc. ACM Manag. Data*, 1(1), art. 89, pp. 1–25 · ACM | OK — Texto completo extraído y leído |
| 2 | A2 | **Alobaywi**, Almutairi & Sheldon (2026) | OK — *IoT*, 7(1), 21 · MDPI · publicado 22-02-2026 | Parcial — Solo resumen |
| 2 | A3 | Andriianenko (2026) | OK — Repositorio UTM accesible (HTTP 200) | Parcial — Solo resumen del repositorio |
| 3 | A1 | Bezemer & Zaidman (2010) | OK — IWPSE-EVOL '10, pp. 88–92 · ACM | Parcial — Solo resumen |
| 3 | A2 | Codd (1970) | OK — *CACM*, 13(6), pp. 377–387 | OK — Obra canónica |
| 3 | A4 | Gao, Bird & Barr (2017) | OK — ICSE 2017, pp. 758–769 · IEEE/ACM | Parcial — Verificar en el texto la cifra del 15 % antes de la defensa |
| 3 | A5 | Gilbert & Lynch (2002) | OK — *ACM SIGACT News*, 33(2), pp. 51–59 | OK — Obra canónica |
| 3 | A6 | Haerder & Reuter (1983) | OK — *ACM Computing Surveys*, 15(4), pp. 287–317 | OK — Obra canónica |
| 3 | A7 | Krebs, Momm & Kounev (2012) | OK — CLOSER 2012, pp. 426–431 · SciTePress | Parcial — Crossref no lista los autores (laguna del editor): confirmar la autoría en la portada del artículo |
| 3 | A8 | Larman & Basili (2003) | OK — *Computer*, 36(6), pp. 47–56 · IEEE | OK — Obra canónica |
| 3 | A9 | Saltzer & Schroeder (1975) | OK — *Proceedings of the IEEE*, 63(9), pp. 1278–1308 | OK — Obra canónica |
| 3 | A10 | Sandhu, Coyne, Feinstein & Youman (1996) | OK — *Computer*, 29(2), pp. 38–47 · IEEE | OK — Obra canónica |
| 3 | A11 | Krasner & Pope (1988) | **No comprobable** — revista descontinuada, sin DOI | Falta — requiere consulta en biblioteca |

### Libros

Los quince ISBN citados en el anteproyecto resuelven correctamente contra el catálogo. Tres presentan discrepancias de metadatos que conviene resolver contra la **página de créditos** del ejemplar:

| Ref. | Obra | Discrepancia detectada | Qué hacer |
|---|---|---|---|
| Cap. 2 L4 / Cap. 3 L6 | Newman (2021), *Building microservices*, 2.ª ed. | El catálogo fecha ese ISBN en 2020; la 2.ª edición de O'Reilly se publicó en 2021 | Tomar el año de la página de créditos del ejemplar consultado |
| Cap. 2 L7 | Sbarski, Cui & Nair (2022), *Serverless architectures on AWS*, 2.ª ed. | El catálogo fecha 2019 y **omite a Yan Cui** entre los autores | Confirmar autoría y año en la portada de Manning |
| Cap. 3 L2 | Beck (2002), *Test-driven development: By example* | El catálogo devuelve una reimpresión de 2006 | Citar 2002, año de la primera edición |

Sin discrepancias: Bass et al. (2021), Richards & Ford (2020), Evans (2003), Kleppmann (2017), Obe & Hsu (2017), Humble & Farley (2010), Forsgren et al. (2018), Cohn (2004), Nielsen (1993), Pierce (2002), Hernández-Sampieri & Mendoza (2018) y Hernández Sampieri et al. (2014).

### Documentos normativos

| Ref. | Documento | Estado |
|---|---|---|
| N1 | RFC 7519 — JSON Web Token | OK — DOI resuelve; autores y año confirmados |
| N2 | RFC 9457 — Problem Details for HTTP APIs | OK — DOI resuelve; confirma que **sustituye a la RFC 7807** |
| N3 | NIST SP 800-207 — Zero Trust Architecture | OK — DOI resuelve; cuatro autores confirmados |
| N4 | Jonas et al. (2019) — Berkeley View on Serverless | OK — arXiv accesible |
| N5 | Fielding (2000) — Tesis doctoral | OK — Alojada en el sitio institucional de UC Irvine |
| N6 | W3C — Web Application Manifest | OK — Accesible. **Corrección aplicada**: es un *Working Draft* fechado el **13 de agosto de 2026**, no de 2023 |

### Enlaces de documentación oficial

Todos accesibles el 14 de agosto de 2026 (HTTP 200): react.dev · typescriptlang.org · nodejs.org · postgresql.org (documentación general y políticas de seguridad de fila) · scrumguides.org · zod.dev.

| Excepción | Detalle |
|---|---|
| Chong, Carraro & Wolter (2006) — *Multi-tenant data architecture* | **Sustituida** — la URL original de MSDN devuelve **404**: Microsoft retiró el contenido. Se localizó copia archivada (Wayback Machine, 30-05-2017) y es la que se cita. La atribución teórica se trasladó a Krebs et al. (2012) |

## Pendientes antes de la entrega final

1. **Conseguir el texto completo** de las referencias marcadas como *Parcial* en la columna «Contenido». Citar a partir de un resumen es admisible en un anteproyecto, no en el documento final.
2. **Resolver Krasner & Pope (1988)**: obtener el artículo en biblioteca o sustituir la cita por una obra ya comprobada.
3. **Confirmar los tres libros con discrepancia** contra la página de créditos del ejemplar.
4. **Fijar la fecha de recuperación definitiva** de las fuentes sin fecha de publicación, el día en que se entregue el documento.
5. **Sustituir las notas de prensa por el boletín del INE** en los antecedentes, para que la cifra se cite del documento oficial y no de su difusión periodística.
6. **Fijar la tasa de crecimiento del parque automotor total** con el cuadro del INE. El texto afirmaba un 4,6 % interanual, incompatible con las otras dos cifras que él mismo cita: 2.493.753 vehículos en 2022 (nota de ABI) y 2.583.319 en 2024 son +3,6 % en **dos** años. Mientras no se tome el dato del cuadro oficial, §2.1 compara el crecimiento de forma cualitativa y no numérica.
