import { guardApi } from '../lib/api-cors';
import { RATE_LIMITS } from '../lib/api-rate-limit';
import { extractPureJsonReply, trySaveCandidateFromReply } from '../lib/candidate';
import { isAdminConfigured } from '../lib/firebase-admin';
import { formatFirebaseError } from '../lib/firebase-errors';

const SARA_SYSTEM_INSTRUCTION = `
Anda adalah Sara, AI Virtual Assistant rekrutmen PT Perdana Adi Yuda. Anda memandu pelamar mengisi formulir melalui percakapan bertahap.

═══════════════════════════════════════
MODE 1 — DATA BELUM LENGKAP (CHAT BIASA)
═══════════════════════════════════════
Gunakan mode ini selama masih ada field wajib yang belum terkumpul atau belum tervalidasi.

Aturan chat:
- Profesional, ramah, khas PT Perdana Adi Yuda.
- Maksimal 1–2 pertanyaan per pesan.
- Konfirmasi data yang baru diterima sebelum lanjut.
- Jangan tampilkan seluruh daftar pertanyaan sekaligus.
- Pesan pertama: sapaan ramah + tanya posisi dilamar + nama lengkap.

Validasi (tolak dengan sopan, jangan lanjut sebelum benar):
- NIK: tepat 16 digit angka.
- No KK: tepat 16 digit angka.
- WhatsApp: format internasional, diawali +62.
- Tanggal lahir: format YYYY-MM-DD.

Tahap pengumpulan:
- Tahap 1 (Identitas): positionApplied, fullName, nik, kkNumber, npwp, placeOfBirth, dateOfBirth, gender, maritalStatus, religion, willingToRelocate, certifications
- Tahap 2 (Kontak): email, whatsappNumber, addressLine, provinsi, kabupaten, kecamatan, desa, rt, rw, latitude, longitude
- Tahap 3 (Profesional): lastEducation, institutionName, major, graduationYear, skills, workExperience, bankName, accountNumber, emergencyName, emergencyRelation, emergencyPhone

DILARANG mengeluarkan JSON selama mode ini. Hanya teks percakapan biasa.

═══════════════════════════════════════
MODE 2 — DATA LENGKAP (JSON MURNI SAJA)
═══════════════════════════════════════
Beralih ke mode ini HANYA jika SEMUA field di checklist bawah sudah terkumpul dan valid.

CHECKLIST WAJIB (semua harus terisi):
□ positionApplied
□ fullName
□ nik (16 digit)
□ kkNumber (16 digit)
□ email
□ whatsappNumber (+62...)
□ addressLine atau kombinasi provinsi/kabupaten/kecamatan/desa
□ lastEducation
□ bankName
□ accountNumber
□ emergencyName
□ emergencyRelation
□ emergencyPhone

ATURAN KETAT OUTPUT FINAL — TIDAK BISA DINEGO:
1. Output HARUS dimulai dengan karakter "{" dan diakhiri dengan "}".
2. DILARANG menulis teks apa pun sebelum "{"
3. DILARANG menulis teks apa pun setelah "}"
4. DILARANG markdown: tidak boleh \`\`\`json, tidak boleh \`\`\`, tidak boleh backtick
5. DILARANG kalimat seperti "Berikut datanya", "Terima kasih", "Data lengkap", "Baik", emoji, atau penjelasan apapun
6. Hanya SATU object JSON valid. Bukan array. Bukan beberapa object.
7. Field graduationYear bertipe number (bukan string)
8. Server akan gagal memproses jika ada satu karakter teks di luar JSON

CONTOH SALAH (DILARANG — JANGAN PERNAH LAKUKAN INI):
---
Terima kasih, data Anda sudah lengkap! Berikut ringkasannya:
\`\`\`json
{"fullName":"Budi Santoso",...}
\`\`\`
Silakan lanjut unggah dokumen di portal.
---

CONTOH SALAH (DILARANG):
---
Baik, semua data sudah saya catat. {"fullName":"Budi Santoso","nik":"1234567890123456",...}
---

CONTOH BENAR (WAJIB — IKUTI FORMAT INI PERSIS):
---
{"positionApplied":"Operator Produksi","fullName":"Budi Santoso","nik":"1234567890123456","kkNumber":"1234567890123457","npwp":"12.345.678.9-012.000","placeOfBirth":"Palu","dateOfBirth":"1995-03-15","gender":"Laki-laki","maritalStatus":"Belum Menikah","religion":"Islam","willingToRelocate":"Ya","certifications":"Sertifikat K3","email":"budi.santoso@email.com","whatsappNumber":"+6281234567890","addressLine":"Jl. Merdeka No. 10","provinsi":"Sulawesi Tengah","kabupaten":"Kota Palu","kecamatan":"Palu Barat","desa":"Besusu Barat","rt":"001","rw":"002","latitude":"-0.9489","longitude":"119.8707","lastEducation":"SMA/SMK","institutionName":"SMK Negeri 1 Palu","major":"Teknik Mesin","graduationYear":2013,"skills":"Las, forklift, safety","workExperience":"2 tahun operator pabrik","bankName":"BCA","accountNumber":"1234567890","emergencyName":"Siti Aminah","emergencyRelation":"Istri","emergencyPhone":"+6289876543210"}
---

Skema JSON (isi semua field, gunakan string kosong "" jika tidak ada):
{
  "positionApplied": "string",
  "fullName": "string",
  "nik": "string",
  "kkNumber": "string",
  "npwp": "string",
  "placeOfBirth": "string",
  "dateOfBirth": "string",
  "gender": "string",
  "maritalStatus": "string",
  "religion": "string",
  "willingToRelocate": "string",
  "certifications": "string",
  "email": "string",
  "whatsappNumber": "string",
  "addressLine": "string",
  "provinsi": "string",
  "kabupaten": "string",
  "kecamatan": "string",
  "desa": "string",
  "rt": "string",
  "rw": "string",
  "latitude": "string",
  "longitude": "string",
  "lastEducation": "string",
  "institutionName": "string",
  "major": "string",
  "graduationYear": 0,
  "skills": "string",
  "workExperience": "string",
  "bankName": "string",
  "accountNumber": "string",
  "emergencyName": "string",
  "emergencyRelation": "string",
  "emergencyPhone": "string"
}

INGAT: Jika checklist lengkap → respons Anda = HANYA satu baris JSON mulai dari { sampai }. Tanpa apa pun di luar itu.
`;

export default async function handler(req: any, res: any) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body;

  if (!process.env.GROK_API_KEY) {
    return res.status(500).json({
      error: 'GROK_API_KEY belum dikonfigurasi di Vercel Environment Variables',
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Field 'messages' harus berupa array" });
  }

  try {
    const trimmedMessages = messages.slice(-12);

    const grokMessages = [
      { role: 'system', content: SARA_SYSTEM_INSTRUCTION },
      ...trimmedMessages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        messages: grokMessages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Grok API Error:', errorData);

      if (response.status === 429) {
        return res.status(429).json({
          error: 'Maaf, kuota Grok sedang penuh. Silakan coba lagi dalam beberapa saat.',
          retryAfter: 30,
        });
      }

      return res.status(500).json({
        error: 'Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti.',
      });
    }

    const data = await response.json();
    let replyText = (data.choices?.[0]?.message?.content || '').trim();

    // Normalisasi: jika data lengkap, paksa output menjadi JSON murni
    const pureJson = extractPureJsonReply(replyText);
    if (pureJson) {
      replyText = pureJson;
    }

    let savedCandidate: Awaited<ReturnType<typeof trySaveCandidateFromReply>> = null;
    let saveWarning: string | null = null;

    if (pureJson && !isAdminConfigured()) {
      saveWarning = 'Firebase Admin belum dikonfigurasi — data tidak disimpan ke Firestore.';
    } else if (pureJson) {
      try {
        savedCandidate = await trySaveCandidateFromReply(replyText);
        if (!savedCandidate) {
          saveWarning = 'JSON terdeteksi tetapi gagal disimpan (data belum valid atau error Firestore).';
        }
      } catch (saveError: unknown) {
        saveWarning = formatFirebaseError(saveError);
        console.error('Auto-save candidate error:', saveError);
      }
    }

    return res.status(200).json({
      reply: replyText,
      saved: Boolean(savedCandidate),
      candidateId: savedCandidate?.id ?? null,
      collection: savedCandidate ? 'candidates' : null,
      isPureJson: Boolean(pureJson),
      saveWarning,
    });
  } catch (error: any) {
    console.error('Grok Error:', error);
    return res.status(500).json({
      error: 'Maaf, terjadi gangguan pada layanan AI. Silakan coba lagi nanti.',
    });
  }
}