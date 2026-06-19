import { applyCors, handleOptions } from '../lib/api-cors';
import {
  CandidatePayload,
  isCompleteCandidateData,
  saveCandidateToFirestore,
} from '../lib/candidate';
import { isAdminConfigured } from '../lib/firebase-admin';
import { formatFirebaseError, toHttpStatus } from '../lib/firebase-errors';

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAdminConfigured()) {
    return res.status(503).json({
      error: 'Firebase Admin belum dikonfigurasi di server.',
      missing: ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
    });
  }

  const candidate = req.body?.candidate ?? req.body;
  if (!candidate || typeof candidate !== 'object') {
    return res.status(400).json({ error: "Field 'candidate' wajib berupa object" });
  }

  if (!isCompleteCandidateData(candidate as CandidatePayload)) {
    return res.status(400).json({
      error: 'Data kandidat belum lengkap.',
      required: [
        'fullName',
        'nik',
        'kkNumber',
        'email',
        'whatsappNumber',
        'positionApplied',
        'lastEducation',
        'bankName',
      ],
    });
  }

  try {
    const saved = await saveCandidateToFirestore(
      { ...(candidate as CandidatePayload), source: req.body?.source || 'api-submit' },
      { merge: Boolean(req.body?.merge) }
    );

    return res.status(200).json({
      success: true,
      id: saved.id,
      collection: 'candidates',
      candidate: saved,
    });
  } catch (error: unknown) {
    console.error('submit-candidate error:', error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || 'Gagal menyimpan kandidat ke Firestore.',
    });
  }
}