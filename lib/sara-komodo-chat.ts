/** Sara recruitment assistant — Komodo-7B via Hugging Face Inference API. */

export const KOMODO_HF_MODEL = 'komodo-ai/Komodo-7B-Instruct';

const HF_ROUTER_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_SERVERLESS_CHAT_URL = `https://api-inference.huggingface.co/models/${KOMODO_HF_MODEL}/v1/chat/completions`;

export type SaraChatMessage = { role: 'user' | 'assistant'; content: string };

export class SaraKomodoError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: 'TOKEN_MISSING' | 'AUTH_FAILED' | 'QUOTA_EXCEEDED' | 'MODEL_LOADING' | 'API_ERROR' | 'EMPTY_REPLY'
  ) {
    super(message);
    this.name = 'SaraKomodoError';
  }
}

export const SARA_SYSTEM_INSTRUCTION = `
Anda adalah Sara, AI Virtual Assistant rekrutmen PT Perdana Adi Yuda. Anda memandu pelamar mengisi formulir melalui percakapan bertahap.

Gaya bicara: ramah, semi-formal, natural dalam Bahasa Indonesia — seperti HR yang membantu, bukan robot kaku.

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
`.trim();

function getIhkToken(): string {
  const token = process.env.IHK_TOKEN?.trim();
  if (!token) {
    throw new SaraKomodoError(
      'IHK_TOKEN belum dikonfigurasi di Vercel Environment Variables.',
      503,
      'TOKEN_MISSING'
    );
  }
  return token;
}

function mapHfError(status: number, body: unknown): SaraKomodoError {
  const detail =
    typeof body === 'object' && body !== null
      ? JSON.stringify(body)
      : String(body ?? '');

  if (status === 401 || status === 403) {
    return new SaraKomodoError(
      'Token Hugging Face tidak valid atau tidak memiliki akses ke model Komodo.',
      401,
      'AUTH_FAILED'
    );
  }

  if (status === 402 || status === 429) {
    return new SaraKomodoError(
      'Maaf, kuota Hugging Face Inference sedang habis. Silakan coba lagi dalam beberapa saat.',
      429,
      'QUOTA_EXCEEDED'
    );
  }

  if (status === 503) {
    const estimated =
      typeof body === 'object' &&
      body !== null &&
      'estimated_time' in body &&
      typeof (body as { estimated_time?: unknown }).estimated_time === 'number'
        ? Math.ceil((body as { estimated_time: number }).estimated_time)
        : 20;

    const err = new SaraKomodoError(
      `Model Komodo sedang dimuat di Hugging Face. Coba lagi sekitar ${estimated} detik.`,
      503,
      'MODEL_LOADING'
    );
    (err as SaraKomodoError & { retryAfter?: number }).retryAfter = estimated;
    return err;
  }

  return new SaraKomodoError(
    `Gangguan Hugging Face Inference (${status}). ${detail.slice(0, 200)}`,
    502,
    'API_ERROR'
  );
}

function extractReplyText(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const record = data as Record<string, unknown>;

  const chatContent = (record.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]
    ?.message?.content;
  if (typeof chatContent === 'string') return chatContent.trim();

  if (Array.isArray(record)) {
    const first = record[0] as { generated_text?: string } | undefined;
    if (typeof first?.generated_text === 'string') return first.generated_text.trim();
  }

  if (typeof record.generated_text === 'string') return record.generated_text.trim();

  return '';
}

async function postKomodoChat(
  url: string,
  token: string,
  messages: SaraChatMessage[]
): Promise<string> {
  const hfMessages = [
    { role: 'system', content: SARA_SYSTEM_INSTRUCTION },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: KOMODO_HF_MODEL,
      messages: hfMessages,
      temperature: 0.35,
      max_tokens: 2000,
    }),
  });

  const raw = await response.text();
  let data: unknown = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { error: raw };
  }

  if (!response.ok) {
    throw mapHfError(response.status, data);
  }

  const reply = extractReplyText(data);
  if (!reply) {
    throw new SaraKomodoError(
      'Model Komodo mengembalikan respons kosong. Silakan coba lagi.',
      502,
      'EMPTY_REPLY'
    );
  }

  return reply;
}

/** Call Komodo-7B-Instruct on Hugging Face (router → serverless fallback). */
export async function callKomodoSaraChat(messages: SaraChatMessage[]): Promise<string> {
  const token = getIhkToken();

  try {
    return await postKomodoChat(HF_ROUTER_CHAT_URL, token, messages);
  } catch (routerError) {
    if (
      routerError instanceof SaraKomodoError &&
      routerError.code !== 'API_ERROR' &&
      routerError.code !== 'EMPTY_REPLY'
    ) {
      throw routerError;
    }

    console.warn('HF router chat failed, trying serverless endpoint:', routerError);
    return postKomodoChat(HF_SERVERLESS_CHAT_URL, token, messages);
  }
}

export function saraKomodoErrorResponse(err: SaraKomodoError): {
  status: number;
  body: Record<string, unknown>;
} {
  const body: Record<string, unknown> = { error: err.message, code: err.code };
  const retryAfter = (err as SaraKomodoError & { retryAfter?: number }).retryAfter;
  if (retryAfter) body.retryAfter = retryAfter;
  return { status: err.status, body };
}