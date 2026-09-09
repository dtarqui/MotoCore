import { useSyncExternalStore } from 'react'

/**
 * Contexto activo (organización y taller) fuera de React.
 *
 * Existe para que `apiRequest` pueda adjuntar las cabeceras sin recibirlas por
 * parámetro en cada llamada. El proveedor de React es quien lo mantiene al día;
 * este módulo es solo el lugar donde se lee.
 *
 * Se persiste en el almacenamiento local para que recargar la página no pierda
 * la organización sobre la que se estaba trabajando. El valor guardado es solo una
 * preferencia: el servidor revalida la membresía en cada petición, así que
 * manipularlo a mano no concede ningún acceso.
 *
 * `getActiveOrgId`/`getActiveWorkshopId` son una lectura puntual, no reactiva:
 * están para `apiRequest` y otro código fuera de React. Un componente que
 * llame a una de las dos directamente en su render lee el valor de ESE
 * instante y no se entera de cambios posteriores —si `ContextSelectors`
 * resuelve el taller activo un instante después de que la página ya montó
 * (p. ej. justo tras iniciar sesión, o al entrar por enlace directo a una
 * ruta), esa página queda mostrando "selecciona un taller" para siempre,
 * porque nada la hace volver a renderizar. Los componentes deben usar
 * `useActiveOrgId()`/`useActiveWorkshopId()` en su lugar, que sí se
 * suscriben a los cambios.
 */
const ORG_KEY = 'motocore.activeOrgId'
const WORKSHOP_KEY = 'motocore.activeWorkshopId'

let activeOrgId: string | null = readStored(ORG_KEY)
let activeWorkshopId: string | null = readStored(WORKSHOP_KEY)

const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string | null) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // Modo privado o almacenamiento deshabilitado: se sigue sin persistir.
  }
}

export function getActiveOrgId() {
  return activeOrgId
}

export function getActiveWorkshopId() {
  return activeWorkshopId
}

/** Organización activa, reactivo: el componente se vuelve a renderizar cuando cambia. */
export function useActiveOrgId() {
  return useSyncExternalStore(subscribe, getActiveOrgId)
}

/** Taller activo, reactivo: el componente se vuelve a renderizar cuando cambia. */
export function useActiveWorkshopId() {
  return useSyncExternalStore(subscribe, getActiveWorkshopId)
}

/**
 * Cambia la organización activa por acción del usuario. Limpia el taller, porque
 * la que estaba elegida pertenecía a la organización anterior.
 */
export function setActiveOrgId(orgId: string | null) {
  syncActiveOrgId(orgId)
  setActiveWorkshopId(null)
}

/**
 * Fija la organización sin tocar el taller. Se usa para reflejar un valor ya
 * resuelto (la primera organización al iniciar sesión), no para cambiar de contexto.
 */
export function syncActiveOrgId(orgId: string | null) {
  activeOrgId = orgId
  writeStored(ORG_KEY, orgId)
  notify()
}

export function setActiveWorkshopId(workshopId: string | null) {
  activeWorkshopId = workshopId
  writeStored(WORKSHOP_KEY, workshopId)
  notify()
}

export function clearActiveContext() {
  setActiveOrgId(null)
}
