import { applyCors, handleOptions } from './api-cors';
import { applyNoStoreHeaders } from './api-cache';
import { formatFirebaseError, toErrorPayload, toHttpStatus } from './firebase-errors';

type ApiHandler = (req: any, res: any) => Promise<void> | void;

export function withApiHandler(handler: ApiHandler): ApiHandler {
  return async (req, res) => {
    try {
      applyCors(res);
      applyNoStoreHeaders(res);
      if (handleOptions(req, res)) return;
      await handler(req, res);
    } catch (error: unknown) {
      console.error('Unhandled API error:', error);
      if (!res.headersSent) {
        res.status(toHttpStatus(error)).json(toErrorPayload(error));
      }
    }
  };
}

export function sendApiError(res: any, error: unknown): void {
  const status = toHttpStatus(error);
  console.error(`API error (${status}):`, formatFirebaseError(error));
  res.status(status).json(toErrorPayload(error));
}