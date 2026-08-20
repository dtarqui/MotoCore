// `defineConfig` viene de vitest/config y no de vite: es la que conoce la
// clave `test`. Es un superconjunto del de Vite, asi que la build no cambia.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // La interfaz se prueba contra un DOM simulado: no hace falta navegador.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // El cliente de Supabase exige estas variables al importarse. Son valores
    // de relleno: ninguna prueba llega a la red, pero sin ellas el modulo
    // lanza y arrastra a toda la suite que lo importe en cadena.
    env: {
      VITE_SUPABASE_URL: 'https://proyecto.test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_de_prueba',
      VITE_API_BASE_URL: 'http://localhost:8787',
    },
  },
})
