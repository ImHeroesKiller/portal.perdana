/** Sara recruitment assistant — Qwen via Hugging Face, Gemini 2.5 Flash fallback. */

import { GoogleGenAI } from '@google/genai';

export const SARA_HF_MODEL = 'Qwen/Qwen2.5-7B-Instruct';
export const SARA_GEMINI_MODEL = 'gemini-2.5-flash';

const HF_ROUTER_CHAT_URL = 'https://router.huggingface.co/v1/chat/completions';

export type SaraChatMessage = { role: 'user' | 'assistant'; content: string };

export type SaraChatResult = { reply: string; model: string };

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

/** Prompt formal lama: {@link ./sara-system-prompt-legacy.ts} */

export const SARA_SYSTEM_INSTRUCTION = `
Kamu Sara, asisten rekrutmen PT Perdana Adi Yuda. Aku bantu kamu isi formulir lamaran lewat obrolan.

Gaya: pakai "aku/kamu", santai tapi sopan — kayak asisten pribadi, bukan robot kaku. Tetap semi-formal karena ini rekrutmen. Singkat, hangat, hemat kata.

MODE CHAT — pakai selama data wajib belum lengkap/valid:
- Maks 1–2 pertanyaan per pesan; konfirmasi data baru sebelum lanjut
- Jangan borong semua pertanyaan sekaligus
- Pesan pertama: sapaan + posisi yang dilamar + nama lengkap
- Kalau kamu ngobrol di luar topik, aku ikut sebentar lalu arahkan pelan ke data yang dibutuhkan — tanpa memaksa
- Jangan output JSON di mode ini

Validasi (tolak sopan, ulangi sampai benar):
- NIK & No KK: 16 digit angka | WhatsApp: +62... | Tanggal lahir: YYYY-MM-DD

Urutan kumpul:
1. Identitas: positionApplied, fullName, nik, kkNumber, npwp, placeOfBirth, dateOfBirth, gender, maritalStatus, religion, willingToRelocate, certifications
2. Kontak: email, whatsappNumber, addressLine, provinsi, kabupaten, kecamatan, desa, rt, rw, latitude, longitude
3. Profesional: lastEducation, institutionName, major, graduationYear, skills, workExperience, bankName, accountNumber, emergencyName, emergencyRelation, emergencyPhone

MODE JSON — hanya jika semua wajib terisi & valid:
Wajib: positionApplied, fullName, nik, kkNumber, email, whatsappNumber, addressLine atau provinsi/kabupaten/kecamatan/desa, lastEducation, bankName, accountNumber, emergencyName, emergencyRelation, emergencyPhone

Output HANYA satu object JSON — mulai { akhiri }, tanpa teks/markdown/emoji sebelum atau sesudahnya. graduationYear = number. Field kosong = "". Isi semua key:

positionApplied, fullName, nik, kkNumber, npwp, placeOfBirth, dateOfBirth, gender, maritalStatus, religion, willingToRelocate, certifications, email, whatsappNumber, addressLine, provinsi, kabupaten, kecamatan, desa, rt, rw, latitude, longitude, lastEducation, institutionName, major, graduationYear, skills, workExperience, bankName, accountNumber, emergencyName, emergencyRelation, emergencyPhone

Contoh: {"positionApplied":"Operator Produksi","fullName":"Budi Santoso","nik":"1234567890123456","kkNumber":"1234567890123457","npwp":"12.345.678.9-012.000","placeOfBirth":"Palu","dateOfBirth":"1995-03-15","gender":"Laki-laki","maritalStatus":"Belum Menikah","religion":"Islam","willingToRelocate":"Ya","certifications":"Sertifikat K3","email":"budi.santoso@email.com","whatsappNumber":"+6281234567890","addressLine":"Jl. Merdeka No. 10","provinsi":"Sulawesi Tengah","kabupaten":"Kota Palu","kecamatan":"Palu Barat","desa":"Besusu Barat","rt":"001","rw":"002","latitude":"-0.9489","longitude":"119.8707","lastEducation":"SMA/SMK","institutionName":"SMK Negeri 1 Palu","major":"Teknik Mesin","graduationYear":2013,"skills":"Las, forklift, safety","workExperience":"2 tahun operator pabrik","bankName":"BCA","accountNumber":"1234567890","emergencyName":"Siti Aminah","emergencyRelation":"Istri","emergencyPhone":"+6289876543210"}
`.trim();

function getIhkToken(): string {
  let token = process.env.IHK_TOKEN?.trim() ?? '';
  if (
    (token.startsWith('"') && token.endsWith('"')) ||
    (token.startsWith("'") && token.endsWith("'"))
  ) {
    token = token.slice(1, -1).trim();
  }
  if (!token) {
    throw new SaraKomodoError(
      'IHK_TOKEN belum dikonfigurasi di Vercel Environment Variables.',
      503,
      'TOKEN_MISSING'
    );
  }
  if (/^https?:\/\//i.test(token) || !token.startsWith('hf_')) {
    throw new SaraKomodoError(
      'IHK_TOKEN tidak valid — gunakan token Hugging Face (format hf_...), bukan URL halaman settings.',
      503,
      'TOKEN_MISSING'
    );
  }
  return token;
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
  if (!apiKey) {
    throw new SaraKomodoError(
      'GEMINI_API_KEY belum dikonfigurasi di server.',
      503,
      'TOKEN_MISSING'
    );
  }
  return apiKey;
}

function mapHfError(status: number, body: unknown): SaraKomodoError {
  const detail =
    typeof body === 'object' && body !== null
      ? JSON.stringify(body)
      : String(body ?? '');

  if (status === 401 || status === 403) {
    return new SaraKomodoError(
      'Token Hugging Face tidak valid atau tidak memiliki akses ke model Qwen.',
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
      `Model Qwen sedang dimuat di Hugging Face. Coba lagi sekitar ${estimated} detik.`,
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

async function postHfChat(
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

  const response = await fetch(HF_ROUTER_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: SARA_HF_MODEL,
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
      'Model Qwen mengembalikan respons kosong. Silakan coba lagi.',
      502,
      'EMPTY_REPLY'
    );
  }

  return reply;
}

async function callQwenSaraChat(messages: SaraChatMessage[]): Promise<string> {
  const token = getIhkToken();
  return postHfChat(token, messages);
}

async function callGeminiSaraChat(messages: SaraChatMessage[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  const response = await ai.models.generateContent({
    model: SARA_GEMINI_MODEL,
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: SARA_SYSTEM_INSTRUCTION,
      temperature: 0.35,
      maxOutputTokens: 2000,
    },
  });

  const reply = response.text?.trim();
  if (!reply) {
    throw new SaraKomodoError(
      'Gemini mengembalikan respons kosong. Silakan coba lagi.',
      502,
      'EMPTY_REPLY'
    );
  }

  return reply;
}

/** Primary: Qwen on HF. Fallback: Gemini 2.5 Flash. */
export async function callSaraChat(messages: SaraChatMessage[]): Promise<SaraChatResult> {
  try {
    const reply = await callQwenSaraChat(messages);
    return { reply, model: SARA_HF_MODEL };
  } catch (qwenError) {
    console.warn('Sara Qwen HF failed, falling back to Gemini:', qwenError);

    try {
      const reply = await callGeminiSaraChat(messages);
      return { reply, model: SARA_GEMINI_MODEL };
    } catch (geminiError) {
      if (geminiError instanceof SaraKomodoError) throw geminiError;
      const message =
        geminiError instanceof Error ? geminiError.message : 'Gagal memanggil Gemini.';
      throw new SaraKomodoError(
        `Maaf, layanan AI Sara tidak tersedia. ${message}`,
        500,
        'API_ERROR'
      );
    }
  }
}

export async function callKomodoSaraChat(messages: SaraChatMessage[]): Promise<string> {
  const { reply } = await callSaraChat(messages);
  return reply;
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