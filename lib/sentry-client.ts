import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentryClient(): boolean {
  if (initialized) return true;

  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
    sendDefaultPii: false,
  });

  initialized = true;
  return true;
}

export { Sentry };