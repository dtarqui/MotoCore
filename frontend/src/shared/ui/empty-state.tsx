import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-800">
      <Icon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description ? <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
