import { guardApi } from '../lib/api-cors';
import { RATE_LIMITS } from '../lib/api-rate-limit';
import { extractPureJsonReply, trySaveCandidateFromReply } from '../lib/candidate';
import { isAdminConfigured } from '../lib/firebase-admin';
import { formatFirebaseError } from '../lib/firebase-errors';
import {
  callSaraChatForSession,
  SaraKomodoError,
  saraKomodoErrorResponse,
} from '../lib/sara-komodo-chat';
import {
  addMessage,
  isSaraMemoryEnabled,
  prepareSaraSessionForTurn,
} from '../lib/sara-memory';

export default async function handler(req: any, res: any) {
  if (!guardApi(req, res, { rateLimit: RATE_LIMITS.chat, requireOrigin: true })) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId, userId, message, messages } = req.body ?? {};

  const hasMessage = typeof message === 'string' && message.trim().length > 0;
  const hasMessages = Array.isArray(messages) && messages.length > 0;

  if (!hasMessage && !hasMessages) {
    return res.status(400).json({
      error: "Field 'message' atau 'messages' wajib diisi",
    });
  }

  try {
    let session = await prepareSaraSessionForTurn({
      sessionId: typeof sessionId === 'string' ? sessionId : undefined,
      userId: typeof userId === 'string' ? userId : undefined,
      messages: hasMessages ? messages : undefined,
      message: hasMessage ? message : undefined,
    });

    const { reply: rawReply, model } = await callSaraChatForSession(session);

    const pureJson = extractPureJsonReply(rawReply);
    const replyText = pureJson ?? rawReply;

    session = await addMessage(session.sessionId, 'assistant', replyText);

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
      sessionId: session.sessionId,
      candidateData: session.candidateData,
      currentStep: session.currentStep,
      memoryEnabled: isSaraMemoryEnabled(),
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