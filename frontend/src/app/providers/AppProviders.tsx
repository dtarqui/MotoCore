import type { PropsWithChildren } from 'react'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from '@/modules/auth/AuthContext'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}