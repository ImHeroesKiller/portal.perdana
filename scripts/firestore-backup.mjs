#!/usr/bin/env node
/**
 * Trigger a Firestore export to Google Cloud Storage.
 *
 * Requires:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *   FIRESTORE_BACKUP_BUCKET (GCS bucket name, no gs:// prefix)
 *
 * Optional:
 *   FIRESTORE_DATABASE_ID (default: (default))
 *   FIRESTORE_BACKUP_PREFIX (default: backups)
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { GoogleAuth } = require('google-auth-library');

function readEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  const bucket = process.env.FIRESTORE_BACKUP_BUCKET?.trim();
  const databaseId = process.env.FIRESTORE_DATABASE_ID?.trim() || '(default)';
  const prefix = process.env.FIRESTORE_BACKUP_PREFIX?.trim() || 'backups';

  if (!projectId || !clientEmail || !privateKey || !bucket) {
    const missing = [
      !projectId && 'FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
      !bucket && 'FIRESTORE_BACKUP_BUCKET',
    ].filter(Boolean);
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return { projectId, clientEmail, privateKey, bucket, databaseId, prefix };
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

async function exportFirestore() {
  const { projectId, clientEmail, privateKey, bucket, databaseId, prefix } = readEnv();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputUriPrefix = `gs://${bucket}/${prefix}/${timestamp}`;

  const credentials = {
    type: 'service_account',
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };

  const accessToken = await getAccessToken(credentials);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${encodeURIComponent(databaseId)}:exportDocuments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ outputUriPrefix }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || `Export failed with HTTP ${response.status}`);
  }

  console.log('Firestore export started.');
  console.log('Operation:', body.name || '(unknown)');
  console.log('Output:', outputUriPrefix);
  return { outputUriPrefix, operation: body.name };
}

exportFirestore().catch((error) => {
  console.error('firestore-backup failed:', error.message || error);
  process.exit(1);
});