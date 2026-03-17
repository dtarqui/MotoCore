import { PageHeader } from '../../../shared/ui/PageHeader'

export function DashboardPage() {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Vista general de operación del taller y métricas clave."
      />

      <div className="card-grid">
        <article className="card">
          <h3>Servicios del mes</h3>
          <p>0 registros</p>
        </article>
        <article className="card">
          <h3>Ingresos estimados</h3>
          <p>$0.00</p>
        </article>
        <article className="card">
          <h3>Repuestos críticos</h3>
          <p>0 alertas</p>
        </article>
      </div>
    </section>
  )
}