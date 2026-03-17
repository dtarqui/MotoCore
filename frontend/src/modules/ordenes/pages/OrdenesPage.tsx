import { PageHeader } from '../../../shared/ui/PageHeader'

const workOrderStates = [
  'Pendiente',
  'En diagnóstico',
  'En reparación',
  'Finalizado',
  'Entregado',
]

export function OrdenesPage() {
  return (
    <section>
      <PageHeader
        title="Órdenes de trabajo"
        description="Seguimiento operativo de servicios por motocicleta."
      />

      <div className="card">
        <h3>Estados del flujo</h3>
        <ul className="simple-list">
          {workOrderStates.map((state) => (
            <li key={state}>{state}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}