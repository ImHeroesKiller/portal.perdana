import { guardApi, sanitizeServerError } from './api-security';
import { formatFirebaseError, toErrorPayload, toHttpStatus } from './firebase-errors';
import type { RateLimitConfig } from './api-rate-limit';

type ApiHandler = (req: any, res: any) => Promise<void> | void;

type ApiHandlerOptions = {
  rateLimit?: RateLimitConfig;
  requireOrigin?: boolean;
  requireAdmin?: boolean;
};

export function withApiHandler(handler: ApiHandler, options?: ApiHandlerOptions): ApiHandler {
  return async (req, res) => {
    try {
      if (!guardApi(req, res, options)) return;
      await handler(req, res);
    } catch (error: unknown) {
      console.error('Unhandled API error:', error);
      if (!res.headersSent) {
        const payload = toErrorPayload(error);
        if (payload.error) payload.error = sanitizeServerError(String(payload.error));
        res.status(toHttpStatus(error)).json(payload);
      }
    }
  };
}

export function sendApiError(res: any, error: unknown): void {
  const status = toHttpStatus(error);
  console.error(`API error (${status}):`, formatFirebaseError(error));
  const payload = toErrorPayload(error);
  if (payload.error) payload.error = sanitizeServerError(String(payload.error));
  res.status(status).json(payload);
}