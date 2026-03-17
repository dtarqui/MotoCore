import { PageHeader } from '../../../shared/ui/PageHeader'
import { Card, CardContent } from '../../../shared/ui/card'
import { Badge } from '../../../shared/ui/badge'

const workOrderStates = [
  { label: 'Pendiente', count: 5, variant: 'outline' as const },
  { label: 'En diagnóstico', count: 2, variant: 'secondary' as const },
  { label: 'En reparación', count: 3, variant: 'secondary' as const },
  { label: 'Finalizado', count: 1, variant: 'secondary' as const },
  { label: 'Entregado', count: 8, variant: 'default' as const },
]

export function OrdenesPage() {
  return (
    <section>
      <PageHeader
        title="Órdenes de Trabajo"
        description="Seguimiento operativo de servicios por motocicleta."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {workOrderStates.map((state) => (
          <Card key={state.label}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{state.count}</div>
                <Badge variant={state.variant}>{state.label}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}