import { z } from 'zod';

/**
 * Configuracion del servidor.
 *
 * Las dos claves llevan el nombre con el que Supabase las publica hoy en
 * *Project Settings → API Keys*: **publicable** y **secreta**. Lo que cambia
 * entre ellas no es el alcance de un permiso, sino si las politicas del motor
 * se aplican o no, y de ahi que cada una tenga su lugar (ADR-008).
 */
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),

  /**
   * Clave **publicable**: publica por diseno. El acceso lo deciden las
   * politicas del motor evaluadas sobre la identidad de quien consulta, no el
   * secreto de la clave. Es la misma que se entrega al navegador.
   */
  SUPABASE_PUBLISHABLE_KEY: clave('SUPABASE_PUBLISHABLE_KEY'),

  /**
   * Clave **secreta**: **salta las politicas RLS**. Nunca sale del servidor, y
   * su uso esta acotado a las siete excepciones que enumera `supabase.ts`
   * (RNF-103, ADR-008).
   */
  SUPABASE_SECRET_KEY: clave('SUPABASE_SECRET_KEY'),

  /**
   * En desarrollo conviene autoconfirmar el correo al registrar, porque no hay
   * proveedor SMTP configurado. En produccion se deja en `false` y la
   * confirmacion se configura en Supabase.
   */
  AUTH_AUTO_CONFIRM_EMAIL: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

/**
 * Clave obligatoria que ademas rechaza los marcadores del `.env.example`
 * (`sb_secret_<...>`). Sin esta comprobacion, copiar el ejemplo y olvidar
 * rellenar una de las dos deja un valor no vacio que el esquema aceptaria, y
 * el fallo reaparece mucho despues como un `401` de Supabase que cuesta
 * atribuir a su causa.
 */
function clave(nombre: string) {
  return z
    .string()
    .min(1, `Falta ${nombre}. Esta en Project Settings → API Keys.`)
    .refine((v) => !v.includes('<') && !v.includes('>'), {
      message: `${nombre} conserva el marcador del .env.example: reemplazalo por la clave real.`,
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
    const detalle = parsed.error.issues.map((i) => i.message).join(' · ');
    throw new Error(`Configuracion invalida. ${detalle} Ver server/.env.example.`);
  }

  cached = {
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabasePublishableKey: parsed.data.SUPABASE_PUBLISHABLE_KEY,
    supabaseSecretKey: parsed.data.SUPABASE_SECRET_KEY,
    autoConfirmEmail: parsed.data.AUTH_AUTO_CONFIRM_EMAIL,
  };
  return cached;
}
