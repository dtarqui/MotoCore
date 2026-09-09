import type { PropsWithChildren } from 'react'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from '@/modules/auth/AuthContext'
import { ToastProvider } from '@/shared/ui/toast'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryProvider>
  )
}
