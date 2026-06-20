const Sentry = require('@sentry/node');

let initialized = false;

function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1,
    sendDefaultPii: false,
  });
  initialized = true;
}

function captureError(error, context) {
  initSentry();
  if (!process.env.SENTRY_DSN?.trim()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

function wrapHandler(handler) {
  initSentry();
  return async function wrappedHandler(req, res) {
    try {
      await handler(req, res);
    } catch (error) {
      captureError(error, { path: req.url, method: req.method });
      if (process.env.SENTRY_DSN?.trim()) {
        await Sentry.flush(2000);
      }
      console.error('Unhandled API error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}

module.exports = { initSentry, captureError, wrapHandler };