import { expect, test } from '@playwright/test'
import { activarOrganizacion, activarTaller, iniciarSesion, leerEscenario } from './support/sesion'

/**
 * CP-N401 — FLUJOS T1, T2 y T3 DEL CAMBIO DE CONTEXTO (Plan de pruebas, §8.3).
 *
 * Son las tres tareas que la evaluación con operadores cronometra. Aquí se
 * comprueba que **funcionan**; si un operador las comprende o no es otra
 * pregunta, y se responde en N5.
 */
test.describe('cambio de contexto sin cerrar sesión (RNF-401)', () => {
  test('T1 — cambiar de organización y ver los datos de esa organización', async ({ page }) => {
    const escenario = leerEscenario()
    await iniciarSesion(page, escenario)

    await activarOrganizacion(page, escenario.organizacion1.nombre)
    await expect(page.getByRole('heading', { name: escenario.organizacion1.nombre })).toBeVisible()

    // El cliente de la organización 1 está donde debe estar.
    await page.getByRole('link', { name: 'Clientes' }).click()
    await expect(page.getByRole('cell', { name: new RegExp(escenario.cliente.apellido) })).toBeVisible()

    await activarOrganizacion(page, escenario.organizacion2.nombre)

    // Sin volver a autenticarse: la sesión sigue siendo la misma.
    await expect(page).not.toHaveURL(/\/login/)
    // Y lo que se muestra es de la organización nueva, no lo cacheado (ADR-010).
    await expect(page.getByRole('cell', { name: new RegExp(escenario.cliente.apellido) })).toHaveCount(0)

    await page.getByRole('link', { name: 'Inicio' }).click()
    await expect(page.getByRole('heading', { name: escenario.organizacion2.nombre })).toBeVisible()
  })

  test('T2 — situarse en un taller y registrar en él un repuesto', async ({ page }, testInfo) => {
    const escenario = leerEscenario()
    const numeroDeParte = `E2E-${testInfo.project.name}-${Date.now().toString(36)}`

    await iniciarSesion(page, escenario)
    await activarOrganizacion(page, escenario.organizacion1.nombre)
    await activarTaller(page, escenario.taller12.nombre)

    await page.getByRole('link', { name: 'Inventario' }).click()
    await page.getByRole('button', { name: 'Nuevo repuesto' }).click()

    // Dentro del diálogo: fuera está el buscador, que también menciona el
    // número de parte en su texto de ayuda.
    const formulario = page.getByRole('dialog')
    await formulario.getByPlaceholder('Número de parte').fill(numeroDeParte)
    await formulario.getByPlaceholder('Nombre', { exact: true }).fill('Filtro de aceite')
    await formulario.getByPlaceholder('Existencia inicial').fill('7')
    await formulario.getByRole('button', { name: 'Registrar repuesto' }).click()

    await expect(page.getByRole('cell', { name: numeroDeParte })).toBeVisible()

    // El inventario es del local: el mismo repuesto no está en el otro taller (RF-602).
    await activarTaller(page, escenario.taller11.nombre)
    await expect(page.getByRole('cell', { name: numeroDeParte })).toHaveCount(0)
  })

  test('T3 — localizar un cliente registrado en otro taller de la misma organización', async ({ page }) => {
    const escenario = leerEscenario()
    await iniciarSesion(page, escenario)
    await activarOrganizacion(page, escenario.organizacion1.nombre)

    // El cliente se registró con el Taller Centro activo; se busca desde el otro.
    await activarTaller(page, escenario.taller12.nombre)
    await page.getByRole('link', { name: 'Clientes' }).click()
    await page.getByPlaceholder('Buscar por nombre, email o documento').fill(escenario.cliente.apellido)

    // Es el beneficio central del nivel organización (RF-502).
    await expect(page.getByRole('cell', { name: new RegExp(escenario.cliente.apellido) })).toBeVisible()
  })
})
