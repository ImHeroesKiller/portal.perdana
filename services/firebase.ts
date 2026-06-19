/**
 * Public Firebase client entrypoint.
 * Server code must use `lib/firebase-admin.ts` instead.
 */
export {
  getFirebaseApp,
  getClientAuth,
  getClientDb,
  getClientEnv,
  isFirebaseConfigured,
  testClientConnection,
} from './firebase-client';

export { getFirebaseApp as default } from './firebase-client';