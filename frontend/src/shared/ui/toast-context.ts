import { createContext, useContext } from 'react'

export type ToastVariant = 'default' | 'success' | 'destructive'

export type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

export type ToastContextValue = {
  toast: (input: ToastInput) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return context
}
