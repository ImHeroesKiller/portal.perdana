/**
 * PT Perdana — Firestore Structure Initializer (one-time / idempotent)
 *
 * Rules:
 * - Never deletes or updates existing documents
 * - Only seeds a collection when it is completely empty (0 documents)
 * - Safe to run multiple times
 *
 * Usage:
 *   1. Copy .env.example → .env and fill Firebase Admin credentials:
 *        FIREBASE_PROJECT_ID
 *        FIREBASE_CLIENT_EMAIL
 *        FIREBASE_PRIVATE_KEY
 *        FIRESTORE_DATABASE_ID   (optional, for named database)
 *
 *   2. Run:
 *        npm run init-firestore
 *      or:
 *        npx tsx scripts/init-firestore.ts
 *
 *   3. Dry-run (no writes):
 *        npm run init-firestore -- --dry-run
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '../lib/firebase-admin';

// ─── Env loader (.env is optional) ───────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ts = () => Timestamp.now();
const dryRun = process.argv.includes('--dry-run');

function log(icon: string, message: string): void {
  console.log(`${icon}  ${message}`);
}

async function isCollectionEmpty(db: Firestore, name: string): Promise<boolean> {
  const snap = await db.collection(name).limit(1).get();
  return snap.empty;
}

async function seedIfEmpty(
  db: Firestore,
  collection: string,
  documents: Array<{ id: string; data: Record<string, unknown> }>
): Promise<'seeded' | 'skipped' | 'dry-run'> {
  const empty = await isCollectionEmpty(db, collection);

  if (!empty) {
    log('⏭️ ', `Collection "${collection}" sudah berisi data — dilewati (tidak diubah).`);
    return 'skipped';
  }

  if (dryRun) {
    log('🔍', `[DRY-RUN] Collection "${collection}" kosong — akan diisi ${documents.length} dokumen contoh.`);
    return 'dry-run';
  }

  const batch = db.batch();
  for (const doc of documents) {
    batch.set(db.collection(collection).doc(doc.id), doc.data);
  }
  await batch.commit();

  log('✅', `Collection "${collection}" diinisialisasi (${documents.length} dokumen contoh).`);
  return 'seeded';
}

// ─── Sample documents ────────────────────────────────────────────────────────

const SEED_IDS = {
  userAdmin: 'seed-user-admin',
  candidate: 'seed-candidate-001',
  job: 'seed-job-001',
  application: 'seed-application-001',
  project: 'seed-project-001',
  client: 'seed-client-001',
  task: 'seed-task-001',
  employee: 'seed-employee-001',
  settings: 'company',
} as const;

function buildSeedData() {
  const now = ts();

  return {
    users: [
      {
        id: SEED_IDS.userAdmin,
        data: {
          uid: 'seed-uid-admin-001',
          email: 'admin@perada.net',
          fullName: 'Administrator PT Perdana',
          role: 'admin',
          isActive: true,
          createdAt: now,
        },
      },
      {
        id: 'seed-user-hr-001',
        data: {
          uid: 'seed-uid-hr-001',
          email: 'hr@perada.net',
          fullName: 'Staff HRD PT Perdana',
          role: 'hr',
          isActive: true,
          createdAt: now,
        },
      },
    ],

    candidates: [
      {
        id: SEED_IDS.candidate,
        data: {
          fullName: 'Budi Santoso',
          nik: '7201011503950001',
          kkNumber: '7201011503950002',
          npwp: '12.345.678.9-012.000',
          placeOfBirth: 'Palu',
          dateOfBirth: '1995-03-15',
          gender: 'Laki-laki',
          maritalStatus: 'Belum Menikah',
          religion: 'Islam',
          willingToRelocate: true,
          email: 'budi.santoso@example.com',
          whatsappNumber: '+6281234567890',
          addressLine: 'Jl. Merdeka No. 10',
          provinsi: 'Sulawesi Tengah',
          kabupaten: 'Kota Palu',
          kecamatan: 'Palu Barat',
          desa: 'Besusu Barat',
          rt: '001',
          rw: '002',
          latitude: -0.9489,
          longitude: 119.8707,
          lastEducation: 'SMA/SMK',
          institutionName: 'SMK Negeri 1 Palu',
          major: 'Teknik Mesin',
          graduationYear: 2013,
          skills: 'Las, forklift, K3',
          workExperience: '2 tahun operator produksi',
          bankName: 'BCA',
          accountNumber: '1234567890',
          emergencyName: 'Siti Aminah',
          emergencyRelation: 'Istri',
          emergencyPhone: '+6289876543210',
          status: 'new',
          source: 'ai-sara',
          createdAt: now,
        },
      },
    ],

    jobs: [
      {
        id: SEED_IDS.job,
        data: {
          title: 'Operator Produksi',
          department: 'Operasional',
          location: 'Morowali, Sulawesi Tengah',
          description:
            'Mengoperasikan mesin produksi, memastikan standar K3, dan melaporkan kondisi peralatan.',
          requirements: ['Minimal SMA/SMK', 'Pengalaman 1 tahun', 'Memiliki sertifikat K3'],
          isActive: true,
          createdAt: now,
        },
      },
    ],

    applications: [
      {
        id: SEED_IDS.application,
        data: {
          candidateId: SEED_IDS.candidate,
          jobId: SEED_IDS.job,
          status: 'new',
          appliedAt: now,
          notes: 'Lamaran contoh dari inisialisasi Firestore.',
        },
      },
    ],

    clients: [
      {
        id: SEED_IDS.client,
        data: {
          name: 'PT IMIP Nickel Group',
          industry: 'Pertambangan & Smelter',
          address: 'Morowali, Sulawesi Tengah',
          contactPerson: 'Bapak Hendra Wijaya',
          npwpNumber: '01.234.567.8-901.000',
          partnershipStartDate: '2024-01-01',
          isActive: true,
          createdAt: now,
        },
      },
    ],

    projects: [
      {
        id: SEED_IDS.project,
        data: {
          name: 'Smelter Construction Morowali',
          clientId: SEED_IDS.client,
          status: 'active',
          startDate: '2024-06-01',
          endDate: '2027-12-31',
          description: 'Proyek konstruksi dan operasional smelter nikel.',
          isActive: true,
          createdAt: now,
        },
      },
    ],

    tasks: [
      {
        id: SEED_IDS.task,
        data: {
          projectId: SEED_IDS.project,
          title: 'Orientasi K3 Lapangan',
          assignedTo: SEED_IDS.userAdmin,
          status: 'open',
          dueDate: '2026-07-01',
          description: 'Briefing keselamatan kerja untuk personil baru di site Morowali.',
          createdAt: now,
        },
      },
    ],

    employees: [
      {
        id: SEED_IDS.employee,
        data: {
          fullName: 'Andi Pratama',
          nik: '7201010101900003',
          kkNumber: '7201010101900004',
          positionApplied: 'Supervisor Lapangan',
          position: 'Supervisor Lapangan',
          department: 'Operasional',
          email: 'andi.pratama@perada.net',
          whatsapp: '+628111222333',
          whatsappNumber: '+628111222333',
          domicileAddress: 'Jl. Trans Sulawesi, Palu, Sulawesi Tengah',
          placeOfBirth: 'Palu',
          dateOfBirth: '1990-01-01',
          gender: 'Laki-laki',
          religion: 'Islam',
          maritalStatus: 'Menikah',
          lastEducation: 'S1',
          institutionName: 'Universitas Tadulako',
          major: 'Teknik Industri',
          graduationYear: 2012,
          skills: 'Manajemen proyek, K3, koordinasi lapangan',
          workExperience: '5 tahun pengalaman proyek konstruksi',
          bankName: 'Bank Sulteng',
          accountNumber: '9876543210',
          emergencyName: 'Rina Pratama',
          emergencyRelation: 'Istri',
          emergencyPhone: '+628222333444',
          employeeType: 'PROJECT',
          clientId: SEED_IDS.client,
          projectId: SEED_IDS.project,
          status: 'HIRED',
          employmentStatus: 'ACTIVE',
          applicationLetterPath: '',
          cvPath: '',
          ktpPath: '',
          diplomaPath: '',
          photoPath: '',
          kkPath: '',
          certificatePath: '',
          telegramId: '',
          createdAt: now,
        },
      },
    ],

    settings: [
      {
        id: SEED_IDS.settings,
        data: {
          companyName: 'PT Perdana Adi Yuda',
          legalName: 'PT Perdana Adi Yuda',
          address: 'Palu, Sulawesi Tengah, Indonesia',
          contactEmail: 'info@perada.net',
          contactPhone: '+6281234567890',
          website: 'https://portal.perada.net',
          timezone: 'Asia/Makassar',
          locale: 'id-ID',
          recruitmentEmail: 'hr@perada.net',
          telegramBotEnabled: false,
          updatedAt: now,
          createdAt: now,
        },
      },
    ],
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const COLLECTION_ORDER = [
  'users',
  'candidates',
  'jobs',
  'clients',
  'projects',
  'applications',
  'tasks',
  'employees',
  'settings',
] as const;

async function main(): Promise<void> {
  loadEnvFile();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PT Perdana — Firestore Initializer');
  console.log('═══════════════════════════════════════════════════════════');
  if (dryRun) log('🔍', 'Mode DRY-RUN aktif — tidak ada data yang ditulis.');
  console.log('');

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseId = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID (atau VITE_FIREBASE_PROJECT_ID) wajib diisi.');
  }
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('FIREBASE_CLIENT_EMAIL dan FIREBASE_PRIVATE_KEY wajib diisi untuk Admin SDK.');
  }

  log('🔧', `Project ID : ${projectId}`);
  log('🔧', `Database ID: ${databaseId || '(default)'}`);
  console.log('');

  const db = getAdminDb();
  const seeds = buildSeedData();

  const summary: Record<string, 'seeded' | 'skipped' | 'dry-run'> = {};

  for (const name of COLLECTION_ORDER) {
    const docs = seeds[name as keyof typeof seeds];
    summary[name] = await seedIfEmpty(db, name, docs);
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Ringkasan');
  console.log('───────────────────────────────────────────────────────────');

  let seeded = 0;
  let skipped = 0;
  for (const [col, result] of Object.entries(summary)) {
    const label =
      result === 'seeded' ? 'DIISI' : result === 'skipped' ? 'DILEWATI' : 'DRY-RUN';
    console.log(`  ${col.padEnd(14)} → ${label}`);
    if (result === 'seeded') seeded++;
    if (result === 'skipped') skipped++;
  }

  console.log('');
  log('📊', `Selesai. ${seeded} collection diisi, ${skipped} dilewati.`);
  if (!dryRun && seeded > 0) {
    log('💡', 'Buka Firebase Console → Firestore untuk verifikasi data contoh.');
  }
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('');
    console.error('❌  Gagal menjalankan init-firestore:');
    if (err instanceof Error) {
      console.error(err.message);
      if (err.stack) console.error(err.stack);
    } else {
      console.error(err);
    }
    console.error('');
    process.exit(1);
  });