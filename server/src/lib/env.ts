import { z } from 'zod';

/**
 * Configuración del servidor. Toda diferencia entre entornos vive aquí, en
 * variables, y ninguna en el código (RNF-303).
 *
 * Las dos claves llevan el nombre con el que Supabase las publica hoy en
 * *Project Settings → API Keys*: **publicable** y **secreta**. Lo que cambia
 * entre ellas no es el alcance de un permiso, sino si las políticas del motor
 * se aplican o no, y de ahí que cada una tenga su lugar (ADR-008).
 */
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),

  /**
   * Clave **publicable**: pública por diseño. El acceso lo deciden las
   * políticas del motor evaluadas sobre la identidad de quien consulta, no el
   * secreto de la clave. Es la misma que se entrega al navegador.
   */
  SUPABASE_PUBLISHABLE_KEY: clave('SUPABASE_PUBLISHABLE_KEY'),

  /**
   * Clave **secreta**: **salta las políticas RLS**. Nunca sale del servidor, y
   * su uso está acotado a las siete excepciones que enumera `supabase.ts`
   * (RNF-103, ADR-008).
   */
  SUPABASE_SECRET_KEY: clave('SUPABASE_SECRET_KEY'),

  /**
   * En desarrollo conviene autoconfirmar el correo al registrar, porque no hay
   * proveedor SMTP configurado. En producción se deja en `false` y la
   * confirmación se configura en Supabase.
   */
  AUTH_AUTO_CONFIRM_EMAIL: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

/**
 * Clave obligatoria que además rechaza los marcadores del `.env.example`
 * (`sb_secret_<...>`). Sin esta comprobación, copiar el ejemplo y olvidar
 * rellenar una de las dos deja un valor no vacío que el esquema aceptaría, y
 * el fallo reaparece mucho después como un `401` de Supabase que cuesta
 * atribuir a su causa.
 */
function clave(nombre: string) {
  return z
    .string()
    .min(1, `Falta ${nombre}. Está en Project Settings → API Keys.`)
    .refine((v) => !v.includes('<') && !v.includes('>'), {
      message: `${nombre} conserva el marcador del .env.example: reemplázalo por la clave real.`,
    });
}

export type Env = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseSecretKey: string;
  autoConfirmEmail: boolean;
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Con el path delante: «Required» a secas no dice cuál de las tres falta.
    const detalle = parsed.error.issues.map((i) => `${i.path.join('.') || '(raiz)'}: ${i.message}`).join(' · ');
    throw new Error(`Configuración inválida. ${detalle} Ver server/.env.example.`);
  }

  cached = {
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabasePublishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
    supabaseSecretKey: parsed.data.SUPABASE_SECRET_KEY,
    autoConfirmEmail: parsed.data.AUTH_AUTO_CONFIRM_EMAIL,
  };
  return cached;
}

/** Origen del cliente web en desarrollo, cuando no se declara ninguno. */
const DEV_ORIGIN = 'http://localhost:5173';

/**
 * Orígenes de navegador admitidos: solo los del cliente web de cada entorno
 * (Requisitos, sección 5; Seguridad, «Transporte y superficie de exposición»).
 *
 * Se lee aparte de `getEnv()` porque no depende de Supabase: la política de
 * orígenes se aplica también a las peticiones que fallan antes de llegar a la
 * base, y las pruebas de contrato la ejercen sin credenciales.
 */
export function getAllowedOrigins(): string[] {
  const declared = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return declared.length > 0 ? declared : [DEV_ORIGIN];
}
