/**
 * Contexto activo (empresa y sucursal) fuera de React.
 *
 * Existe para que `apiRequest` pueda adjuntar las cabeceras sin recibirlas por
 * parámetro en cada llamada. El proveedor de React es quien lo mantiene al día;
 * este módulo es solo el lugar donde se lee.
 *
 * Se persiste en el almacenamiento local para que recargar la página no pierda
 * la empresa sobre la que se estaba trabajando. El valor guardado es solo una
 * preferencia: el servidor revalida la membresía en cada petición, así que
 * manipularlo a mano no concede ningún acceso.
 */
const ORG_KEY = 'motocore.activeOrgId'
const WORKSHOP_KEY = 'motocore.activeWorkshopId'

let activeOrgId: string | null = readStored(ORG_KEY)
let activeWorkshopId: string | null = readStored(WORKSHOP_KEY)

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

/**
 * Cambia la empresa activa por acción del usuario. Limpia la sucursal, porque
 * la que estaba elegida pertenecía a la empresa anterior.
 */
export function setActiveOrgId(orgId: string | null) {
  syncActiveOrgId(orgId)
  setActiveWorkshopId(null)
}

/**
 * Fija la empresa sin tocar la sucursal. Se usa para reflejar un valor ya
 * resuelto (la primera empresa al iniciar sesión), no para cambiar de contexto.
 */
export function syncActiveOrgId(orgId: string | null) {
  activeOrgId = orgId
  writeStored(ORG_KEY, orgId)
}

export function setActiveWorkshopId(workshopId: string | null) {
  activeWorkshopId = workshopId
  writeStored(WORKSHOP_KEY, workshopId)
}

export function clearActiveContext() {
  setActiveOrgId(null)
}
