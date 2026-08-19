import { describe, it, expect, beforeEach } from 'vitest'
import {
  getActiveOrgId,
  getActiveWorkshopId,
  setActiveOrgId,
  setActiveWorkshopId,
  syncActiveOrgId,
  clearActiveContext,
} from './active-context'

/**
 * Contexto activo (ADR-005, RNF-401).
 *
 * Lo que se prueba aquí no es la persistencia por sí misma, sino la regla que
 * evita el fallo más dañino del modelo jerárquico: quedarse operando sobre un
 * taller que ya no pertenece a la organización activa.
 */
describe('contexto activo', () => {
  beforeEach(() => {
    syncActiveOrgId(null)
    setActiveWorkshopId(null)
  })

  it('cambiar de organización LIMPIA el taller activo', () => {
    setActiveOrgId('org-1')
    setActiveWorkshopId('taller-1-a')
    expect(getActiveWorkshopId()).toBe('taller-1-a')

    setActiveOrgId('org-2')

    // El taller elegido pertenecía a la organización anterior: conservarlo
    // dejaría al usuario operando sobre un local de otra organización.
    expect(getActiveOrgId()).toBe('org-2')
    expect(getActiveWorkshopId()).toBeNull()
  })

  it('sincronizar la organización NO limpia el taller', () => {
    // `syncActiveOrgId` refleja un valor ya resuelto —la primera organización
    // al iniciar sesión—, no un cambio de contexto por acción del usuario.
    setActiveOrgId('org-1')
    setActiveWorkshopId('taller-1-a')

    syncActiveOrgId('org-1')

    expect(getActiveWorkshopId()).toBe('taller-1-a')
  })

  it('el contexto se persiste para que recargar no lo pierda', () => {
    setActiveOrgId('org-9')
    setActiveWorkshopId('taller-9')

    expect(window.localStorage.getItem('motocore.activeOrgId')).toBe('org-9')
    expect(window.localStorage.getItem('motocore.activeWorkshopId')).toBe('taller-9')
  })

  it('cerrar el contexto borra ambos niveles', () => {
    setActiveOrgId('org-1')
    setActiveWorkshopId('taller-1')

    clearActiveContext()

    expect(getActiveOrgId()).toBeNull()
    expect(getActiveWorkshopId()).toBeNull()
    expect(window.localStorage.getItem('motocore.activeOrgId')).toBeNull()
  })
})
