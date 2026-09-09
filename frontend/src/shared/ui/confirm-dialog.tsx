import type { ReactNode } from 'react'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

type ConfirmDialogProps = {
  trigger: ReactNode
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
}

/**
 * Confirmación para acciones que hoy disparan al primer clic (desactivar,
 * remover, quitar): un paso intermedio barato antes de una operación que no
 * se deshace desde la interfaz.
 *
 * El diálogo se cierra al confirmar sin esperar la respuesta de la mutación,
 * igual que el resto de la app llama `.mutate()` sin deshabilitar el botón
 * mientras está en curso; un fallo se ve en la alerta de la página, detrás.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'destructive',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" variant={variant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
