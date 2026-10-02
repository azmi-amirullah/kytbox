const CACHE_NAME = 'kytbox-v2.2';
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png'
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
          .filter((name) => name.startsWith('kytbox-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - immutable assets cache-first, mutable public assets network-first
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests like analytics or Supabase DB queries
  if (url.origin !== self.location.origin) return;

  // Next.js static assets use content-hashed URLs, so cache-first is safe.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(event.request);
        if (networkResponse.ok) {
          void cache.put(event.request, networkResponse.clone()).catch((error) => {
            console.warn('Failed to cache Next.js asset:', event.request.url, error);
          });
        }
        return networkResponse;
      })()
    );
    return;
  }

  // Public assets can keep the same URL across deployments, so refresh them first.
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/screenshots/') ||
    /^\/[^/]+\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url.pathname) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(event.request, { cache: 'no-cache' });
          if (networkResponse.ok) {
            void cache.put(event.request, networkResponse.clone()).catch((error) => {
              console.warn('Failed to cache public asset:', event.request.url, error);
            });
          }
          return networkResponse;
        } catch (error) {
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) return cachedResponse;
          throw error;
        }
      })()
    );
    return;
  }

  // Never cache page navigations because they may contain user-specific data.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
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
              headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/html',
              },
            }
          );
        })
    );
  }
});
