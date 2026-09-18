import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, X } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { DIAGRAMAS, GLOSARIO } from '../diagramas'

/**
 * Sala de diagramas para presentar el proyecto: cada uno se generó leyendo el
 * código real del repositorio (backend, migraciones SQL, frontend), no a
 * partir de una descripción aparte que pudiera desalinearse de él.
 *
 * Es de acceso público (RF-101 y siguientes son sobre el sistema de negocio,
 * no sobre esto): vive fuera de `AppShell` —sin cabecera de sesión ni menú—
 * para que el diagrama ocupe toda la pantalla al proyectarlo, y fuera de
 * `ProtectedRoute` para que se abra directamente en `/arquitectura` sin
 * depender de una sesión iniciada. Por eso lleva su propia introducción y su
 * propio glosario: quien llega aquí puede no conocer el proyecto en absoluto.
 */
export function ArquitecturaPage() {
  const [activo, setActivo] = useState(DIAGRAMAS[0])
  const [glosarioAbierto, setGlosarioAbierto] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-gray-950">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-6 py-3 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">MotoCore</p>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Diagramas de arquitectura</h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              MotoCore es un sistema de gestión para organizaciones de servicio de motocicletas. Estos tres diagramas
              documentan, a partir del código y de la especificación, cómo está construido: qué corre dónde, cómo se
              separan los datos de cada organización, y cómo se comprueba que esa separación no se puede apagar.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {DIAGRAMAS.map((diagrama) => (
              <Button
                key={diagrama.slug}
                size="sm"
                variant={diagrama.slug === activo.slug ? 'default' : 'outline'}
                onClick={() => setActivo(diagrama)}
              >
                {diagrama.titulo}
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={glosarioAbierto ? 'default' : 'outline'}
            onClick={() => setGlosarioAbierto((v) => !v)}
          >
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Glosario
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={activo.archivo} target="_blank" rel="noreferrer">
              Abrir en pestaña nueva
            </a>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Ir al inicio de sesión</Link>
          </Button>
        </div>
      </header>

      {glosarioAbierto ? (
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/40">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cinco términos que reaparecen en los tres diagramas:
            </p>
            <button
              type="button"
              onClick={() => setGlosarioAbierto(false)}
              className="rounded-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Cerrar glosario"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {GLOSARIO.map((item) => (
              <div key={item.termino}>
                <dt className="text-sm font-semibold text-brand-700 dark:text-brand-400">{item.termino}</dt>
                <dd className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{item.definicion}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-900 dark:bg-gray-900/40">
          <p className="text-sm text-gray-700 dark:text-gray-300">{activo.resumen}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{activo.detalle}</p>
        </div>
      )}

      <iframe key={activo.slug} src={activo.archivo} title={activo.titulo} className="w-full flex-1 border-0" />
    </div>
  )
}
