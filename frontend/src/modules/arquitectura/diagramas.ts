/**
 * Catálogo de diagramas de arquitectura generados a partir del código del
 * repositorio (backend, migraciones y frontend), pensados para presentar el
 * proyecto sin depender de un servicio externo.
 *
 * Cada archivo vive como HTML autocontenido en `public/diagramas/`, servido
 * tal cual tanto por `vite dev` como por el build de producción (Nginx), y
 * esta página los embebe en un `iframe` a pantalla completa.
 */
export type Diagrama = {
  slug: string
  titulo: string
  /** Una frase en lenguaje llano: qué vas a ver, sin jerga. Es lo primero que lee alguien nuevo. */
  resumen: string
  /** El detalle técnico preciso, para quien ya conoce los términos del glosario. */
  detalle: string
  archivo: string
}

export const DIAGRAMAS: Diagrama[] = [
  {
    slug: 'runtime',
    titulo: 'Arquitectura de runtime',
    resumen:
      'Un mapa de todo el sistema en funcionamiento: qué programa corre dónde, y qué camino recorre una petición desde que entra hasta que toca la base de datos.',
    detalle:
      'Los 11 componentes en ejecución, agrupados en tres fronteras de confianza, con el camino de una petición de tenant hasta la fila filtrada por Row-Level Security.',
    archivo: '/diagramas/arquitectura-runtime.html',
  },
  {
    slug: 'aislamiento',
    titulo: 'Aislamiento entre tenants',
    resumen:
      'La prueba de que los datos de un taller nunca se mezclan con los de otro: sigue una consulta real y muestra qué pasaría si alguno de los controles fallara.',
    detalle:
      'La traza de datos completa —origen, identidad, frontera de sensibilidad, políticas RLS y respuesta— con los seis modos de fallo si algún control se omite.',
    archivo: '/diagramas/aislamiento-tenants.html',
  },
  {
    slug: 'ordenes',
    titulo: 'Ciclo de vida de la orden de trabajo',
    resumen:
      'Qué tan avanzado está el módulo de órdenes de trabajo: qué existe de verdad en el código hoy, qué se pidió pero no se construyó todavía, y por qué.',
    detalle:
      'Los cinco estados definidos en el frontend, sus transiciones reales, y los estados de espera y anulación que el alcance actual todavía no cubre.',
    archivo: '/diagramas/ciclo-orden-trabajo.html',
  },
]

export type TerminoGlosario = { termino: string; definicion: string }

/**
 * Los cinco términos que reaparecen en los tres diagramas. Definirlos una
 * sola vez aquí, visible desde cualquier pestaña, evita repetir la
 * explicación dentro de cada diagrama y le da a quien no conoce el proyecto
 * un punto fijo al que volver.
 */
export const GLOSARIO: TerminoGlosario[] = [
  {
    termino: 'Tenant / organización',
    definicion:
      'Cada taller o cadena de talleres que usa el sistema. Sus datos están completamente separados de los de cualquier otra organización.',
  },
  {
    termino: 'Taller',
    definicion: 'Un local físico dentro de una organización. Una organización puede tener varios talleres.',
  },
  {
    termino: 'RLS (Row-Level Security)',
    definicion:
      'Una regla que vive en la base de datos misma, no en el código de la aplicación, y que filtra qué filas puede ver o modificar cada quien.',
  },
  {
    termino: 'RF / RNF',
    definicion:
      '"Requisito Funcional" / "Requisito No Funcional": la numeración con la que el proyecto identifica cada cosa que el sistema debe hacer o cumplir.',
  },
  {
    termino: 'ADR',
    definicion:
      'Registro de una decisión de arquitectura: un documento corto que explica por qué se eligió un diseño y qué alternativas se descartaron.',
  },
]
