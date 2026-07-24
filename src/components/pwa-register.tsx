'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const hostname = window.location.hostname;
      // Only register PWA service worker on app subdomain (app.kytbox.com or app.localhost)
      if (!hostname.startsWith('app.')) {
        return;
      }

      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.error('PWA service worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
