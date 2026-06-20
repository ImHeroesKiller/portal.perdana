import { createRequire } from 'module';
import { join } from 'path';

const nodeRequire = createRequire(join(process.cwd(), 'package.json'));

type SentryModule = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: unknown, context?: { extra?: Record<string, unknown> }) => void;
};

let initialized = false;

function loadSentry(): SentryModule | null {
  try {
    return nodeRequire('@sentry/node') as SentryModule;
  } catch {
    return null;
  }
}

export function initSentryServer(): void {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const Sentry = loadSentry();
  if (!Sentry) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    sendDefaultPii: false,
  });
  initialized = true;
}

export function captureServerError(error: unknown, context?: Record<string, unknown>): void {
  initSentryServer();
  if (!process.env.SENTRY_DSN?.trim()) return;
  const Sentry = loadSentry();
  if (!Sentry) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}