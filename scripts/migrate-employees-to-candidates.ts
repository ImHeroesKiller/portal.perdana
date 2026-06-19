/**
 * Migrate recruitment data from `employees` → `candidates` collection.
 *
 * Usage:
 *   npm run migrate:candidates              # dry-run (default)
 *   npm run migrate:candidates -- --execute # write to Firestore
 *   npm run migrate:candidates -- --execute --merge  # merge into existing candidate docs
 *
 * Requires Firebase Admin env in .env (same as init-firestore).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getAdminDb, isAdminConfigured, testAdminConnection } from '../lib/firebase-admin';
import {
  CANDIDATES_COLLECTION,
  mapLegacyEmployeeToCandidate,
} from '../lib/candidate-record';

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

function parseArgs(): { execute: boolean; merge: boolean } {
  const args = process.argv.slice(2);
  return {
    execute: args.includes('--execute'),
    merge: args.includes('--merge'),
  };
}

async function main(): Promise<void> {
  const { execute, merge } = parseArgs();
  loadEnvFile();

  console.log('═'.repeat(60));
  console.log('  Migrate: employees → candidates');
  console.log(`  Mode: ${execute ? (merge ? 'EXECUTE (merge)' : 'EXECUTE (skip existing)') : 'DRY-RUN'}`);
  console.log('═'.repeat(60));

  if (!isAdminConfigured()) {
    console.error('✗ Firebase Admin belum dikonfigurasi. Set FIREBASE_* di .env');
    process.exit(1);
  }

  const health = await testAdminConnection();
  if (!health.ok) {
    console.error('✗ Koneksi Firestore gagal:', health.error);
    process.exit(1);
  }

  console.log(`✓ Terhubung — project: ${health.projectId}, database: ${health.databaseId}\n`);

  const db = getAdminDb();
  const [employeesSnap, candidatesSnap] = await Promise.all([
    db.collection('employees').get(),
    db.collection(CANDIDATES_COLLECTION).get(),
  ]);

  const existingCandidateIds = new Set(candidatesSnap.docs.map((d) => d.id));
  const employees = employeesSnap.docs.map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }));

  console.log(`employees collection:  ${employees.length} dokumen`);
  console.log(`candidates collection: ${candidatesSnap.size} dokumen (existing)\n`);

  if (employees.length === 0) {
    console.log('Tidak ada data di employees — tidak perlu migrasi.');
    process.exit(0);
  }

  let wouldCreate = 0;
  let wouldMerge = 0;
  let wouldSkip = 0;

  for (const { id, data } of employees) {
    const mapped = mapLegacyEmployeeToCandidate({ ...data, id }, id);
    const exists = existingCandidateIds.has(id);

    if (exists && !merge) {
      wouldSkip++;
      console.log(`  SKIP  ${id} — ${mapped.fullName} (sudah ada di candidates)`);
      continue;
    }

    if (exists && merge) {
      wouldMerge++;
      console.log(`  MERGE ${id} — ${mapped.fullName} | source: ${mapped.source} | status: ${mapped.status}`);
    } else {
      wouldCreate++;
      console.log(`  NEW   ${id} — ${mapped.fullName} | source: ${mapped.source} | status: ${mapped.status}`);
    }
  }

  console.log('\n── Ringkasan ──');
  console.log(`  Baru:    ${wouldCreate}`);
  console.log(`  Merge:   ${wouldMerge}`);
  console.log(`  Skip:    ${wouldSkip}`);

  if (!execute) {
    console.log('\n⚠️  DRY-RUN — tidak ada perubahan ditulis.');
    console.log('    Jalankan: npm run migrate:candidates -- --execute');
    console.log('    Atau merge: npm run migrate:candidates -- --execute --merge');
    process.exit(0);
  }

  console.log('\nMenulis ke Firestore...');
  const batchSize = 400;
  let written = 0;

  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = db.batch();
    const chunk = employees.slice(i, i + batchSize);

    for (const { id, data } of chunk) {
      const exists = existingCandidateIds.has(id);
      if (exists && !merge) continue;

      const mapped = mapLegacyEmployeeToCandidate({ ...data, id }, id);
      const ref = db.collection(CANDIDATES_COLLECTION).doc(id);
      batch.set(ref, mapped, { merge: exists && merge });
      written++;
    }

    await batch.commit();
  }

  console.log(`✓ Migrasi selesai — ${written} dokumen ditulis ke '${CANDIDATES_COLLECTION}'.`);
  console.log('\nCatatan:');
  console.log('  - Data di collection employees TIDAK dihapus otomatis.');
  console.log('  - Setelah verifikasi, Anda bisa hapus employees manual di Firebase Console.');
  console.log('  - Frontend sekarang membaca dari collection candidates.');
}

main().catch((err) => {
  console.error('Fatal:', err instanceof Error ? err.message : err);
  process.exit(1);
});