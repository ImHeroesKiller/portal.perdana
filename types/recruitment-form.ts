export interface FormDataState {
  positionApplied: string;
  fullName: string;
  nik: string;
  kkNumber: string;
  npwp: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  religion: string;
  maritalStatus: string;
  willingToRelocate: string;
  certifications: string;
  customCertifications: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  email: string;
  addressLine: string;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  rt: string;
  rw: string;
  latitude: string;
  longitude: string;
  telegramId: string;
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  lastEducation: string;
  institutionName: string;
  major: string;
  graduationYear: string;
  skills: string;
  workExperience: string;
  bankName: string;
  accountNumber: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyCountryCode: string;
  emergencyPhone: string;
}

export interface FileState {
  applicationLetter: File | null;
  cv: File | null;
  ktp: File | null;
  diploma: File | null;
  photo: File | null;
  kk: File | null;
  certificate: File | null;
}

export const INITIAL_FORM_STATE: FormDataState = {
  positionApplied: '',
  fullName: '',
  nik: '',
  kkNumber: '',
  npwp: '',
  placeOfBirth: '',
  dateOfBirth: '',
  gender: '',
  religion: '',
  maritalStatus: '',
  willingToRelocate: 'Ya',
  certifications: '',
  customCertifications: '',
  whatsappCountryCode: '+62',
  whatsappNumber: '',
  email: '',
  addressLine: '',
  provinsi: '',
  kabupaten: '',
  kecamatan: '',
  desa: '',
  rt: '',
  rw: '',
  latitude: '',
  longitude: '',
  telegramId: '',
  facebook: '',
  instagram: '',
  twitter: '',
  linkedin: '',
  lastEducation: '',
  institutionName: '',
  major: '',
  graduationYear: '',
  skills: '',
  workExperience: '',
  bankName: '',
  accountNumber: '',
  emergencyName: '',
  emergencyRelation: '',
  emergencyCountryCode: '+62',
  emergencyPhone: '',
};