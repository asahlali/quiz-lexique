/* VocabVISION — Service Worker
   Met l'application en cache pour un fonctionnement hors-ligne
   et permet l'installation depuis le navigateur (PWA). */

const CACHE = 'vocabvision-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

// Installation : on pré-charge la coquille de l'app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Récupération : réseau d'abord (pour la synchro Google Sheets),
// repli sur le cache si hors-ligne.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Les appels vers Google (synchro) passent toujours par le réseau
  if (url.hostname.includes('script.google') || url.hostname.includes('googleusercontent')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // met à jour le cache des ressources de l'app
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
