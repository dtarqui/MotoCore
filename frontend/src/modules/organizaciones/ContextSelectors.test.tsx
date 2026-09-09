import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/shared/ui/toast'
import type { MeResponse, Organization, OrganizationMembership, UserRole, Workshop } from '../auth/types'

/**
 * Cambio de contexto entre organizaciones y talleres (RNF-401, HU-05, HU-07).
 *
 * Es la manifestación visible del aporte de la tesis, y la que se somete a la
 * evaluación con operadores (N5). Lo que se automatiza aquí es lo que esa
 * evaluación no puede comprobar: que el contexto que el usuario elige sea
 * exactamente el que viaja después en las cabeceras.
 */

const getWorkshopsMock = vi.fn<() => Promise<Workshop[]>>()
const getOrganizationsMock = vi.fn<() => Promise<OrganizationMembership[]>>()
const createOrganizationMock = vi.fn<(payload: unknown) => Promise<Organization>>()
const updateOrganizationMock = vi.fn<(orgId: string, payload: unknown) => Promise<Organization>>()
const reloadMe = vi.fn(async () => {})

vi.mock('./organizaciones-api', () => ({
  getWorkshops: () => getWorkshopsMock(),
  getOrganizations: () => getOrganizationsMock(),
  createOrganization: (payload: unknown) => createOrganizationMock(payload),
  updateOrganization: (orgId: string, payload: unknown) => updateOrganizationMock(orgId, payload),
}))

let me: MeResponse | null = null
// Refleja `hasAnyRole` real: el rol se comprueba en la organización ACTIVA, no globalmente.
vi.mock('../auth/hooks/useAuth', async () => {
  const { getActiveOrgId } = await import('@/shared/lib/active-context')
  return {
    useAuth: () => ({
      me,
      reloadMe,
      hasAnyRole: (roles: UserRole[]) => {
        const orgId = getActiveOrgId()
        const membership = me?.organizations.find((m) => m.organization.id === orgId)
        return membership ? roles.includes(membership.role) : false
      },
    }),
  }
})

const { ContextSelectors } = await import('./ContextSelectors')
const { getActiveOrgId, getActiveWorkshopId, setActiveOrgId } = await import(
  '@/shared/lib/active-context'
)

const taller = (id: string, name: string, is_active = true): Workshop => ({
  id,
  organization_id: 'org-1',
  name,
  address: null,
  phone: null,
  is_active,
})

const meDeDosOrganizaciones: MeResponse = {
  userId: 'u-1',
  email: 'operador@motocore.test',
  profile: null,
  organizations: [
    {
      role: 'owner',
      organization: {
        id: 'org-1',
        name: 'Motos del Sur',
        description: null,
        address: null,
        phone: null,
        email: null,
        is_active: true,
      },
    },
    {
      role: 'owner',
      organization: {
        id: 'org-2',
        name: 'Motos del Norte',
        description: null,
        address: null,
        phone: null,
        email: null,
        is_active: true,
      },
    },
  ],
}

function envolver(children: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  me = meDeDosOrganizaciones
  setActiveOrgId(null)
  getWorkshopsMock.mockReset()
  getWorkshopsMock.mockResolvedValue([taller('t-1', 'Taller Centro'), taller('t-2', 'Taller Sur')])
  getOrganizationsMock.mockReset()
  getOrganizationsMock.mockResolvedValue(meDeDosOrganizaciones.organizations)
  createOrganizationMock.mockReset()
  updateOrganizationMock.mockReset()
})

describe('selectores de contexto', () => {
  it('sin sesión no renderiza nada', () => {
    me = null
    const { container } = render(envolver(<ContextSelectors />))
    expect(container).toBeEmptyDOMElement()
  })

  it('ofrece las organizaciones de la cuenta y los talleres de la activa', async () => {
    render(envolver(<ContextSelectors />))

    const organizaciones = screen.getByLabelText('Organización activa')
    expect(organizaciones).toHaveValue('org-1')
    expect(screen.getByRole('option', { name: 'Motos del Norte' })).toBeInTheDocument()

    await waitFor(() => expect(screen.getByLabelText('Taller activo')).toHaveValue('t-1'))
    expect(screen.getByRole('option', { name: 'Taller Sur' })).toBeInTheDocument()
  })

  it('HU-05 — cambiar de organización actualiza el contexto sin cerrar sesión', async () => {
    render(envolver(<ContextSelectors />))
    await waitFor(() => expect(getActiveOrgId()).toBe('org-1'))

    await userEvent.selectOptions(screen.getByLabelText('Organización activa'), 'org-2')

    await waitFor(() => expect(getActiveOrgId()).toBe('org-2'))
    // La sesión no se toca: solo se recarga el perfil para reflejar el rol.
    expect(reloadMe).toHaveBeenCalled()
  })

  it('HU-07 — el taller elegido queda como contexto activo', async () => {
    render(envolver(<ContextSelectors />))
    await waitFor(() => expect(screen.getByLabelText('Taller activo')).toHaveValue('t-1'))

    await userEvent.selectOptions(screen.getByLabelText('Taller activo'), 't-2')

    await waitFor(() => expect(getActiveWorkshopId()).toBe('t-2'))
  })

  it('un taller que deja de existir no se conserva como contexto', async () => {
    // El operador tenía elegido t-9; la organización activa ya no lo lista.
    render(envolver(<ContextSelectors />))
    await waitFor(() => expect(getActiveWorkshopId()).toBe('t-1'))

    getWorkshopsMock.mockResolvedValue([taller('t-5', 'Taller Nuevo')])
    await userEvent.selectOptions(screen.getByLabelText('Organización activa'), 'org-2')

    // Cae en el primero disponible en lugar de arrastrar uno inválido.
    await waitFor(() => expect(getActiveWorkshopId()).toBe('t-5'))
  })

  it('sin talleres, el selector queda deshabilitado y no fija contexto', async () => {
    getWorkshopsMock.mockResolvedValue([])
    render(envolver(<ContextSelectors />))

    await waitFor(() => expect(screen.getByLabelText('Taller activo')).toBeDisabled())
    expect(getActiveWorkshopId()).toBeNull()
  })

  it('prefiere un taller activo sobre uno dado de baja', async () => {
    getWorkshopsMock.mockResolvedValue([
      taller('t-baja', 'Taller Cerrado', false),
      taller('t-viva', 'Taller Abierto', true),
    ])
    render(envolver(<ContextSelectors />))

    await waitFor(() => expect(getActiveWorkshopId()).toBe('t-viva'))
    expect(screen.getByRole('option', { name: /Taller Cerrado \(inactivo\)/ })).toBeInTheDocument()
  })
})

describe('RF-201 — crear una organización adicional', () => {
  it('crea la organización y la deja como contexto activo', async () => {
    const user = userEvent.setup()
    createOrganizationMock.mockResolvedValue({
      id: 'org-3',
      name: 'Taller Nuevo SRL',
      description: null,
      address: null,
      phone: null,
      email: null,
      is_active: true,
    })

    render(envolver(<ContextSelectors />))
    await waitFor(() => expect(getActiveOrgId()).toBe('org-1'))

    await user.click(screen.getByRole('button', { name: 'Nueva organización' }))
    await user.type(screen.getByPlaceholderText('Nombre de la organización'), 'Taller Nuevo SRL')
    await user.click(screen.getByRole('button', { name: 'Crear organización' }))

    expect(createOrganizationMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Taller Nuevo SRL' }),
    )
    // Aunque "org-3" todavía no está en las membresías del mock de useAuth, el
    // contexto activo ya cambió: es lo que hace la app al recargar el perfil.
    await waitFor(() => expect(getActiveOrgId()).toBe('org-3'))
    expect(reloadMe).toHaveBeenCalled()
  })
})

describe('RF-204 — editar la organización activa (solo Owner)', () => {
  it('un no-Owner no ve el botón de editar', async () => {
    me = {
      ...meDeDosOrganizaciones,
      organizations: meDeDosOrganizaciones.organizations.map((m) => ({ ...m, role: 'mechanic' })),
    }
    render(envolver(<ContextSelectors />))
    await waitFor(() => expect(getActiveOrgId()).toBe('org-1'))

    expect(screen.queryByRole('button', { name: 'Editar organización' })).not.toBeInTheDocument()
  })

  it('el Owner edita el nombre de la organización activa', async () => {
    const user = userEvent.setup()
    updateOrganizationMock.mockResolvedValue({
      id: 'org-1',
      name: 'Motos del Sur (renombrada)',
      description: null,
      address: null,
      phone: null,
      email: null,
      is_active: true,
    })

    render(envolver(<ContextSelectors />))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Editar organización' })).toBeInTheDocument(),
    )

    await user.click(screen.getByRole('button', { name: 'Editar organización' }))
    // No se usa `getByDisplayValue`: el <select> de organización también
    // "muestra" Motos del Sur en su opción elegida y produce ambigüedad.
    const nombre = await screen.findByPlaceholderText('Nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Motos del Sur (renombrada)')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(updateOrganizationMock).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ name: 'Motos del Sur (renombrada)' }),
    )
    await waitFor(() => expect(reloadMe).toHaveBeenCalled())
  })
})
