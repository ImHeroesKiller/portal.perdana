import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { queryClient } from './lib/queryClient';
import { initGoogleAnalytics } from './lib/google-analytics';

void initGoogleAnalytics();

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
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

requestAnimationFrame(() => {
  requestAnimationFrame(dismissPwaSplash);
});