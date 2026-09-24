'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    // Strictly isolate PWA to app subdomain (e.g. app.kytbox.com) and local/preview testing
    const isAppHost =
      hostname.startsWith('app.') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1';

    // If on marketing domain (kytbox.com) or custom bio domain:
    // Strip any manifest tag and unregister any active service worker so PWA is never installed here
    if (!isAppHost) {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.remove();
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      return;
    }

    if (process.env.NODE_ENV !== 'production' && !window.location.search.includes('test-pwa')) {
      // Actively unregister in dev to prevent caching locks unless explicitly testing PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      // Ensure manifest link exists on app subdomain
      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.setAttribute('rel', 'manifest');
        manifestLink.setAttribute('href', '/manifest.json');
        document.head.appendChild(manifestLink);
      }

      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.error('PWA service worker registration failed:', err);
          });
      };

      // Fast non-blocking registration: don't wait for heavy window 'load' event
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(registerSW);
        } else {
          setTimeout(registerSW, 200);
        }
      } else {
        window.addEventListener(
          'DOMContentLoaded',
          () => {
            if ('requestIdleCallback' in window) {
              window.requestIdleCallback(registerSW);
            } else {
              setTimeout(registerSW, 200);
            }
          },
          { once: true }
        );
      }
    }
  }, []);

  return null;
}
