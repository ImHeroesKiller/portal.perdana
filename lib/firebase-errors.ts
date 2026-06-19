export class FirebaseConfigError extends Error {
  readonly code = 'FIREBASE_CONFIG_ERROR';
  readonly missing?: string[];

  constructor(message: string, missing?: string[]) {
    super(message);
    this.name = 'FirebaseConfigError';
    this.missing = missing;
  }
}

export class FirebaseConnectionError extends Error {
  readonly code = 'FIREBASE_CONNECTION_ERROR';
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FirebaseConnectionError';
    this.cause = cause;
  }
}

export interface ConnectionTestResult {
  ok: boolean;
  side: 'admin' | 'client';
  projectId?: string;
  databaseId?: string;
  error?: string;
  missing?: string[];
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** Duck-type check — instanceof breaks when Vercel bundles duplicate class copies. */
export function isFirebaseConfigError(error: unknown): error is FirebaseConfigError {
  return (
    error instanceof FirebaseConfigError ||
    getErrorCode(error) === 'FIREBASE_CONFIG_ERROR'
  );
}

export function isFirebaseConnectionError(error: unknown): error is FirebaseConnectionError {
  return (
    error instanceof FirebaseConnectionError ||
    getErrorCode(error) === 'FIREBASE_CONNECTION_ERROR'
  );
}

export function formatFirebaseError(error: unknown): string {
  if (isFirebaseConfigError(error) || isFirebaseConnectionError(error)) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function toHttpStatus(error: unknown): number {
  if (isFirebaseConfigError(error) || isFirebaseConnectionError(error)) return 503;
  const message = formatFirebaseError(error).toLowerCase();
  if (message.includes('not configured') || message.includes('belum dikonfigurasi')) return 503;
  if (message.includes('private key') || message.includes('credential')) return 503;
  if (message.includes('permission') || message.includes('denied')) return 403;
  return 500;
}

export function toErrorPayload(error: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    error: formatFirebaseError(error) || 'Internal server error',
  };
  if (isFirebaseConfigError(error) && error.missing?.length) {
    payload.missing = error.missing;
    payload.hint = 'Set env vars di Vercel → Project Settings → Environment Variables (Production).';
  }
  if (isFirebaseConnectionError(error)) {
    payload.code = 'FIREBASE_CONNECTION_ERROR';
  }
  if (isFirebaseConfigError(error)) {
    payload.code = 'FIREBASE_CONFIG_ERROR';
  }
  return payload;
}