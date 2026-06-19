import { applyCors, handleOptions } from '../lib/api-cors';
import {
  CandidatePayload,
  isCompleteCandidateData,
  saveCandidateToFirestore,
} from '../lib/candidate';

export default async function handler(req: any, res: any) {
  applyCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
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
    const saved = await saveCandidateToFirestore(candidate as CandidatePayload, {
      merge: Boolean(req.body?.merge),
    });

    return res.status(200).json({
      success: true,
      id: saved.id,
      candidate: saved,
    });
  } catch (error: any) {
    console.error('submit-candidate error:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menyimpan kandidat ke Firestore.',
    });
  }
}