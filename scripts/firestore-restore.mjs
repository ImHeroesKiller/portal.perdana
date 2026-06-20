#!/usr/bin/env node
/**
 * Trigger a Firestore import from a GCS backup prefix.
 *
 * Usage:
 *   node scripts/firestore-restore.mjs gs://bucket/backups/2026-06-21T02-00-00-000Z
 *
 * Requires the same env vars as firestore-backup.mjs.
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { GoogleAuth } = require('google-auth-library');

function readEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const databaseId = process.env.FIRESTORE_DATABASE_ID?.trim() || '(default)';

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return { projectId, clientEmail, privateKey, databaseId };
}

async function getAccessToken(credentials) {
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Failed to obtain Google access token');
  return token.token;
}

async function importFirestore(inputUri) {
  if (!inputUri?.startsWith('gs://')) {
    throw new Error('Input URI must start with gs:// (e.g. gs://bucket/backups/2026-06-21...)');
  }

  const { projectId, clientEmail, privateKey, databaseId } = readEnv();
  const credentials = {
    type: 'service_account',
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };

  const accessToken = await getAccessToken(credentials);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}:importDocuments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputUri }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || `Import failed with HTTP ${response.status}`);
  }

  console.log('Firestore import started.');
  console.log('Operation:', body.name || '(unknown)');
  console.log('Input:', inputUri);
}

const inputUri = process.argv[2];
importFirestore(inputUri).catch((error) => {
  console.error('firestore-restore failed:', error.message || error);
  process.exit(1);
});