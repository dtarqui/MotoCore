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
  },
});
