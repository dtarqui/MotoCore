import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Registro del service worker — RNF-403: la aplicación debe ser instalable.
 *
 * Solo en la compilación de producción: en desarrollo interceptaría los
 * recursos que el servidor de Vite recarga en caliente. El worker cachea el
 * armazón, nunca datos de negocio (ver `public/sw.js`).
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('No se pudo registrar el service worker', error)
    })
  })
}
