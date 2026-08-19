import { describe, it, expect } from 'vitest'
import { AUDIT_ACTION_LABELS, type AuditAction } from './auditoria-api'

/**
 * RF-703: seis acciones críticas. La interfaz debe poder etiquetar TODAS, o
 * mostrará un identificador crudo al usuario en la pantalla de auditoría.
 *
 * Esta prueba es la que detecta el desfase cuando el servidor empieza a
 * registrar una acción nueva y nadie actualiza la traducción.
 */
const ACCIONES_CRITICAS: AuditAction[] = [
  'member.invited',
  'member.role_changed',
  'member.removed',
  'organization.updated',
  'workshop.deactivated',
  'client.deactivated',
]

describe('acciones auditadas', () => {
  it('las seis acciones críticas de RF-703 tienen etiqueta', () => {
    for (const accion of ACCIONES_CRITICAS) {
      expect(AUDIT_ACTION_LABELS[accion], accion).toBeTruthy()
    }
  })

  it('no hay etiquetas de sobra: el catálogo es exactamente el de RF-703', () => {
    expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual([...ACCIONES_CRITICAS].sort())
  })

  it('ninguna etiqueta usa los términos retirados del glosario', () => {
    for (const etiqueta of Object.values(AUDIT_ACTION_LABELS)) {
      expect(etiqueta.toLowerCase()).not.toMatch(/empresa|sucursal/)
    }
  })
})
