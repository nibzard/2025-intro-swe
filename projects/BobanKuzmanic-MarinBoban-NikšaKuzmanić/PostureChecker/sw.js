const CACHE_NAME = 'opencvtest-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './index.js',
  './openCV/opencv.js',
  './styles.css',
  './openCV/haarcascade_frontalface_default.xml',
  './openCV/haarcascade_eye.xml',
  './manifest.json',
  './openCV/icons/icon-192.svg',
  './openCV/icons/icon-512.svg'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then((resp) => {
      if (resp) return resp;
      return fetch(evt.request).catch(() => {
        if (evt.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
