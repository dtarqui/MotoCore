import { useCallback, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { ToastContext, type ToastContextValue, type ToastInput, type ToastVariant } from './toast-context'

type ToastItem = ToastInput & { id: number }

const VARIANT_ICON: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  default: 'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950 dark:text-green-300',
  destructive:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950 dark:text-red-300',
}

const AUTO_DISMISS_MS = 4000

/**
 * Sistema de notificaciones propio: no hay ninguna librería de toast entre
 * las dependencias, y añadir una para esto sería más superficie de la que el
 * alcance necesita. Resuelve lo que faltaba en toda la app: confirmación de
 * éxito visible después de una mutación, más allá de que la lista se refresque.
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      setItems((current) => [...current, { ...input, id }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {items.length > 0 ? (
        <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
          {items.map((item) => {
            const Icon = VARIANT_ICON[item.variant ?? 'default']
            return (
              <div
                key={item.id}
                role="status"
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4 shadow-lg',
                  VARIANT_CLASS[item.variant ?? 'default'],
                )}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.title}</p>
                  {item.description ? <p className="mt-1 opacity-90">{item.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 rounded-sm opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar notificación</span>
                </button>
              </div>
            )
          })}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}
