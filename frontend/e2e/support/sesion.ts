import { expect, type Page } from '@playwright/test'
import { leerEscenario, type EscenarioE2E } from './escenario-global'

export { leerEscenario }
export type { EscenarioE2E }

/** Inicia sesión por la pantalla, como lo haría un operador. */
export async function iniciarSesion(page: Page, escenario: EscenarioE2E = leerEscenario()): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(escenario.email)
  await page.getByLabel('Contraseña').fill(escenario.password)
  await page.getByRole('button', { name: 'Ingresar' }).click()

  // La franja de contexto activo es lo primero que aparece tras entrar.
  await expect(page.getByLabel('Organización activa')).toBeVisible()
}

/** Elige la organización activa por su nombre y espera a que el contexto se aplique. */
export async function activarOrganizacion(page: Page, nombre: string): Promise<void> {
  await page.getByLabel('Organización activa').selectOption({ label: nombre })
  await expect(page.getByLabel('Organización activa')).toHaveValue(/.+/)
}

/** Elige el taller activo por su nombre. */
export async function activarTaller(page: Page, nombre: string): Promise<void> {
  const selector = page.getByLabel('Taller activo')
  await expect(selector).toBeEnabled()
  await selector.selectOption({ label: nombre })
}

/** Las pantallas del corte vertical, que es el alcance de las auditorías N7. */
export const PANTALLAS_DEL_CORTE_VERTICAL = [
  { ruta: '/', nombre: 'Inicio' },
  { ruta: '/clientes', nombre: 'Clientes' },
  { ruta: '/inventario', nombre: 'Inventario' },
  { ruta: '/talleres', nombre: 'Talleres' },
  { ruta: '/equipo', nombre: 'Equipo' },
  { ruta: '/auditoria', nombre: 'Auditoría' },
] as const
