const CACHE_NAME = 'kytbox-v2';
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/icon.png'
];

// Install event - precache core static assets safely
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to precache ${url}:`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Stale-while-revalidate for static assets, network-first for pages
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests like analytics or Supabase DB queries
  if (url.origin !== self.location.origin) return;

  // Static assets (images, CSS, JS, fonts) -> Cache first, fallback to network
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // HTML Navigation routes -> Network first, dynamic cache, fallback to offline shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successfully loaded pages dynamically (only status 200 and not redirected)
          if (networkResponse && networkResponse.status === 200 && !networkResponse.redirected) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Return beautiful custom offline fallback page directly
            return new Response(
              `<!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Offline | Kytbox</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #09090b;
                    color: #fafafa;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                  }
                  .container {
                    padding: 2rem;
                    max-width: 400px;
                  }
                  h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: -0.025em; }
                  p { color: #a1a1aa; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
                  .btn {
                    background: #ffffff;
                    color: #09090b;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                    transition: opacity 0.2s;
                  }
                  .btn:hover {
                    opacity: 0.9;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>You are offline</h1>
                  <p>Check your internet connection and try again.</p>
                  <button class="btn" onclick="window.location.reload()">Retry</button>
                </div>
              </body>
              </html>`,
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          });
        })
    );
  }
});
