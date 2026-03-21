const DEFAULT_API_BASE_URL = 'https://localhost:7222'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
