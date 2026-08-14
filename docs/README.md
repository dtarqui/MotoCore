# Documentación — Proyecto de grado de maestría

**MotoCore** · Arquitectura multi-tenant jerárquica con aislamiento a nivel de base de datos, para la gestión de empresas de servicio de motocicletas en Bolivia.

Maestría en Full Stack Development · Universidad Católica Boliviana "San Pablo" · Septiembre – Diciembre 2026

---

## Documento del anteproyecto

Avanza **sesión por sesión** junto al Seminario de Maestría (material fuente en [diapositivas/](diapositivas/)). No se escriben capítulos que el seminario aún no cubrió.

| # | Capítulo | Estado |
|---|---|---|
| 1 | [Definición y Alcance](tesis/01-definicion-y-alcance.md) | Borrador completo |
| 2 | [Antecedentes y Estado del Arte](tesis/02-antecedentes-y-estado-del-arte.md) | Estructura lista, contenido pendiente de búsqueda académica |

Ver [tesis/README.md](tesis/README.md) para las reglas del seminario que rigen estos capítulos.

## Planificación e ingeniería

Artefactos que sustentan el desarrollo y alimentan los capítulos posteriores del documento.

| Documento | Contenido |
|---|---|
| [requisitos.md](requisitos.md) | Requisitos funcionales y no funcionales, con criterios de verificación y trazabilidad a los objetivos |
| [historias-usuario.md](historias-usuario.md) | 22 historias en 6 épicas, con criterios de aceptación y estimación |
| [plan-trabajo.md](plan-trabajo.md) | Metodología, cronograma por iteraciones, hitos, riesgos y recursos |
| [modelo-datos.md](modelo-datos.md) | Diagrama entidad-relación, tablas, restricciones y políticas de aislamiento |
| [arquitectura.md](arquitectura.md) | Stack, capas, despliegue y modelo jerárquico |
| [decisiones-arquitectura.md](decisiones-arquitectura.md) | Registro de decisiones (ADR) con alternativas y consecuencias |
| [seguridad.md](seguridad.md) | Autenticación, roles y aislamiento en dos capas |
| [glosario.md](glosario.md) | Terminología unificada |
| [roadmap-competitivo.md](roadmap-competitivo.md) | Análisis de soluciones existentes en Bolivia (insumo del estado del arte) |

## Fuente de verdad por tema

Antes de escribir sobre un tema, verifica quién es su dueño. Si ya tiene dueño, **enlaza** en lugar de duplicar.

| Tema | Documento responsable |
|---|---|
| Terminología | [glosario.md](glosario.md) |
| Objetivos, alcance y exclusiones | [tesis/01-definicion-y-alcance.md](tesis/01-definicion-y-alcance.md) |
| Qué debe hacer el sistema | [requisitos.md](requisitos.md) |
| Cómo lo vive el usuario | [historias-usuario.md](historias-usuario.md) |
| Cuándo se hace cada cosa | [plan-trabajo.md](plan-trabajo.md) |
| Estructura de datos y restricciones | [modelo-datos.md](modelo-datos.md) |
| Cómo está construido | [arquitectura.md](arquitectura.md) |
| Por qué se construyó así | [decisiones-arquitectura.md](decisiones-arquitectura.md) |
| Aislamiento y control de acceso | [seguridad.md](seguridad.md) |
| Prioridades de producto y mercado | [roadmap-competitivo.md](roadmap-competitivo.md) |
| Estado técnico del repositorio | [../CLAUDE.md](../CLAUDE.md) |
| Instalación y ejecución | [../README.md](../README.md) |

## Contexto que rige toda la documentación

- **Mercado objetivo**: Bolivia.
- **Modelo jerárquico**: una cuenta administra varias **empresas**; cada empresa tiene varias **sucursales**. La empresa es la unidad de aislamiento; la sucursal, una subdivisión operativa.
- **Corte vertical del proyecto**: se implementan Clientes (nivel empresa) e Inventario (nivel sucursal) como demostración del modelo. El resto de módulos está fuera de alcance.
- **Backend en migración**: `server/` (Node/TS + Supabase) reemplaza a `backend/` (.NET, referencia funcional).
- Ante una contradicción entre documentos, gana el dueño del tema según la tabla anterior — y se corrige el otro.
