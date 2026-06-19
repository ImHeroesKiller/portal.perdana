import { applyCors, handleOptions } from '../lib/api-cors';
import { testAdminConnection, isAdminConfigured } from '../lib/firebase-admin';

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const admin = await testAdminConnection();

  return res.status(admin.ok ? 200 : 503).json({
    ok: admin.ok,
    timestamp: new Date().toISOString(),
    admin: {
      configured: isAdminConfigured(),
      connected: admin.ok,
      projectId: admin.projectId ?? null,
      databaseId: admin.databaseId ?? null,
      missing: admin.missing ?? [],
      error: admin.error ?? null,
    },
    client: {
      note: 'Client SDK health check hanya tersedia di browser via testClientConnection().',
      requiredEnv: [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
        'VITE_FIREBASE_DATABASE_ID',
      ],
    },
  });
}