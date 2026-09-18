import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de Supabase del navegador.
 *
 * La identidad la gestiona Supabase Auth: registro, inicio de sesión, renovación
 * de sesión y recuperación de contraseña ocurren aquí, contra el proveedor, no
 * contra nuestra API (ADR-004). La API solo verifica el token que le llega.
 *
 * Usa exclusivamente la clave **publicable**, que es pública por diseño: el
 * acceso a los datos lo deciden las políticas de la base de datos, no el
 * secreto de la clave. La clave **secreta** NUNCA debe llegar al navegador.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Ver frontend/.env.example.')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
