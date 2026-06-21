/** Client-safe candidate field types & parsers (no firebase-admin). */

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

export function findJsonInText(text: string): string | null {
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return text.substring(startIdx, endIdx + 1);
  }
  return null;
}

export function isCompleteCandidateData(data: CandidatePayload): boolean {
  const required: (keyof CandidatePayload)[] = [
    'fullName',
    'nik',
    'kkNumber',
    'email',
    'whatsappNumber',
    'positionApplied',
    'lastEducation',
    'bankName',
  ];
  return required.every((field) => {
    const value = data[field];
    return typeof value === 'string' ? value.trim().length > 0 : value != null;
  });
}