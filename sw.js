// Service worker: menyimpan tampilan aplikasi agar cepat dibuka & bisa di-install.
// Data surat TIDAK pernah disimpan di cache.
// Naikkan nomor versi setiap kali file aplikasi diubah.
const VERSI = 'surat-v3';
const ASET = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSI).then((c) => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSI).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // API lewat langsung
  // Jaringan dulu (agar pembaruan cepat terasa), cache bila offline
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const salin = r.clone();
        caches.open(VERSI).then((c) => c.put(e.request, salin));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
