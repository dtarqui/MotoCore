import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // En dev conviene autoconfirmar el email al registrar (no hay proveedor SMTP).
  // En produccion dejar en 'false' y configurar el correo de confirmacion en Supabase.
  AUTH_AUTO_CONFIRM_EMAIL: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

export type Env = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  autoConfirmEmail: boolean;
};

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(
      `Configuracion invalida: revisa las variables de entorno (${missing}). Ver server/.env.example.`,
    );
  }
  cached = {
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    autoConfirmEmail: parsed.data.AUTH_AUTO_CONFIRM_EMAIL ?? false,
  };
  return cached;
}
