/** Dev-server local de `server/`. Se sobreescribe con VITE_API_BASE_URL. */
const DEFAULT_API_BASE_URL = 'http://localhost:8787'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
