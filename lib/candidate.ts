import { getAdminDb } from './firebase-admin';

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
  willingToRelocate?: string;
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

export function mapCandidateToEmployee(data: CandidatePayload, id?: string) {
  const employeeId = id || Math.random().toString(36).substring(2, 11);

  const cleanWA = ensurePlus62(data.whatsappNumber);
  const cleanEmergency = ensurePlus62(data.emergencyPhone);

  const domicileAddress =
    data.addressLine ||
    [
      data.addressLine,
      data.desa ? `Desa ${data.desa}` : null,
      data.kecamatan ? `Kec. ${data.kecamatan}` : null,
      data.kabupaten,
      data.provinsi,
      data.rt || data.rw ? `RT ${data.rt || '0'} RW ${data.rw || '0'}` : null,
    ]
      .filter(Boolean)
      .join(', ') ||
    'Alamat Domisili';

  return {
    id: employeeId,
    positionApplied: data.positionApplied || 'Staff Operasional',
    fullName: data.fullName || '',
    nik: data.nik || '',
    kkNumber: data.kkNumber || '',
    npwp: data.npwp || '',
    placeOfBirth: data.placeOfBirth || '-',
    dateOfBirth: data.dateOfBirth || new Date().toISOString().split('T')[0],
    gender: data.gender || 'Laki-laki',
    religion: data.religion || 'Islam',
    maritalStatus: data.maritalStatus || 'Belum Menikah',
    willingToRelocate: data.willingToRelocate || 'Ya',
    certifications: data.certifications || '',
    email: (data.email || '').toLowerCase(),
    whatsappNumber: cleanWA,
    domicileAddress,
    latitude: parseFloat(String(data.latitude)) || -0.9489,
    longitude: parseFloat(String(data.longitude)) || 119.8707,
    telegramId: data.telegramId || '',
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
    emergencyPhone: cleanEmergency || '-',
    applicationLetterPath: '',
    cvPath: '',
    ktpPath: '',
    diplomaPath: '',
    photoPath: '',
    kkPath: '',
    certificatePath: '',
    status: 'APPLIED',
    source: 'ai-chatroom',
    createdAt: new Date().toISOString(),
  };
}

export async function saveCandidateToFirestore(
  data: CandidatePayload,
  options?: { id?: string; merge?: boolean }
) {
  if (!isCompleteCandidateData(data)) {
    throw new Error('Data kandidat belum lengkap untuk disimpan ke Firestore.');
  }

  const db = getAdminDb();
  const employee = mapCandidateToEmployee(data, options?.id);
  const docRef = db.collection('employees').doc(employee.id);

  if (options?.merge) {
    await docRef.set(cleanDoc(employee) as Record<string, unknown>, { merge: true });
  } else {
    await docRef.set(cleanDoc(employee) as Record<string, unknown>);
  }

  return employee;
}

export async function trySaveCandidateFromReply(replyText: string) {
  const jsonStr = findJsonInText(replyText);
  if (!jsonStr) return null;

  try {
    const parsed = JSON.parse(jsonStr) as CandidatePayload;
    if (!isCompleteCandidateData(parsed)) return null;
    return await saveCandidateToFirestore(parsed, { merge: true });
  } catch {
    return null;
  }
}