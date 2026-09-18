import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from './card'
import { Skeleton } from './skeleton'

type StatCardProps = {
  label: string
  value: number | string
  helper?: ReactNode
  icon: LucideIcon
  isLoading?: boolean
}

export function StatCard({ label, value, helper, icon: Icon, isLoading }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
          )}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {helper ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          {helper}
        </div>
      ) : null}
    </Card>
  )
}
