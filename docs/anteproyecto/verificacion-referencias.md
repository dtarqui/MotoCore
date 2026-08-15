# Verificación de referencias

Registro del estado de comprobación de cada fuente citada en el anteproyecto. Existe porque el módulo exige rigor científico —«sin citas, el tribunal considerará que el documento es una invención sin sustento»— y porque una referencia con datos incorrectos es tan grave como una inventada.

**Última comprobación**: 14 de agosto de 2026.

## Cómo se verificó cada tipo de fuente

| Tipo | Método | Qué demuestra |
|---|---|---|
| Artículos y ponencias | Consulta a la **API de Crossref** por DOI (`api.crossref.org/works/{doi}`) | Que el DOI existe y que autores, año, título, revista, volumen y páginas coinciden con lo registrado por el editor |
| Libros | Consulta por **ISBN** al catálogo de OpenLibrary | Que el ISBN corresponde a la obra, el autor y la editorial declarados |
| Documentos normativos | Resolución del DOI o del identificador del organismo | Que el estándar existe con ese número y esa autoría |
| Enlaces | Petición HTTP a la URL | Que la página está accesible en la fecha de consulta |

> Estos métodos comprueban los **datos bibliográficos**, no el contenido. Que una referencia figure aquí como comprobada significa que la fuente existe y está bien citada — no que se haya leído su texto completo. Esa distinción se marca en la última columna.

## Estado por referencia

### Artículos y ponencias revisadas por pares

| Cap. | Ref. | Autor y año | Metadatos del editor | Contenido |
|---|---|---|---|---|
| 2 | A1 | Dar, Hershcovitch & Morrison (2023) | ✅ *Proc. ACM Manag. Data*, 1(1), art. 89, pp. 1–25 · ACM | ✅ Texto completo extraído y leído |
| 2 | A2 | **Alobaywi**, Almutairi & Sheldon (2026) | ✅ *IoT*, 7(1), 21 · MDPI · publicado 22-02-2026 | ⚠️ Solo resumen |
| 2 | A3 | Andriianenko (2026) | ✅ Repositorio UTM accesible (HTTP 200) | ⚠️ Solo resumen del repositorio |
| 3 | A1 | Bezemer & Zaidman (2010) | ✅ IWPSE-EVOL '10, pp. 88–92 · ACM | ⚠️ Solo resumen |
| 3 | A2 | Codd (1970) | ✅ *CACM*, 13(6), pp. 377–387 | ✅ Obra canónica |
| 3 | A4 | Gao, Bird & Barr (2017) | ✅ ICSE 2017, pp. 758–769 · IEEE/ACM | ⚠️ Verificar en el texto la cifra del 15 % antes de la defensa |
| 3 | A5 | Gilbert & Lynch (2002) | ✅ *ACM SIGACT News*, 33(2), pp. 51–59 | ✅ Obra canónica |
| 3 | A6 | Haerder & Reuter (1983) | ✅ *ACM Computing Surveys*, 15(4), pp. 287–317 | ✅ Obra canónica |
| 3 | A7 | Krebs, Momm & Kounev (2012) | ✅ CLOSER 2012, pp. 426–431 · SciTePress | ⚠️ Crossref no lista los autores (laguna del editor): confirmar la autoría en la portada del artículo |
| 3 | A8 | Larman & Basili (2003) | ✅ *Computer*, 36(6), pp. 47–56 · IEEE | ✅ Obra canónica |
| 3 | A9 | Saltzer & Schroeder (1975) | ✅ *Proceedings of the IEEE*, 63(9), pp. 1278–1308 | ✅ Obra canónica |
| 3 | A10 | Sandhu, Coyne, Feinstein & Youman (1996) | ✅ *Computer*, 29(2), pp. 38–47 · IEEE | ✅ Obra canónica |
| 3 | A11 | Krasner & Pope (1988) | ❌ **No comprobable**: revista descontinuada, sin DOI | ❌ Requiere consulta en biblioteca |

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
| N1 | RFC 7519 — JSON Web Token | ✅ DOI resuelve; autores y año confirmados |
| N2 | RFC 9457 — Problem Details for HTTP APIs | ✅ DOI resuelve; confirma que **sustituye a la RFC 7807** |
| N3 | NIST SP 800-207 — Zero Trust Architecture | ✅ DOI resuelve; cuatro autores confirmados |
| N4 | Jonas et al. (2019) — Berkeley View on Serverless | ✅ arXiv accesible |
| N5 | Fielding (2000) — Tesis doctoral | ✅ Alojada en el sitio institucional de UC Irvine |
| N6 | W3C — Web Application Manifest | ✅ Accesible. **Corrección aplicada**: es un *Working Draft* fechado el **13 de agosto de 2026**, no de 2023 |

### Enlaces de documentación oficial

Todos accesibles el 14 de agosto de 2026 (HTTP 200): react.dev · typescriptlang.org · nodejs.org · postgresql.org (documentación general y políticas de seguridad de fila) · scrumguides.org · zod.dev.

| Excepción | Detalle |
|---|---|
| Chong, Carraro & Wolter (2006) — *Multi-tenant data architecture* | ❌ La URL original de MSDN devuelve **404**: Microsoft retiró el contenido. ✅ Se localizó copia archivada (Wayback Machine, 30-05-2017) y es la que se cita. La atribución teórica se trasladó a Krebs et al. (2012) |

## Correcciones aplicadas a raíz de esta verificación

| # | Hallazgo | Corrección |
|---|---|---|
| 1 | El artículo de *IoT* (MDPI) se citaba como «Almutairi & Sheldon», pero tiene **tres autores y el primero es Bader Alobaywi** | Reescrito como «Alobaywi et al. (2026)» en las cinco menciones del capítulo 2 y en su referencia |
| 2 | El manifiesto del W3C se fechaba en 2023 | Corregido a 2026, con la fecha exacta del borrador vigente |
| 3 | El DOI y las páginas de Krebs et al. estaban marcados como no confirmados | Confirmados: DOI válido, pp. 426–431. Se retiró la advertencia |
| 4 | La URL de Chong et al. estaba rota (404) | Sustituida por la copia archivada; la carga teórica pasó a una fuente revisada por pares |
| 5 | RNF-204 citaba la RFC 7807, obsoleta | Actualizado a RFC 9457 en requisitos, glosario y marco conceptual |

## Pendientes antes de la entrega final

1. **Conseguir el texto completo** de las referencias marcadas con ⚠️ en la columna «Contenido». Citar a partir de un resumen es admisible en un anteproyecto, no en el documento final.
2. **Resolver Krasner & Pope (1988)**: obtener el artículo en biblioteca o sustituir la cita por una obra ya comprobada.
3. **Confirmar los tres libros con discrepancia** contra la página de créditos del ejemplar.
4. **Fijar la fecha de recuperación definitiva** de las fuentes sin fecha de publicación, el día en que se entregue el documento.
5. **Sustituir las notas de prensa por el boletín del INE** en los antecedentes, para que la cifra se cite del documento oficial y no de su difusión periodística.
