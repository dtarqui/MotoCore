import { PageHeader } from '../../../shared/ui/PageHeader'

const sampleClients = [
  { id: 'C-001', nombre: 'Carlos Méndez', telefono: '+57 300 000 0001' },
  { id: 'C-002', nombre: 'Laura Gómez', telefono: '+57 300 000 0002' },
]

export function ClientesPage() {
  return (
    <section>
      <PageHeader
        title="Clientes"
        description="Gestión de clientes del taller y datos de contacto."
      />

      <div className="card">
        <h3>Listado inicial</h3>
        <ul className="simple-list">
          {sampleClients.map((client) => (
            <li key={client.id}>
              <strong>{client.nombre}</strong> · {client.telefono}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}