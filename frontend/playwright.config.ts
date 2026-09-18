import { defineConfig, devices } from '@playwright/test'

/**
 * NIVEL N7 — EXTREMO A EXTREMO Y AUDITORÍAS (Plan de pruebas, §1.2 y §1.4).
 *
 * Verifica lo que se puede observar sin una persona delante: que los flujos
 * T1–T3 del cambio de contexto **funcionan** de punta a punta (RNF-401), que la
 * aplicación es instalable (RNF-403), que no desborda a 360 px ni a 1280 px en
 * los dos motores (RNF-402) y que no incumple de forma grave los criterios de
 * WCAG 2.1 AA (RNF-405).
 *
 * **No sustituye a N5**: que un flujo funcione no dice si un operador lo
 * comprende. Eso se mide con operadores reales.
 *
 * Los cuatro proyectos son las cuatro combinaciones que exige RNF-402: dos
 * motores —Chromium y WebKit— por dos anchos. Corren en serie y con un solo
 * trabajador porque comparten el proveedor de identidad, que limita la tasa de
 * altas de cuenta.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4173'
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8787'

const escritorio = { width: 1280, height: 800 }
const movil = { width: 360, height: 780 }

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/escenario-global.ts',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'e2e-resultados.json' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-BO',
  },
  projects: [
    { name: 'chromium-escritorio', use: { ...devices['Desktop Chrome'], viewport: escritorio } },
    { name: 'chromium-movil', use: { ...devices['Desktop Chrome'], viewport: movil } },
    { name: 'webkit-escritorio', use: { ...devices['Desktop Safari'], viewport: escritorio } },
    { name: 'webkit-movil', use: { ...devices['Desktop Safari'], viewport: movil } },
  ],
  /**
   * En local, el ejecutor levanta la aplicación **compilada** —el service worker
   * solo se registra en producción, y sin eso no se puede auditar la
   * instalabilidad— y la interfaz de programación.
   *
   * Contra *staging* no levanta nada: si `E2E_BASE_URL` viene del entorno, es
   * porque lo publicado es lo que se quiere auditar (Plan de pruebas, §1.2).
   */
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'npm run build && npm run preview -- --port 4173 --strictPort',
          url: BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
        {
          command: 'npm run dev --prefix ../server',
          url: `${API_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          // La interfaz solo admite los orígenes declarados (Requisitos, sección 5),
          // y aquí el cliente se sirve compilado en otro puerto que en desarrollo.
          // Sin esto el navegador bloquea las respuestas y la sesión nunca carga.
          env: { CORS_ALLOWED_ORIGINS: BASE_URL },
        },
      ],
})
