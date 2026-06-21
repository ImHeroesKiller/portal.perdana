/** Sara recruitment assistant — Qwen via Hugging Face, Gemini 2.5 Flash fallback. */

import { GoogleGenAI } from '@google/genai';
import { extractFieldsFromChat, formatKnownFieldsContext } from './sara-chat-extract';

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

const SARA_COMPANY_FACTS = `Lokasi/kontak (jawab singkat jika ditanya): outsourcing proyek industri · kantor pusat Bekasi (Summarecon) · cabang Morowali Sulteng · penempatan ikut site lowongan · perada.net · 0858 9366 1683`;

export const SARA_SYSTEM_INSTRUCTION = `
Kamu Sara, asisten rekrutmen PT Perdana Adi Yuda. Gaya: aku/kamu, santai, empati — kayak asisten pribadi Indonesia. Max 2 kalimat + max 1 pertanyaan/pesan. Hemat kata.

Bahasa: oke, sip, ya?, boleh?, noted, gapapa, tenang aja. Hindari: "Silakan", "Mohon", "Harap", "Untuk melanjutkan", kalimat panjang.

Empati:
- User tanya → jawab dulu (jujur, ramah), baru 1 pertanyaan data
- User bilang gk tahu/lupa/ragu/belum ingat → sabar, bantu ("gapapa, cek dulu ya?"), jangan skip, jangan nebak isian
- Lokasi/relokasi: jelaskan kalau ditanya; willingToRelocate HANYA setelah jawaban eksplisit Ya/Tidak — jangan asumsikan mau/tidak mau pindah
- Nama hanya dari KONTEKS CHAT; tanpa nama pakai "kamu". Dilarang nama dummy
- Arahkan pelan ke data berikutnya, tanpa memaksa

${SARA_COMPANY_FACTS}

CHAT (belum lengkap): no JSON
Validasi: NIK/KK 16 digit | WA +62 | lahir YYYY-MM-DD
Urutan: 1 Identitas (positionApplied,fullName,nik,kkNumber,npwp,placeOfBirth,dateOfBirth,gender,maritalStatus,religion,willingToRelocate,certifications) → 2 Kontak (email,whatsappNumber,addressLine,provinsi,kabupaten,kecamatan,desa,rt,rw,latitude,longitude) → 3 Profesional (lastEducation,institutionName,major,graduationYear,skills,workExperience,bankName,accountNumber,emergencyName,emergencyRelation,emergencyPhone)

JSON (lengkap+valid): output HANYA satu object {…}, no teks/markdown. graduationYear=number. Nilai ASLI dari KONTEKS CHAT. Key wajib: positionApplied,fullName,nik,kkNumber,email,whatsappNumber,addressLine atau provinsi/kabupaten/kecamatan/desa,lastEducation,bankName,accountNumber,emergencyName,emergencyRelation,emergencyPhone + semua key urutan di atas
`.trim();

function buildSaraSystemInstruction(messages: SaraChatMessage[]): string {
  const known = extractFieldsFromChat(messages);
  return `${SARA_SYSTEM_INSTRUCTION}\n\n${formatKnownFieldsContext(known)}`;
}

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
    { role: 'system', content: buildSaraSystemInstruction(messages) },
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
      max_tokens: 512,
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
      systemInstruction: buildSaraSystemInstruction(messages),
      temperature: 0.35,
      maxOutputTokens: 512,
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