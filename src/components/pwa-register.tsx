'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV !== 'production') {
        // Actively unregister any registered service workers in development to prevent dev cache lock
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              registration.unregister().then((success) => {
                if (success) {
                  console.log('Unregistered development service worker');
                }
              });
            }
          });
        }
        return;
      }

      if ('serviceWorker' in navigator) {
        const hostname = window.location.hostname;
        // Only register PWA service worker on app subdomain (app.kytbox.com)
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
    }
  }, []);

  return null;
}
