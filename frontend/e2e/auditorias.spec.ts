import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { activarOrganizacion, iniciarSesion, leerEscenario, PANTALLAS_DEL_CORTE_VERTICAL } from './support/sesion'

/**
 * AUDITORÍAS DE LA INTERFAZ — CP-N402, CP-N403 y CP-N405.
 *
 * Los cuatro proyectos de la configuración cubren las dos exigencias de
 * RNF-402: **360 px y 1280 px**, en **Chromium y WebKit**.
 */
test.describe('diseño responsivo, instalabilidad y accesibilidad', () => {
  test.beforeEach(async ({ page }) => {
    const escenario = leerEscenario()
    await iniciarSesion(page, escenario)
    await activarOrganizacion(page, escenario.organizacion1.nombre)
  })

  test('CP-N402 — ninguna pantalla del corte vertical desborda horizontalmente', async ({ page }, testInfo) => {
    for (const pantalla of PANTALLAS_DEL_CORTE_VERTICAL) {
      await page.goto(pantalla.ruta)
      await expect(page.getByRole('heading', { level: 1 }).or(page.getByRole('heading').first())).toBeVisible()

      const desbordamiento = await page.evaluate(() => {
        const raiz = document.documentElement
        // Un píxel de tolerancia: el redondeo del navegador no es desbordamiento.
        return raiz.scrollWidth - raiz.clientWidth
      })
      expect(desbordamiento, `${pantalla.nombre} a ${testInfo.project.use.viewport?.width} px`).toBeLessThanOrEqual(1)
    }
  })

  test('CP-N405 — sin incumplimientos graves o críticos de WCAG 2.1 AA', async ({ page }) => {
    for (const pantalla of PANTALLAS_DEL_CORTE_VERTICAL) {
      await page.goto(pantalla.ruta)
      await expect(page.getByRole('heading').first()).toBeVisible()

      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

      // El umbral de RNF-405 es el impacto, no la cantidad: cero graves o críticos.
      const serios = resultado.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(
        serios.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
        `${pantalla.nombre}`,
      ).toEqual([])
    }
  })

  test('CP-N403 — la aplicación es instalable', async ({ page, browserName }) => {
    await page.goto('/')

    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBe('/manifest.webmanifest')

    const manifiesto = (await (await page.request.get(href!)).json()) as {
      name: string
      start_url: string
      display: string
      icons: Array<{ sizes: string; type: string }>
    }
    expect(manifiesto.name).toBeTruthy()
    expect(manifiesto.start_url).toBe('/')
    expect(manifiesto.display).toBe('standalone')

    const tamanos = manifiesto.icons.map((icono) => icono.sizes)
    expect(tamanos).toContain('192x192')
    expect(tamanos).toContain('512x512')

    // El service worker se comprueba donde el motor lo expone: el WebKit que
    // empaqueta el ejecutor no lo soporta, y forzarlo ahí daría un rojo que no
    // dice nada sobre la aplicación.
    test.skip(browserName !== 'chromium', 'El ejecutor solo expone service workers en Chromium')
    const registrado = await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.getRegistration()
      return Boolean(registro ?? (await navigator.serviceWorker.ready.then(() => true).catch(() => false)))
    })
    expect(registrado).toBe(true)
  })
})
