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

export function formatFirebaseError(error: unknown): string {
  if (error instanceof FirebaseConfigError || error instanceof FirebaseConnectionError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function toHttpStatus(error: unknown): number {
  if (error instanceof FirebaseConfigError) return 503;
  if (error instanceof FirebaseConnectionError) return 503;
  const message = formatFirebaseError(error).toLowerCase();
  if (message.includes('not configured') || message.includes('belum dikonfigurasi')) return 503;
  if (message.includes('permission') || message.includes('denied')) return 403;
  return 500;
}