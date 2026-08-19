import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * Preparacion comun de la suite del frontend.
 *
 * `localStorage` de jsdom persiste entre archivos de prueba, y el contexto
 * activo se guarda ahi: se limpia despues de cada caso para que ninguno herede
 * la organizacion o el taller que dejo otro.
 */
afterEach(() => {
  cleanup()
  window.localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
