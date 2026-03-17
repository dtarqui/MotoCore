import { PageHeader } from '../../../shared/ui/PageHeader'

const lowStockItems = [
  'Aceite de motor 10W-40',
  'Pastillas de freno delantera',
  'Filtro de aire universal',
]

export function InventarioPage() {
  return (
    <section>
      <PageHeader
        title="Inventario"
        description="Control de stock y alertas de repuestos críticos."
      />

      <div className="card">
        <h3>Alertas de bajo stock</h3>
        <ul className="simple-list">
          {lowStockItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}