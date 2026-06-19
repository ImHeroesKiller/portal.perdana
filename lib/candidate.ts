import { getAdminDb, isAdminConfigured } from './firebase-admin';
import { FirebaseConfigError, FirebaseConnectionError, formatFirebaseError } from './firebase-errors';

export const CANDIDATES_COLLECTION = 'candidates';

export interface CandidatePayload {
  positionApplied?: string;
  fullName?: string;
  nik?: string;
  kkNumber?: string;
  npwp?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  religion?: string;
  willingToRelocate?: string | boolean;
  certifications?: string;
  email?: string;
  whatsappNumber?: string;
  addressLine?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  rt?: string;
  rw?: string;
  latitude?: string | number;
  longitude?: string | number;
  lastEducation?: string;
  institutionName?: string;
  major?: string;
  graduationYear?: string | number;
  skills?: string;
  workExperience?: string;
  bankName?: string;
  accountNumber?: string;
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  telegramId?: string;
  source?: string;
}

const REQUIRED_FIELDS: (keyof CandidatePayload)[] = [
  'fullName',
  'nik',
  'kkNumber',
  'email',
  'whatsappNumber',
  'positionApplied',
  'lastEducation',
  'bankName',
];

export function findJsonInText(text: string): string | null {
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return null;
}

export function isCompleteCandidateData(data: CandidatePayload): boolean {
  return REQUIRED_FIELDS.every((field) => {
    const value = data[field];
    return typeof value === 'string' ? value.trim().length > 0 : value != null;
  });
}

export function ensurePlus62(num: string | undefined): string {
  if (!num) return '';
  let clean = num.replace(/[^0-9]/g, '');
  if (!clean.length) return '';
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (clean.startsWith('62')) return `+${clean}`;
  return `+62${clean}`;
}

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

  return {
    id: candidateId,
    positionApplied: data.positionApplied || 'Staff Operasional',
    fullName: data.fullName || '',
    nik: data.nik || '',
    kkNumber: data.kkNumber || '',
    npwp: data.npwp || '',
    placeOfBirth: data.placeOfBirth || '-',
    dateOfBirth: data.dateOfBirth || new Date().toISOString().split('T')[0],
    gender: data.gender || 'Laki-laki',
    maritalStatus: data.maritalStatus || 'Belum Menikah',
    religion: data.religion || 'Islam',
    willingToRelocate: parseWillingToRelocate(data.willingToRelocate),
    certifications: data.certifications || '',
    email: (data.email || '').toLowerCase(),
    whatsappNumber: ensurePlus62(data.whatsappNumber),
    addressLine: data.addressLine || '',
    provinsi: data.provinsi || '',
    kabupaten: data.kabupaten || '',
    kecamatan: data.kecamatan || '',
    desa: data.desa || '',
    rt: data.rt || '',
    rw: data.rw || '',
    latitude: parseFloat(String(data.latitude)) || -0.9489,
    longitude: parseFloat(String(data.longitude)) || 119.8707,
    lastEducation: data.lastEducation || '-',
    institutionName: data.institutionName || '-',
    major: data.major || '-',
    graduationYear: Number(data.graduationYear) || new Date().getFullYear(),
    skills: data.skills || '',
    workExperience: data.workExperience || '-',
    bankName: data.bankName || '-',
    accountNumber: data.accountNumber || '-',
    emergencyName: data.emergencyName || '-',
    emergencyRelation: data.emergencyRelation || '-',
    emergencyPhone: ensurePlus62(data.emergencyPhone) || '-',
    status: 'new',
    source: data.source || 'ai-sara',
    createdAt: new Date().toISOString(),
  };
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