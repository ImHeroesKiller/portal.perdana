# Backup & Reliability Runbook — portal.perada.net

## 1. Firestore backup (otomatis)

### Setup satu kali (GCP)

1. Buat bucket GCS, contoh: `portal-perada-firestore-backups`
2. Beri service account Firebase Admin role:
   - `Cloud Datastore Import Export Admin`
   - `Storage Admin` pada bucket backup
3. Tambahkan GitHub repository secrets:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIRESTORE_BACKUP_BUCKET` (nama bucket tanpa `gs://`)
4. Opsional: GitHub variable `FIRESTORE_DATABASE_ID` jika bukan `(default)`

### Jadwal

Workflow `.github/workflows/firestore-backup.yml` berjalan **setiap hari 02:00 UTC (09:00 WIB)**.

Backup manual:

```bash
FIRESTORE_BACKUP_BUCKET=your-bucket npm run backup:firestore
```

### Restore

```bash
npm run restore:firestore -- gs://your-bucket/backups/2026-06-21T02-00-00-000Z
```

> Restore menimpa data di database target. Lakukan di maintenance window dan verifikasi prefix backup di GCS Console terlebih dahulu.

---

## 2. Error tracking (Sentry)

### Env vars (Vercel)

| Variable | Scope | Keterangan |
|----------|-------|------------|
| `SENTRY_DSN` | Server | API routes & cron |
| `VITE_SENTRY_DSN` | Client | React app (boleh expose) |

Tanpa DSN, Sentry tidak diaktifkan — aplikasi tetap berjalan normal.

### Vercel Logs

Semua `console.*` di serverless tetap tersedia di Vercel Dashboard → Logs. Sentry melengkapi dengan stack trace terstruktur dan alerting.

---

## 3. Uptime monitoring

### Internal (Vercel Cron)

- Endpoint: `GET /api/cron/uptime-check`
- Jadwal: setiap 5 menit (`vercel.json`)
- Mengecek `/api/ping` dan `/api/firebase-health`
- Gagal → alert Telegram (jika `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` diset)

### Env vars

| Variable | Wajib | Keterangan |
|----------|-------|------------|
| `CRON_SECRET` | Ya (production) | Vercel otomatis kirim `Authorization: Bearer <secret>` |
| `UPTIME_BASE_URL` | Tidak | Default: `https://portal.perada.net` |

### External (opsional)

Tambahkan monitor pihak ketiga (UptimeRobot, Better Stack) ke:

- `https://portal.perada.net/api/ping`
- `https://portal.perada.net/api/firebase-health`

---

## 4. Rollback strategy

### A. Rollback aplikasi (Vercel)

1. Buka Vercel Dashboard → Project → Deployments
2. Pilih deployment stabil sebelumnya → **Promote to Production**
3. Verifikasi: `curl https://portal.perada.net/api/ping`

Waktu rollback: **< 1 menit** (instant promote).

### B. Rollback data (Firestore)

1. Identifikasi prefix backup di GCS (`backups/YYYY-MM-DD...`)
2. Jalankan `npm run restore:firestore -- gs://bucket/prefix`
3. Pantau operasi di GCP Console → Firestore → Operations

Untuk kehilangan data < 7 hari, pertimbangkan **Point-in-Time Recovery (PITR)** di Firebase Console.

### C. CI gate

Workflow `.github/workflows/ci.yml`:

- **Build** pada setiap PR & push ke `main`
- **Smoke test** production health setelah merge ke `main`

Jika smoke gagal setelah deploy, segera promote deployment sebelumnya di Vercel.

### Checklist insiden

1. Cek Sentry untuk error spike
2. Cek Vercel Logs untuk API failures
3. Cek `/api/firebase-health` — DB vs app issue
4. Rollback app jika bug deploy; restore DB hanya jika data corrupt