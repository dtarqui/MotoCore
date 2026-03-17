import { PageHeader } from '../../../shared/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card'
import { Badge } from '../../../shared/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../../../shared/ui/alert'

const lowStockItems = [
  { nombre: 'Aceite de motor 10W-40', stock: 2, minimo: 10 },
  { nombre: 'Pastillas de freno delantera', stock: 1, minimo: 5 },
  { nombre: 'Filtro de aire universal', stock: 3, minimo: 8 },
]

export function InventarioPage() {
  return (
    <section>
      <PageHeader
        title="Inventario"
        description="Control de stock y alertas de repuestos críticos."
      />

      {lowStockItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} productos con stock bajo requieren atención.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas de bajo stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.nombre} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{item.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.stock} / Mínimo: {item.minimo}
                  </p>
                </div>
                <Badge variant="destructive">Crítico</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}