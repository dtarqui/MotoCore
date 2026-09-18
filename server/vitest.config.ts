import fs from 'node:fs';
import { defineConfig } from 'vitest/config';

/**
 * Carga `server/.env` en el entorno de las pruebas.
 *
 * Sin esto, los niveles N3 y N4 se saltan **siempre**: sus `describe.skipIf`
 * consultan `process.env`, y nada lo poblaba aunque el `.env` estuviera
 * completo. El sintoma era una suite en verde que en realidad no habia
 * ejecutado nada de lo que sostiene el objetivo 3.
 *
 * Lo que ya venga en el entorno **no se pisa**: en integracion continua las
 * variables llegan por el runner, y ahi el archivo no existe. Su ausencia no es
 * un error — es la que hace que N3 y N4 se salten, que es el comportamiento
 * correcto cuando no hay entorno real contra el que ejecutar.
 */
function cargarEnv(): Record<string, string> {
  const ruta = new URL('.env', import.meta.url);
  if (!fs.existsSync(ruta)) return {};

  const vars: Record<string, string> = {};
  for (const linea of fs.readFileSync(ruta, 'utf8').split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#') || !limpia.includes('=')) continue;

    const corte = limpia.indexOf('=');
    const clave = limpia.slice(0, corte).trim();
    let valor = limpia.slice(corte + 1).trim();

    // El valor puede venir entrecomillado, como admite dotenv.
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    // Los marcadores del .env.example no son credenciales: dejarlos pasar haria
    // que N3 y N4 se ejecutaran y fallaran con un 401 dificil de atribuir.
    if (valor.includes('<') || valor.includes('>')) continue;

    if (!(clave in process.env)) vars[clave] = valor;
  }
  return vars;
}

export default defineConfig({
  test: {
    env: cargarEnv(),
    // N3 y N4 hablan con Supabase por red: el limite por defecto se queda corto
    // en el montaje del escenario, que registra varias cuentas seguidas.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Un archivo por vez. N3 y N4 registran cuentas contra el proveedor de
    // identidad, que limita la tasa de altas: en paralelo, las tres suites
    // superan ese limite y el registro falla por una causa ajena a lo que se
    // esta verificando. Serializar cuesta segundos y evita un rojo enganoso.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      // RNF-207 mide los servicios de dominio: es donde viven las reglas de
      // negocio y de rol. Los repositorios y las rutas son adaptadores al
      // proveedor y al marco, y se ejercen en N2 y N3.
      include: ['src/modules/**/*.service.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: { lines: 80 },
    },
  },
});
