import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { ThemeProvider } from './components/ThemeProvider.tsx';
import { DateFilterProvider } from './components/DateFilterProvider.tsx';
import './index.css';

import { Capacitor } from '@capacitor/core';

// Manually handle PWA registration so we don't accidentally cache local Capacitor assets
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
} else {
  // If running in Capacitor, unregister any existing service workers to prevent infinite cache loops
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider defaultTheme="system" storageKey="expense-tracker-theme">
        <DateFilterProvider>
          <App />
        </DateFilterProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
);
