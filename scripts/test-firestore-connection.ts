/**
 * Firestore connection test — Admin SDK, client env, optional remote health.
 *
 * Usage:
 *   npm run test:firestore
 *   npm run test:firestore -- --url https://portal.perdana.net
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  getMissingAdminEnvKeys,
  getMissingClientEnvKeys,
  readFirebaseAdminEnv,
  readFirebaseClientEnvFromProcess,
} from '../lib/firebase-env';
import { isAdminConfigured, testAdminConnection } from '../lib/firebase-admin';

function loadEnvFile(): void {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(): { remoteUrl?: string } {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf('--url');
  const remoteUrl = urlIdx !== -1 ? args[urlIdx + 1] : undefined;
  return { remoteUrl };
}

function status(ok: boolean): string {
  return ok ? '✓' : '✗';
}

function section(title: string): void {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
}

async function testRemoteHealth(baseUrl: string): Promise<boolean> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/firebase-health`;

  try {
    const res = await fetch(url);
    const body = (await res.json()) as {
      ok?: boolean;
      admin?: {
        configured?: boolean;
        connected?: boolean;
        projectId?: string | null;
        databaseId?: string | null;
        error?: string | null;
        missing?: string[];
      };
    };

    const ok = res.ok && Boolean(body.ok) && Boolean(body.admin?.connected);
    console.log(`${status(ok)} Remote health (${res.status}) — ${url}`);
    console.log(`  configured: ${body.admin?.configured ?? false}`);
    console.log(`  connected:  ${body.admin?.connected ?? false}`);
    console.log(`  projectId:  ${body.admin?.projectId ?? '(unknown)'}`);
    console.log(`  databaseId: ${body.admin?.databaseId ?? '(unknown)'}`);
    if (body.admin?.missing?.length) {
      console.log(`  missing:    ${body.admin.missing.join(', ')}`);
    }
    if (body.admin?.error) {
      console.log(`  error:      ${body.admin.error}`);
    }
    return ok;
  } catch (error) {
    console.log(`✗ Remote health — ${url}`);
    console.log(`  error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function main(): Promise<void> {
  const { remoteUrl } = parseArgs();
  loadEnvFile();

  console.log('Firestore Connection Test');
  console.log(`cwd: ${process.cwd()}`);

  let allOk = true;

  section('Admin env (server)');
  const adminEnv = readFirebaseAdminEnv();
  const adminConfigured = isAdminConfigured();
  console.log(`${status(adminConfigured)} Admin credentials`);
  if (adminEnv) {
    console.log(`  projectId:  ${adminEnv.projectId}`);
    console.log(`  clientEmail: ${adminEnv.clientEmail}`);
    console.log(`  databaseId: ${adminEnv.databaseId ?? '(default)'}`);
  } else {
    const missing = getMissingAdminEnvKeys();
    console.log(`  missing: ${missing.join(', ')}`);
    allOk = false;
  }

  section('Admin connection (Firestore read)');
  if (adminConfigured) {
    const result = await testAdminConnection();
    console.log(`${status(result.ok)} Firestore Admin SDK`);
    if (result.ok) {
      console.log(`  projectId:  ${result.projectId}`);
      console.log(`  databaseId: ${result.databaseId}`);
      console.log('  probe:      settings collection (limit 1)');
    } else {
      console.log(`  error: ${result.error ?? 'unknown'}`);
      allOk = false;
    }
  } else {
    console.log('✗ Skipped — admin env belum lengkap');
    allOk = false;
  }

  section('Client env (browser / Vite)');
  const clientEnv = readFirebaseClientEnvFromProcess();
  const clientOk = clientEnv !== null;
  console.log(`${status(clientOk)} Client credentials (VITE_FIREBASE_*)`);
  if (clientEnv) {
    console.log(`  projectId:  ${clientEnv.projectId}`);
    console.log(`  authDomain: ${clientEnv.authDomain}`);
    console.log(`  databaseId: ${clientEnv.databaseId ?? '(default)'}`);
  } else {
    const missing = getMissingClientEnvKeys();
    console.log(`  missing: ${missing.join(', ')}`);
    allOk = false;
  }

  if (remoteUrl) {
    section('Remote health (deployed API)');
    const remoteOk = await testRemoteHealth(remoteUrl);
    if (!remoteOk) allOk = false;
  } else {
    section('Remote health (optional)');
    console.log('  skipped — tambahkan --url https://portal.perdana.net untuk test deploy');
  }

  console.log('\n' + (allOk ? '✓ Semua test lulus.' : '✗ Ada test yang gagal.'));
  process.exit(allOk ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal:', error instanceof Error ? error.message : error);
  process.exit(1);
});