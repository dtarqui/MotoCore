import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Cliente HTTP: es donde el frontend cumple —o incumple— el contrato.
 *
 * Se comprueban las tres reglas que el §2 del contrato le impone al cliente:
 * que la credencial viaje en `Authorization`, que la organización activa viaje
 * SIEMPRE en `X-Org-Id` y que el taller activo viaje SOLO cuando el endpoint es
 * de nivel taller. Enviar `X-Workshop-Id` de más no rompe nada en el servidor,
 * pero enviarlo de menos sí: la petición se rechaza con 400.
 */

// El módulo de Supabase exige variables de entorno al importarse y abre un
// cliente real; aquí solo interesa el token que devuelve la sesión.
vi.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: 'jwt-de-prueba' } } })) },
  },
}))

const { apiRequest, ApiError } = await import('./api-client')
const { setActiveOrgId, setActiveWorkshopId } = await import('./active-context')

type Captura = { url: string; init: RequestInit & { headers: Record<string, string> } }

/** Sustituye fetch y devuelve lo que se envió, con la respuesta que se indique. */
function interceptar(status = 200, body: unknown = { ok: true }) {
  const capturas: Captura[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      capturas.push({ url, init: init as Captura['init'] })
      return new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
  return capturas
}

describe('apiRequest: credencial y contexto activo', () => {
  beforeEach(() => {
    setActiveOrgId(null)
  })

  it('adjunta la credencial de sesión en cada llamada', async () => {
    const capturas = interceptar()
    await apiRequest('/api/organizations')
    expect(capturas[0]!.init.headers.Authorization).toBe('Bearer jwt-de-prueba')
  })

  it('CP-N005 — adjunta la organización activa en X-Org-Id', async () => {
    const capturas = interceptar()
    setActiveOrgId('org-1')

    await apiRequest('/api/clients')

    expect(capturas[0]!.init.headers['X-Org-Id']).toBe('org-1')
  })

  it('CP-N005 — NO adjunta el taller salvo que el endpoint sea de nivel taller', async () => {
    const capturas = interceptar()
    setActiveOrgId('org-1')
    setActiveWorkshopId('taller-1')

    await apiRequest('/api/clients')
    // Clientes es nivel organización: su ausencia es lo que demuestra RF-502.
    expect(capturas[0]!.init.headers['X-Workshop-Id']).toBeUndefined()

    await apiRequest('/api/inventory/parts', { withWorkshop: true })
    expect(capturas[1]!.init.headers['X-Workshop-Id']).toBe('taller-1')
  })

  it('CP-N005 — no inventa un contexto cuando no hay ninguno elegido', async () => {
    const capturas = interceptar()
    await apiRequest('/api/clients')
    // El servidor rechaza la petición sin contexto, y eso es lo correcto: el
    // cliente no debe suplirlo con un valor por defecto (ADR-005).
    expect(capturas[0]!.init.headers['X-Org-Id']).toBeUndefined()
  })
})

describe('apiRequest: mapeo de errores', () => {
  it('CP-N204.1 — conserva el código de negocio del Problem Details, no solo el mensaje', async () => {
    interceptar(403, {
      type: 'about:blank',
      title: 'organization.access_denied',
      status: 403,
      detail: 'No tienes acceso a esta organizacion.',
    })

    await expect(apiRequest('/api/clients')).rejects.toMatchObject({
      code: 'organization.access_denied',
      status: 403,
    })
  })

  it('expone el detalle por campo de los errores de validación', async () => {
    interceptar(400, {
      title: 'validation.invalid_body',
      status: 400,
      detail: 'Uno o mas campos son invalidos.',
      errors: { email: ['No es un correo válido.'] },
    })

    const error = await apiRequest('/api/clients').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as InstanceType<typeof ApiError>).fieldErrors?.email).toEqual([
      'No es un correo válido.',
    ])
  })

  it('degrada con gracia si el cuerpo del error no es JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('502 Bad Gateway', { status: 502 })))

    await expect(apiRequest('/api/clients')).rejects.toMatchObject({
      code: 'server.error',
      status: 502,
    })
  })

  it('devuelve undefined en un 204 sin cuerpo', async () => {
    interceptar(204)
    await expect(apiRequest('/api/members/abc')).resolves.toBeUndefined()
  })
})
