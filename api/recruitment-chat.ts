import { guardApi } from '../lib/api-cors';
import { RATE_LIMITS } from '../lib/api-rate-limit';
import { extractPureJsonReply, trySaveCandidateFromReply } from '../lib/candidate';
import { isAdminConfigured } from '../lib/firebase-admin';
import { formatFirebaseError } from '../lib/firebase-errors';
import {
  callSaraChat,
  SaraKomodoError,
  saraKomodoErrorResponse,
  type SaraChatMessage,
} from '../lib/sara-komodo-chat';

export default async function handler(req: any, res: any) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Field 'messages' harus berupa array" });
  }

  try {
    const trimmedMessages: SaraChatMessage[] = messages.slice(-12).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? ''),
    }));

    const { reply: rawReply, model } = await callSaraChat(trimmedMessages);

    const pureJson = extractPureJsonReply(rawReply);
    const replyText = pureJson ?? rawReply;

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
      model,
    });
  } catch (error: unknown) {
    if (error instanceof SaraKomodoError) {
      const { status, body } = saraKomodoErrorResponse(error);
      console.error('Sara chat error:', error.code, error.message);
      return res.status(status).json(body);
    }

    console.error('Recruitment chat error:', error);
    return res.status(500).json({
      error: 'Maaf, terjadi gangguan pada layanan AI Sara. Silakan coba lagi nanti.',
      code: 'API_ERROR',
    });
  }
}