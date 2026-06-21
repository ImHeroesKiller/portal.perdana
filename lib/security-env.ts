/**
 * Environment variable audit — server-only vs safe for Vite client bundle.
 * Use when reviewing Vercel project settings.
 */

export const SERVER_ONLY_ENV_KEYS = [
  'IHK_TOKEN',
  'GROK_API_KEY',
  'GEMINI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'API_ADMIN_SECRET',
  'SENTRY_DSN',
  'CRON_SECRET',
  'FIRESTORE_BACKUP_BUCKET',
] as const;

/** Safe to expose in browser (Firebase client config is public-by-design). */
export const CLIENT_SAFE_VITE_KEYS = [
  'VITE_SENTRY_DSN',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_FIREBASE_DATABASE_ID',
] as const;

/** Must NOT be prefixed with VITE_ — will be bundled into client JS. */
export const FORBIDDEN_CLIENT_KEYS = [
  'VITE_TELEGRAM_BOT_TOKEN',
  'VITE_GEMINI_API_KEY',
  'VITE_GROK_API_KEY',
  'VITE_FIREBASE_PRIVATE_KEY',
  'VITE_API_ADMIN_SECRET',
] as const;

export type EnvAuditResult = {
  serverOnly: string[];
  clientSafe: string[];
  forbiddenInClient: string[];
  vercelChecklist: string[];
};

export function getEnvAuditChecklist(): EnvAuditResult {
  return {
    serverOnly: [...SERVER_ONLY_ENV_KEYS],
    clientSafe: [...CLIENT_SAFE_VITE_KEYS],
    forbiddenInClient: [...FORBIDDEN_CLIENT_KEYS],
    vercelChecklist: [
      'Set IHK_TOKEN (Hugging Face) — Sara recruitment chat, server only',
      'Set GROK_API_KEY (opsional/legacy) — Server only, jangan VITE_',
      'Set GEMINI_API_KEY — Server only',
      'Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID — Server only',
      'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY — Server only',
      'Set API_ADMIN_SECRET — Server only, untuk /api/db/seed/all',
      'Set SENTRY_DSN — Server only; VITE_SENTRY_DSN OK di client',
      'Set CRON_SECRET — Server only, untuk Vercel Cron uptime-check',
      'Set FIRESTORE_BACKUP_BUCKET — Server only, untuk backup otomatis',
      'Set VITE_FIREBASE_* — OK di client (Firebase public config)',
      'HAPUS VITE_TELEGRAM_BOT_TOKEN dan VITE_GEMINI_API_KEY dari Vercel jika masih ada',
      'Jangan centang "Expose to Browser" untuk secret di Vercel',
    ],
  };
}