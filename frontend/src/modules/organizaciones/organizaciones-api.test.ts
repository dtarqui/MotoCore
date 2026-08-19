import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Regresión de la regla de rutas (§2.3 del contrato) y del método de las bajas
 * lógicas (§2.6), vistas desde el cliente.
 *
 * Son las dos correcciones que más fácilmente se revierten al editar un módulo
 * sin releer el contrato: volver a anidar el recurso bajo la organización, o
 * usar `PATCH` para una transición de estado auditada.
 */

vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'jwt' } } })) },
  },
}))

const api = await import('./organizaciones-api')
const clientes = await import('@/modules/clientes/clientes-api')
const { setActiveOrgId } = await import('@/shared/lib/active-context')

type Llamada = { url: string; method: string; headers: Record<string, string> }

let llamadas: Llamada[] = []

beforeEach(() => {
  llamadas = []
  setActiveOrgId('org-1')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      llamadas.push({
        url,
        method: init.method ?? 'GET',
        headers: init.headers as Record<string, string>,
      })
      return new Response(JSON.stringify({ workshops: [], members: [], workshop: {}, client: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
})

const ruta = () => new URL(llamadas[0]!.url).pathname

describe('los recursos interiores se resuelven por cabecera, no por ruta anidada', () => {
  it('los talleres se piden a /api/workshops con X-Org-Id', async () => {
    await api.getWorkshops()
    expect(ruta()).toBe('/api/workshops')
    expect(llamadas[0]!.headers['X-Org-Id']).toBe('org-1')
  })

  it('los miembros se piden a /api/members con X-Org-Id', async () => {
    await api.getMembers()
    expect(ruta()).toBe('/api/members')
    expect(llamadas[0]!.headers['X-Org-Id']).toBe('org-1')
  })

  it('ninguna ruta anida el identificador de organización', async () => {
    await api.getWorkshops()
    await api.getMembers()
    await api.createWorkshop({ name: 'Taller Centro' })
    await api.inviteMember({ email: 'a@b.test', role: 'mechanic' })
    await api.updateMemberRole('user-1', 'receptionist')
    await api.removeMember('user-1')
    await api.deactivateWorkshop('taller-1')

    for (const llamada of llamadas) {
      expect(new URL(llamada.url).pathname, llamada.url).not.toMatch(/\/api\/organizations\/[^/]+\//)
    }
  })

  it('la organización SÍ conserva su identificador en la ruta: ahí es el recurso', async () => {
    await api.getOrganizations()
    expect(ruta()).toBe('/api/organizations')
  })
})

describe('método de las transiciones de estado', () => {
  it('la baja de un taller es POST /deactivate, no PATCH', async () => {
    await api.deactivateWorkshop('taller-1')
    expect(llamadas[0]!.method).toBe('POST')
    expect(ruta()).toBe('/api/workshops/taller-1/deactivate')
  })

  it('la baja de un cliente es POST /deactivate, no PATCH', async () => {
    await clientes.deactivateClient('cliente-1')
    expect(llamadas[0]!.method).toBe('POST')
    expect(ruta()).toBe('/api/clients/cliente-1/deactivate')
  })

  it('la remoción de un miembro sigue siendo DELETE: revoca un vínculo', async () => {
    // Excepción declarada en el §2.6: lo que se revoca es la relación entre la
    // cuenta y la organización, no el estado de un recurso propio.
    await api.removeMember('user-1')
    expect(llamadas[0]!.method).toBe('DELETE')
    expect(ruta()).toBe('/api/members/user-1')
  })

  it('la edición de campos sigue siendo PATCH', async () => {
    await api.updateMemberRole('user-1', 'mechanic')
    expect(llamadas[0]!.method).toBe('PATCH')
  })
})
