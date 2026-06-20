import type { FormDataState, FileState } from '../types/recruitment-form';

export type FieldErrors = Partial<Record<keyof FormDataState | keyof FileState, string>>;

export type StepValidationResult = {
  valid: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIK_RE = /^\d{16}$/;
const WA_RE = /^\d{9,15}$/;
const NPWP_RE = /^(\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}|\d{15,16})$/;

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateNik(value: string): string | null {
  if (!value.trim()) return 'NIK wajib diisi.';
  if (!NIK_RE.test(normalizeDigits(value))) return 'NIK harus 16 digit angka.';
  return null;
}

export function validateKk(value: string): string | null {
  if (!value.trim()) return 'Nomor KK wajib diisi.';
  if (!NIK_RE.test(normalizeDigits(value))) return 'Nomor KK harus 16 digit angka.';
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Email wajib diisi.';
  if (!EMAIL_RE.test(value.trim().toLowerCase())) return 'Format email tidak valid.';
  return null;
}

export function validateWhatsapp(countryCode: string, number: string): string | null {
  if (!number.trim()) return 'Nomor WhatsApp wajib diisi.';
  const cc = normalizeDigits(countryCode) || '62';
  let digits = normalizeDigits(number);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.startsWith(cc)) digits = digits.slice(cc.length);
  if (!WA_RE.test(digits)) return 'WhatsApp: 9–15 digit (tanpa kode negara).';
  return null;
}

export function validateNpwp(value: string): string | null {
  if (!value.trim()) return null;
  const compact = value.replace(/[.\-]/g, '');
  if (!NPWP_RE.test(value.trim()) && !/^\d{15,16}$/.test(compact)) {
    return 'Format NPWP tidak valid (opsional).';
  }
  return null;
}

export function validateAge(dateOfBirth: string): string | null {
  if (!dateOfBirth) return 'Tanggal lahir wajib diisi.';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 'Tanggal lahir tidak valid.';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  if (age < 18) return 'Usia minimal 18 tahun.';
  if (age > 60) return 'Usia maksimal 60 tahun.';
  return null;
}

export function validateRecruitmentStep(step: number, formData: FormDataState): StepValidationResult {
  const fieldErrors: FieldErrors = {};

  if (step === 1) {
    if (!formData.positionApplied) fieldErrors.positionApplied = 'Pilih posisi yang dilamar.';
    if (!formData.fullName.trim()) fieldErrors.fullName = 'Nama lengkap wajib diisi.';

    const nikErr = validateNik(formData.nik);
    if (nikErr) fieldErrors.nik = nikErr;

    const kkErr = validateKk(formData.kkNumber);
    if (kkErr) fieldErrors.kkNumber = kkErr;

    const npwpErr = validateNpwp(formData.npwp);
    if (npwpErr) fieldErrors.npwp = npwpErr;

    if (!formData.placeOfBirth.trim()) fieldErrors.placeOfBirth = 'Tempat lahir wajib diisi.';

    const ageErr = validateAge(formData.dateOfBirth);
    if (ageErr) fieldErrors.dateOfBirth = ageErr;

    if (!formData.gender) fieldErrors.gender = 'Pilih jenis kelamin.';
    if (!formData.religion) fieldErrors.religion = 'Pilih agama.';
    if (!formData.maritalStatus) fieldErrors.maritalStatus = 'Pilih status pernikahan.';
  }

  if (step === 2) {
    const emailErr = validateEmail(formData.email);
    if (emailErr) fieldErrors.email = emailErr;

    const waErr = validateWhatsapp(formData.whatsappCountryCode, formData.whatsappNumber);
    if (waErr) fieldErrors.whatsappNumber = waErr;

    if (!formData.addressLine.trim()) fieldErrors.addressLine = 'Alamat wajib diisi.';
    if (!formData.provinsi.trim()) fieldErrors.provinsi = 'Provinsi wajib diisi.';
    if (!formData.kabupaten.trim()) fieldErrors.kabupaten = 'Kabupaten/Kota wajib diisi.';
    if (!formData.kecamatan.trim()) fieldErrors.kecamatan = 'Kecamatan wajib diisi.';
    if (!formData.desa.trim()) fieldErrors.desa = 'Desa/Kelurahan wajib diisi.';
  }

  if (step === 3) {
    if (!formData.lastEducation) fieldErrors.lastEducation = 'Pendidikan terakhir wajib diisi.';
    if (!formData.institutionName.trim()) fieldErrors.institutionName = 'Nama institusi wajib diisi.';
    if (!formData.major.trim()) fieldErrors.major = 'Jurusan wajib diisi.';

    if (!formData.graduationYear) {
      fieldErrors.graduationYear = 'Tahun lulus wajib diisi.';
    } else {
      const gradY = parseInt(formData.graduationYear, 10);
      const thisY = new Date().getFullYear();
      if (gradY < 1960 || gradY > thisY + 5) {
        fieldErrors.graduationYear = `Tahun lulus antara 1960 dan ${thisY + 5}.`;
      }
    }

    if (!formData.skills.trim()) fieldErrors.skills = 'Keahlian wajib diisi.';
    if (!formData.bankName) fieldErrors.bankName = 'Bank wajib dipilih.';
    if (!formData.accountNumber.trim()) fieldErrors.accountNumber = 'Nomor rekening wajib diisi.';
    if (!formData.emergencyName.trim()) fieldErrors.emergencyName = 'Kontak darurat wajib diisi.';
    if (!formData.emergencyRelation) fieldErrors.emergencyRelation = 'Hubungan kontak darurat wajib dipilih.';

    const epErr = validateWhatsapp(formData.emergencyCountryCode, formData.emergencyPhone);
    if (epErr) fieldErrors.emergencyPhone = epErr.replace('WhatsApp', 'Nomor darurat');
  }

  const keys = Object.keys(fieldErrors) as (keyof FieldErrors)[];
  if (keys.length === 0) return { valid: true };

  const first = keys[0];
  return {
    valid: false,
    message: fieldErrors[first],
    fieldErrors,
  };
}

export function validateDocuments(files: FileState): StepValidationResult {
  const fieldErrors: FieldErrors = {};
  const required: (keyof FileState)[] = ['applicationLetter', 'cv', 'ktp', 'photo'];

  for (const key of required) {
    if (!files[key]) {
      fieldErrors[key] = 'Dokumen wajib diunggah.';
    }
  }

  const keys = Object.keys(fieldErrors) as (keyof FileErrors)[];
  if (keys.length === 0) return { valid: true };

  return {
    valid: false,
    message: 'Lengkapi dokumen wajib: Surat Lamaran, CV, KTP, dan Foto Diri.',
    fieldErrors,
  };
}

type FileErrors = FieldErrors;