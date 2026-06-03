
# PT Perdana Adi Yuda - Portal Rekrutmen & Manajemen SDM

Aplikasi berbasis web untuk manajemen rekrutmen *end-to-end*, mulai dari pelamaran kerja, seleksi administrasi, interview online (AI), hingga proses offering dan kontrak kerja.

## 📋 Fitur Utama

### Sisi Publik (Pelamar)
*   **Dwi Bahasa (ID/EN)**: Dukungan bahasa Indonesia dan Inggris.
*   **Pencarian Lowongan**: Filter lowongan kerja berdasarkan judul atau deskripsi.
*   **Formulir Lamaran Bertahap**: Wizard 4 langkah (Identitas, Kontak, Profesional, Dokumen) dengan validasi.
*   **Lokasi & Peta**: Integrasi Leaflet JS untuk titik koordinat domisili.
*   **AI Interview**: Simulasi video interview menggunakan Web Speech API & Google Gemini AI.

### Sisi Admin (HRD)
*   **Dashboard Terpadu**: Statistik pelamar, status pipeline, dan grafik konversi.
*   **Manajemen Talent**: Pipeline View (Kanban style), Scoring otomatis, dan Manajemen status.
*   **Manajemen Klien & Proyek**: CRUD data klien dan proyek.
*   **Offering & Kontrak**: Pembuatan Offering Letter digital.

---

## 🚀 Konfigurasi Produksi (Wajib)

Agar aplikasi dapat berjalan dengan aman dan fitur berfungsi penuh, Anda harus mengatur **Environment Variables**.

1.  Salin file contoh konfigurasi:
    ```bash
    cp .env.example .env
    ```

2.  Edit file `.env` dan isi kredensial berikut:
    *   `VITE_TELEGRAM_BOT_TOKEN`: Token dari BotFather (Wajib untuk notifikasi).
    *   `VITE_GEMINI_API_KEY`: API Key dari Google AI Studio (Wajib untuk fitur AI Interview).

**Catatan Keamanan:** Jangan pernah meng-upload file `.env` ke repository Git publik. File ini sudah dimasukkan ke dalam `.gitignore`.

---

## 🛠️ Cara Instalasi

### 1. Persiapan
Pastikan komputer Anda sudah terinstall **Node.js** (versi 16 ke atas).

```bash
npm install
```

### 2. Menjalankan Server Development
```bash
npm run dev
```
Akses di `http://localhost:5173`.

### 3. Build untuk Produksi
Untuk menghasilkan file statis yang siap di-upload ke hosting (cPanel, Vercel, Netlify):

```bash
npm run build
```
File hasil build akan berada di folder `dist/`.

---

## ⚠️ Arsitektur Data (Production Note)

Aplikasi ini saat ini dikonfigurasi dalam mode **Serverless / Demo**:

1.  **Database**: Menggunakan `localStorage` browser. Data akan hilang jika cache dibersihkan. Untuk penggunaan produksi skala besar, kode di `services/db.ts` harus dihubungkan ke Backend API (REST/GraphQL) dan Database (PostgreSQL/MySQL).
2.  **File Upload**: File disimpan dalam bentuk Base64 string di penyimpanan lokal browser. Untuk produksi, sambungkan ke layanan Cloud Storage (AWS S3 / Google Cloud Storage) melalui Backend API.
3.  **Telegram Bot**: Komunikasi ke API Telegram dilakukan langsung dari Client-side (`fetch`). Untuk keamanan maksimal tingkat enterprise, disarankan memindahkan logika ini ke Backend Server (Node.js/Go) untuk menyembunyikan Token sepenuhnya.

---
**PT Perdana Adi Yuda** - *Trusted Strategic Partner in Workforce Management Solutions.*
