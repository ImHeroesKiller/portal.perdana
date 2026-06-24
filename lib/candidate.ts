import { getAdminDb, isAdminConfigured } from './firebase-admin';
import { FirebaseConfigError, FirebaseConnectionError, formatFirebaseError } from './firebase-errors';
import {
  CANDIDATES_COLLECTION,
  normalizeApplicationStatus,
  prepareCandidateForFirestore,
} from './candidate-record';
import {
  type CandidatePayload,
  findJsonInText,
  isCompleteCandidateData,
} from './candidate-payload';
import { normalizeRecruitmentChoices } from './recruitment-field-options';

export { CANDIDATES_COLLECTION } from './candidate-record';
export type { CandidatePayload } from './candidate-payload';
export { findJsonInText, isCompleteCandidateData } from './candidate-payload';

export { ensurePlus62 } from './candidate-record';

function cleanDoc(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(cleanDoc);
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (val !== undefined) cleaned[key] = cleanDoc(val);
  }
  return cleaned;
}

function parseWillingToRelocate(value: CandidatePayload['willingToRelocate']): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return true;
  const normalized = value.toString().trim().toLowerCase();
  return !['tidak', 'no', 'false', '0'].includes(normalized);
}

export function mapCandidateDocument(data: CandidatePayload, id?: string) {
  const candidateId = id || Math.random().toString(36).substring(2, 11);
  const normalized = normalizeRecruitmentChoices(data as Record<string, unknown>) as CandidatePayload;
  const addressLine = normalized.addressLine || '';

  return prepareCandidateForFirestore(
    {
      id: candidateId,
      positionApplied: normalized.positionApplied || 'Staff Operasional',
      fullName: normalized.fullName || '',
      nik: normalized.nik || '',
      kkNumber: normalized.kkNumber || '',
      npwp: normalized.npwp || '',
      placeOfBirth: normalized.placeOfBirth || '-',
      dateOfBirth: normalized.dateOfBirth || new Date().toISOString().split('T')[0],
      gender: normalized.gender || 'Laki-laki',
      maritalStatus: normalized.maritalStatus || 'Belum Menikah',
      religion: normalized.religion || 'Islam',
      willingToRelocate: parseWillingToRelocate(normalized.willingToRelocate),
      certifications: normalized.certifications || '',
      email: (normalized.email || '').toLowerCase(),
      whatsappNumber: ensurePlus62(normalized.whatsappNumber),
      addressLine,
      domicileAddress: addressLine,
      provinsi: normalized.provinsi || '',
      kabupaten: normalized.kabupaten || '',
      kecamatan: normalized.kecamatan || '',
      desa: normalized.desa || '',
      rt: normalized.rt || '',
      rw: normalized.rw || '',
      latitude: parseFloat(String(normalized.latitude)) || -0.9489,
      longitude: parseFloat(String(normalized.longitude)) || 119.8707,
      lastEducation: normalized.lastEducation || '-',
      institutionName: normalized.institutionName || '-',
      major: normalized.major || '-',
      graduationYear: Number(normalized.graduationYear) || new Date().getFullYear(),
      skills: normalized.skills || '',
      workExperience: normalized.workExperience || '-',
      bankName: normalized.bankName || '-',
      accountNumber: normalized.accountNumber || '-',
      emergencyName: normalized.emergencyName || '-',
      emergencyRelation: normalized.emergencyRelation || '-',
      emergencyPhone: ensurePlus62(normalized.emergencyPhone) || '-',
      telegramId: normalized.telegramId || '',
      applicationLetterPath: '',
      cvPath: '',
      ktpPath: '',
      diplomaPath: '',
      photoPath: '',
      kkPath: '',
      certificatePath: '',
      status: normalizeApplicationStatus('APPLIED'),
      createdAt: new Date().toISOString(),
    } as any,
    { id: candidateId, source: normalized.source || data.source || 'ai-sara' }
  );
}

export async function saveCandidateToFirestore(
  data: CandidatePayload,
  options?: { id?: string; merge?: boolean }
) {
  if (!isAdminConfigured()) {
    throw new FirebaseConfigError(
      'Firebase Admin belum dikonfigurasi di server. Tidak dapat menyimpan kandidat.'
    );
  }

  if (!isCompleteCandidateData(data)) {
    throw new Error('Data kandidat belum lengkap untuk disimpan ke Firestore.');
  }

  try {
    const db = getAdminDb();
    const candidate = mapCandidateDocument(data, options?.id);
    const docRef = db.collection(CANDIDATES_COLLECTION).doc(candidate.id);

    if (options?.merge) {
      await docRef.set(cleanDoc(candidate) as Record<string, unknown>, { merge: true });
    } else {
      await docRef.set(cleanDoc(candidate) as Record<string, unknown>);
    }

    return candidate;
  } catch (error) {
    if (error instanceof FirebaseConfigError) throw error;
    throw new FirebaseConnectionError(
      `Gagal menyimpan kandidat ke Firestore (${CANDIDATES_COLLECTION}).`,
      error
    );
  }
}

export function extractPureJsonReply(text: string): string | null {
  const jsonStr = findJsonInText(text);
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr) as CandidatePayload;
    if (!isCompleteCandidateData(parsed)) return null;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

export async function trySaveCandidateFromReply(replyText: string) {
  const pureJson = extractPureJsonReply(replyText);
  if (!pureJson) return null;

  try {
    const parsed = JSON.parse(pureJson) as CandidatePayload;
    return await saveCandidateToFirestore({ ...parsed, source: 'ai-sara' }, { merge: true });
  } catch (error) {
    console.error('trySaveCandidateFromReply error:', formatFirebaseError(error));
    return null;
  }
}