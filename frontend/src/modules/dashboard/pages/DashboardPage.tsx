import { PageHeader } from '../../../shared/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/card'
import { Badge } from '../../../shared/ui/badge'

export function DashboardPage() {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Vista general de operación del taller y métricas clave."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Servicios del mes</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Órdenes completadas</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingresos estimados</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mes actual</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertas críticas</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Repuestos bajo stock</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">0</div>
              <Badge variant="outline">Normal</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}