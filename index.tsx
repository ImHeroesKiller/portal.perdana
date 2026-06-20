import './index.css';
import './services/i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/queryClient';
import { initGoogleAnalytics } from './lib/google-analytics';
import { initSentryClient, Sentry } from './lib/sentry-client';

void initGoogleAnalytics();
initSentryClient();

function dismissPwaSplash() {
  const splash = document.getElementById('pwa-splash');
  if (!splash || splash.classList.contains('pwa-splash--hide')) return;
  splash.classList.add('pwa-splash--hide');
  window.setTimeout(() => splash.remove(), 400);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p className="p-6 text-center text-slate-700">Terjadi kesalahan. Muat ulang halaman.</p>}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

requestAnimationFrame(() => {
  requestAnimationFrame(dismissPwaSplash);
});