import { PageHeader } from '../../../shared/ui/PageHeader'
import { Card, CardContent } from '../../../shared/ui/card'
import { Button } from '../../../shared/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table'

const sampleClients = [
  { id: 'C-001', nombre: 'Carlos Méndez', telefono: '+57 300 000 0001', estado: 'Activo' },
  { id: 'C-002', nombre: 'Laura Gómez', telefono: '+57 300 000 0002', estado: 'Activo' },
]

export function ClientesPage() {
  return (
    <section>
      <PageHeader
        title="Gestión de Clientes"
        description="Administra clientes del taller y datos de contacto."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{sampleClients.length} clientes registrados</p>
            <Button>Nuevo cliente</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.id}</TableCell>
                  <TableCell>{client.nombre}</TableCell>
                  <TableCell>{client.telefono}</TableCell>
                  <TableCell>{client.estado}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}