// Minimal pass-through SW so the app is installable
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

// Optional: you can add caching later.
// For now, just let requests go to the network.
self.addEventListener('fetch', () => {});
