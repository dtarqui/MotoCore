import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/shared/lib/utils"

/**
 * Envoltorio sobre <select> nativo, no sobre @radix-ui/react-select: para un
 * control de una sola elección sin búsqueda, el nativo ya resuelve teclado y
 * accesibilidad sin el costo de un portal ni un popper adicionales.
 */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-9 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
    </div>
  )
)
Select.displayName = "Select"

export { Select }
