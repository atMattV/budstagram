// public/sw.js
// Versioned, strict pass-through SW (no fetch interception at all)
const SW_VERSION = 'bud-7';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Optionally clean old caches if you ever add them in future.
    const keys = await caches.keys();
    await Promise.all(
      keys.map((k) => (k.startsWith('bud-') ? caches.delete(k) : Promise.resolve()))
    );
  })());
  self.clients.claim();
});

// IMPORTANT: do NOT add a 'fetch' listener.
// With no fetch handler, the SW never intercepts network and cannot cache API calls.
