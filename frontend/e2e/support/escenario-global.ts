import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { request } from '@playwright/test'

/**
 * Escenario de las sesiones N7, montado **una sola vez** por ejecución y
 * compartido por los cuatro proyectos.
 *
 * Se monta por la interfaz de programación, no por la pantalla: lo que las
 * pruebas verifican son los flujos T1–T3, no el alta de datos. Y se monta una
 * vez porque el proveedor de identidad limita la tasa de altas: registrar una
 * cuenta por proyecto agotaría el límite antes de terminar.
 *
 * Reproduce el escenario de la evaluación con operadores (Plan de pruebas,
 * §3.2 y §8.3): una cuenta con **dos organizaciones**, la primera con **dos
 * talleres**, y un cliente registrado desde el primero — que es lo que la tarea
 * T3 busca desde el segundo.
 */
// Las credenciales del proveedor de identidad viven en `frontend/.env`, como
// en el navegador: el montaje inicia sesión igual que lo haría la aplicación.
const rutaEnv = fileURLToPath(new URL('../../.env', import.meta.url))
if (fs.existsSync(rutaEnv)) process.loadEnvFile(rutaEnv)

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8787'
const ARCHIVO = fileURLToPath(new URL('../.escenario.json', import.meta.url))

export interface EscenarioE2E {
  email: string
  password: string
  organizacion1: { id: string; nombre: string }
  organizacion2: { id: string; nombre: string }
  taller11: { id: string; nombre: string }
  taller12: { id: string; nombre: string }
  cliente: { id: string; apellido: string }
}

export function leerEscenario(): EscenarioE2E {
  return JSON.parse(fs.readFileSync(ARCHIVO, 'utf8')) as EscenarioE2E
}

export default async function montarEscenario(): Promise<void> {
  const api = await request.newContext({ baseURL: API_URL })
  const sufijo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

  const email = `e2e_${sufijo}@motocore.test`
  const password = 'secreto-de-prueba-1'
  const nombreOrg1 = `Motos del Sur ${sufijo}`
  const nombreOrg2 = `Motos del Norte ${sufijo}`

  const registro = await api.post('/api/auth/register', {
    data: {
      email,
      password,
      first_name: 'Operadora',
      last_name: 'De prueba',
      organization_name: nombreOrg1,
      workshop_name: 'Taller Centro',
    },
  })
  if (!registro.ok()) throw new Error(`No se pudo registrar el escenario: ${await registro.text()}`)
  const creado = (await registro.json()) as { organization: { id: string }; workshop: { id: string } }

  const sesion = await api.post(`${process.env.VITE_SUPABASE_URL ?? ''}/auth/v1/token?grant_type=password`, {
    headers: { apikey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '', 'Content-Type': 'application/json' },
    data: { email, password },
  })
  if (!sesion.ok()) throw new Error(`No se pudo iniciar sesión para montar el escenario: ${await sesion.text()}`)
  const { access_token: token } = (await sesion.json()) as { access_token: string }

  const conContexto = (orgId: string, workshopId?: string) => ({
    Authorization: `Bearer ${token}`,
    'X-Org-Id': orgId,
    ...(workshopId ? { 'X-Workshop-Id': workshopId } : {}),
  })

  const org1 = creado.organization.id
  const taller11 = creado.workshop.id

  const segundoTaller = await api.post('/api/workshops', {
    headers: conContexto(org1),
    data: { name: 'Taller Sur' },
  })
  const taller12 = ((await segundoTaller.json()) as { workshop: { id: string } }).workshop.id

  const segundaOrg = await api.post('/api/organizations', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name: nombreOrg2 },
  })
  const org2 = ((await segundaOrg.json()) as { organization: { id: string } }).organization.id

  // El cliente se registra con el Taller Centro activo; T3 lo busca desde el
  // Taller Sur, que es el beneficio central del nivel organización (RF-502).
  const apellido = `Quispe${sufijo}`
  const cliente = await api.post('/api/clients', {
    headers: conContexto(org1, taller11),
    data: { first_name: 'Ana', last_name: apellido, phone: '70011223' },
  })
  const clienteId = ((await cliente.json()) as { client: { id: string } }).client.id

  const escenario: EscenarioE2E = {
    email,
    password,
    organizacion1: { id: org1, nombre: nombreOrg1 },
    organizacion2: { id: org2, nombre: nombreOrg2 },
    taller11: { id: taller11, nombre: 'Taller Centro' },
    taller12: { id: taller12, nombre: 'Taller Sur' },
    cliente: { id: clienteId, apellido },
  }

  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true })
  fs.writeFileSync(ARCHIVO, `${JSON.stringify(escenario, null, 2)}\n`, 'utf8')
  await api.dispose()
}
