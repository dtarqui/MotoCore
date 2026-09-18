/**
 * Service worker de MotoCore — RNF-403 (instalable como PWA).
 *
 * QUÉ CACHEA, Y QUÉ NO. Solo el **armazón de la aplicación**: el documento, el
 * manifiesto, los iconos y los recursos estáticos que Vite publica con un
 * nombre versionado. **Ninguna respuesta de la interfaz de programación se
 * guarda aquí**, y no es un descuido: la caché de datos de negocio vive en
 * memoria y se vacía al cerrar la sesión (ADR-010). Persistirla en el
 * dispositivo dejaría datos de una organización en el equipo del operador y
 * podría mostrarlos después de cambiar de contexto, que es exactamente el
 * error de percepción que ADR-010 evita.
 *
 * El nombre de la caché lleva versión: al publicar una nueva, la anterior se
 * borra entera en la activación.
 */
const CACHE = 'motocore-shell-v1';

const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo lecturas del propio origen: la API y el proveedor de identidad viven
  // en otro, y sus respuestas no deben tocar esta caché.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Navegación: se prefiere la red, para que una publicación nueva se vea de
  // inmediato; sin conexión, se sirve el documento cacheado.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached ?? Response.error())),
    );
    return;
  }

  // Recursos versionados de la compilación: cambian de nombre en cada
  // publicación, de modo que servirlos desde la caché no deja nada obsoleto.
  if (url.pathname.startsWith('/assets/') || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
