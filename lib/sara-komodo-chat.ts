/** Sara recruitment assistant — Qwen via Hugging Face, Gemini 2.5 Flash fallback. */

import { GoogleGenAI } from '@google/genai';
import { buildSaraChatContext } from './sara-chat-extract';
import { buildSaraSessionContext, type SaraSession } from './sara-memory';

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
Kamu adalah Sara, asisten rekrutmen ramah dan santai dari PT Perdana Adi Yuda.

Gaya bicara:
- Gunakan "aku", "kamu", "ya", "sip", "oke", "noted", "gapapa"
- Santai, suportif, tidak kaku
- Maksimal 2-3 kalimat + 1 pertanyaan saja per respons
- Hindari: "Silakan", "Mohon", "Harap", "Untuk melanjutkan"

Aturan Memory & Anti-Repeat (PENTING!):
- Selalu baca candidateData / blok SUDAH TERISI di bawah sebelum menjawab
- Jika field sudah terisi dan valid (terutama NIK, KK, NPWP 16 digit), JANGAN tanya ulang
- Jika user bilang "sudah", "iya sudah", "tadi", "kan sudah" → langsung anggap sudah terisi dan lanjut ke field berikutnya
- Jangan ulangi validasi "harus 16 digit" berkali-kali
- Jika user mengoreksi, update memory dan konfirmasi singkat ("oke sip, noted")
- User tanya → jawab dulu, baru 1 pertanyaan data
- User gk tahu/lupa/ragu → sabar, jangan skip, jangan nebak
- Relokasi: willingToRelocate HANYA setelah Ya/Tidak eksplisit
- Nama dari memory saja; tanpa nama pakai "kamu". Dilarang nama dummy

Urutan pengisian yang ideal:
1. Nama lengkap
2. Posisi (jika sudah diketahui, skip)
3. NIK (16 digit)
4. Nomor KK (16 digit)
5. NPWP (16 digit)
6. Tempat & Tanggal Lahir
7. Gender, Agama, Status pernikahan, Relokasi
8. Email, WhatsApp, Alamat (prov/kab/kec/desa, RT/RW)
9. Pendidikan, Jurusan, Tahun lulus, Skills, Pengalaman
10. Bank & rekening, Kontak darurat

Jika user sudah jawab sebuah field, catat di memory dan jangan tanya lagi kecuali dia minta koreksi.
Ikuti LANJUTKAN di bawah — tanya HANYA 1 field berikutnya yang belum terisi.

${SARA_COMPANY_FACTS}

CHAT (belum lengkap): no JSON
Validasi: NIK/KK/NPWP tepat 16 digit angka · WA +62 · lahir YYYY-MM-DD
JSON (lengkap+valid): output HANYA satu object {…}, no teks/markdown. graduationYear=number. Nilai ASLI dari memory/candidateData. Key wajib: positionApplied,fullName,nik,kkNumber,email,whatsappNumber,addressLine atau provinsi/kabupaten/kecamatan/desa,lastEducation,bankName,accountNumber,emergencyName,emergencyRelation,emergencyPhone + field urutan di atas
`.trim();

function buildSaraSystemInstruction(
  messages: SaraChatMessage[],
  contextOverride?: string
): string {
  const context = contextOverride ?? buildSaraChatContext(messages);
  return `${SARA_SYSTEM_INSTRUCTION}\n\n${context}`;
}

/** Map persisted session messages to Sara chat turns. */
export function sessionToChatMessages(session: Pick<SaraSession, 'messages'>): SaraChatMessage[] {
  return session.messages.map(({ role, content }) => ({
    role: role === 'assistant' ? 'assistant' : 'user',
    content,
  }));
}

/** Call Sara using Firestore-backed session history + memory context. */
export async function callSaraChatForSession(session: SaraSession): Promise<SaraChatResult> {
  const messages = sessionToChatMessages(session).slice(-12);
  const sessionContext = buildSaraSessionContext(session);
  return callSaraChat(messages, sessionContext);
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
  messages: SaraChatMessage[],
  contextOverride?: string
): Promise<string> {
  const hfMessages = [
    { role: 'system', content: buildSaraSystemInstruction(messages, contextOverride) },
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

async function callQwenSaraChat(
  messages: SaraChatMessage[],
  contextOverride?: string
): Promise<string> {
  const token = getIhkToken();
  return postHfChat(token, messages, contextOverride);
}

async function callGeminiSaraChat(
  messages: SaraChatMessage[],
  contextOverride?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  const response = await ai.models.generateContent({
    model: SARA_GEMINI_MODEL,
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: buildSaraSystemInstruction(messages, contextOverride),
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
export async function callSaraChat(
  messages: SaraChatMessage[],
  contextOverride?: string
): Promise<SaraChatResult> {
  try {
    const reply = await callQwenSaraChat(messages, contextOverride);
    return { reply, model: SARA_HF_MODEL };
  } catch (qwenError) {
    console.warn('Sara Qwen HF failed, falling back to Gemini:', qwenError);

    try {
      const reply = await callGeminiSaraChat(messages, contextOverride);
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