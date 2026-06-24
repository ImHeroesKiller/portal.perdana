/**
 * Single source of truth for recruitment choice fields (Sara AI + Form Manual).
 */

export const GENDER_OPTIONS = ['Laki-laki', 'Perempuan'] as const;
export type GenderOption = (typeof GENDER_OPTIONS)[number];

export const RELIGION_OPTIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
] as const;
export type ReligionOption = (typeof RELIGION_OPTIONS)[number];

export const MARITAL_OPTIONS = [
  'Belum Menikah',
  'Menikah',
  'Cerai Hidup',
  'Cerai Mati',
] as const;
export type MaritalOption = (typeof MARITAL_OPTIONS)[number];

export const EDUCATION_OPTIONS = ['SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'] as const;
export type EducationOption = (typeof EDUCATION_OPTIONS)[number];

export const BANK_OPTIONS = ['Mandiri', 'BCA', 'Lainnya'] as const;
export type BankOption = (typeof BANK_OPTIONS)[number];

export const EMERGENCY_RELATION_OPTIONS = [
  'Orang Tua',
  'Pasangan',
  'Saudara',
  'Teman',
] as const;

export const RELOCATE_OPTIONS = ['Ya', 'Tidak'] as const;
export type RelocateOption = (typeof RELOCATE_OPTIONS)[number];

/** Fields that Sara shows as quick-reply buttons */
export type QuickReplyField =
  | 'gender'
  | 'religion'
  | 'maritalStatus'
  | 'willingToRelocate'
  | 'lastEducation'
  | 'bankName'
  | 'emergencyRelation';

export const QUICK_REPLY_FIELDS: QuickReplyField[] = [
  'gender',
  'religion',
  'maritalStatus',
  'willingToRelocate',
  'lastEducation',
  'bankName',
  'emergencyRelation',
];

const GENDER_ALIASES: Record<string, GenderOption> = {
  laki: 'Laki-laki',
  'laki-laki': 'Laki-laki',
  lelaki: 'Laki-laki',
  pria: 'Laki-laki',
  cowok: 'Laki-laki',
  male: 'Laki-laki',
  perempuan: 'Perempuan',
  wanita: 'Perempuan',
  cewek: 'Perempuan',
  female: 'Perempuan',
};

const RELIGION_ALIASES: Record<string, ReligionOption> = {
  islam: 'Islam',
  kristen: 'Kristen',
  'kristen protestan': 'Kristen',
  protestan: 'Kristen',
  katolik: 'Katolik',
  katholik: 'Katolik',
  hindu: 'Hindu',
  buddha: 'Buddha',
  budha: 'Buddha',
  khonghucu: 'Khonghucu',
  'khong hu cu': 'Khonghucu',
  konghucu: 'Khonghucu',
};

const MARITAL_ALIASES: Record<string, MaritalOption> = {
  'belum menikah': 'Belum Menikah',
  lajang: 'Belum Menikah',
  single: 'Belum Menikah',
  'belum kawin': 'Belum Menikah',
  menikah: 'Menikah',
  kawin: 'Menikah',
  nikah: 'Menikah',
  married: 'Menikah',
  cerai: 'Cerai Hidup',
  'cerai hidup': 'Cerai Hidup',
  duda: 'Cerai Hidup',
  janda: 'Cerai Hidup',
  'cerai mati': 'Cerai Mati',
  widower: 'Cerai Mati',
  widow: 'Cerai Mati',
};

const EDUCATION_ALIASES: Record<string, EducationOption> = {
  smp: 'SMP',
  'sma/smk': 'SMA/SMK',
  sma: 'SMA/SMK',
  smk: 'SMA/SMK',
  'sma/smk/sederajat': 'SMA/SMK',
  diploma: 'D3',
  d3: 'D3',
  d4: 'S1',
  s1: 'S1',
  sarjana: 'S1',
  s2: 'S2',
  magister: 'S2',
  s3: 'S3',
  doktor: 'S3',
};

const BANK_ALIASES: Record<string, BankOption> = {
  mandiri: 'Mandiri',
  bca: 'BCA',
  'bank mandiri': 'Mandiri',
  'bank bca': 'BCA',
  lainnya: 'Lainnya',
  other: 'Lainnya',
};

const RELATION_ALIASES: Record<string, (typeof EMERGENCY_RELATION_OPTIONS)[number]> = {
  'orang tua': 'Orang Tua',
  ortu: 'Orang Tua',
  ayah: 'Orang Tua',
  ibu: 'Orang Tua',
  pasangan: 'Pasangan',
  istri: 'Pasangan',
  suami: 'Pasangan',
  saudara: 'Saudara',
  kakak: 'Saudara',
  adik: 'Saudara',
  teman: 'Teman',
};

const RELOCATE_ALIASES: Record<string, RelocateOption> = {
  ya: 'Ya',
  yes: 'Ya',
  siap: 'Ya',
  boleh: 'Ya',
  ok: 'Ya',
  oke: 'Ya',
  open: 'Ya',
  'ya, saya bersedia penuh': 'Ya',
  'hanya site yang saya pilih': 'Ya',
  tidak: 'Tidak',
  no: 'Tidak',
  nggak: 'Tidak',
  gk: 'Tidak',
  ga: 'Tidak',
  'tidak bersedia': 'Tidak',
};

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchAlias<T extends string>(
  raw: string,
  options: readonly T[],
  aliases: Record<string, T>
): T | null {
  const key = normalizeKey(raw);
  if (!key) return null;
  if (aliases[key]) return aliases[key];
  const exact = options.find((o) => normalizeKey(o) === key);
  return exact ?? null;
}

export function normalizeGender(raw: unknown): GenderOption | '' {
  if (raw == null) return '';
  return matchAlias(String(raw), GENDER_OPTIONS, GENDER_ALIASES) ?? '';
}

export function normalizeReligion(raw: unknown): ReligionOption | '' {
  if (raw == null) return '';
  return matchAlias(String(raw), RELIGION_OPTIONS, RELIGION_ALIASES) ?? '';
}

export function normalizeMaritalStatus(raw: unknown): MaritalOption | '' {
  if (raw == null) return '';
  return matchAlias(String(raw), MARITAL_OPTIONS, MARITAL_ALIASES) ?? '';
}

export function normalizeLastEducation(raw: unknown): EducationOption | '' {
  if (raw == null) return '';
  return matchAlias(String(raw), EDUCATION_OPTIONS, EDUCATION_ALIASES) ?? '';
}

export function normalizeBankName(raw: unknown): BankOption | '' {
  if (raw == null) return '';
  return matchAlias(String(raw), BANK_OPTIONS, BANK_ALIASES) ?? '';
}

export function normalizeEmergencyRelation(raw: unknown): string {
  if (raw == null) return '';
  return matchAlias(String(raw), EMERGENCY_RELATION_OPTIONS, RELATION_ALIASES) ?? String(raw).trim();
}

export function normalizeWillingToRelocate(raw: unknown): RelocateOption | '' {
  if (raw == null) return '';
  if (typeof raw === 'boolean') return raw ? 'Ya' : 'Tidak';
  return matchAlias(String(raw), RELOCATE_OPTIONS, RELOCATE_ALIASES) ?? '';
}

const FIELD_NORMALIZERS: Record<string, (v: unknown) => string> = {
  gender: normalizeGender,
  religion: normalizeReligion,
  maritalStatus: normalizeMaritalStatus,
  lastEducation: normalizeLastEducation,
  bankName: normalizeBankName,
  emergencyRelation: normalizeEmergencyRelation,
  willingToRelocate: normalizeWillingToRelocate,
};

/** Normalize a single choice field to its canonical value. */
export function normalizeChoiceField(field: string, value: unknown): string {
  const normalizer = FIELD_NORMALIZERS[field];
  if (!normalizer) return value == null ? '' : String(value).trim();
  return normalizer(value);
}

/** Normalize all known choice fields on a partial candidate/form record. */
export function normalizeRecruitmentChoices<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  for (const field of Object.keys(FIELD_NORMALIZERS)) {
    if (field in out && out[field] != null && out[field] !== '') {
      (out as Record<string, unknown>)[field] = normalizeChoiceField(field, out[field]);
    }
  }
  return out;
}

export function getQuickReplyOptions(field: QuickReplyField | string | null): string[] | null {
  if (!field) return null;
  switch (field as QuickReplyField) {
    case 'gender':
      return [...GENDER_OPTIONS];
    case 'religion':
      return [...RELIGION_OPTIONS];
    case 'maritalStatus':
      return [...MARITAL_OPTIONS];
    case 'willingToRelocate':
      return [...RELOCATE_OPTIONS];
    case 'lastEducation':
      return [...EDUCATION_OPTIONS];
    case 'bankName':
      return [...BANK_OPTIONS];
    case 'emergencyRelation':
      return [...EMERGENCY_RELATION_OPTIONS];
    default:
      return null;
  }
}

export function isQuickReplyField(field: string | null): field is QuickReplyField {
  return field != null && QUICK_REPLY_FIELDS.includes(field as QuickReplyField);
}

/** Human-readable labels for review panels */
export const FIELD_LABELS: Record<string, string> = {
  positionApplied: 'Posisi Dilamar',
  fullName: 'Nama Lengkap',
  nik: 'NIK',
  kkNumber: 'Nomor KK',
  npwp: 'NPWP',
  placeOfBirth: 'Tempat Lahir',
  dateOfBirth: 'Tanggal Lahir',
  gender: 'Jenis Kelamin',
  religion: 'Agama',
  maritalStatus: 'Status Pernikahan',
  willingToRelocate: 'Kesediaan Relokasi',
  email: 'Email',
  whatsappNumber: 'WhatsApp',
  address: 'Alamat',
  lastEducation: 'Pendidikan Terakhir',
  institutionName: 'Institusi',
  major: 'Jurusan',
  graduationYear: 'Tahun Lulus',
  bankName: 'Bank',
  accountNumber: 'Nomor Rekening',
  emergencyName: 'Kontak Darurat',
  emergencyRelation: 'Hubungan Darurat',
  emergencyPhone: 'Telepon Darurat',
  skills: 'Keahlian',
  workExperience: 'Pengalaman Kerja',
};

export type ReviewRow = { id: string; label: string; value: string };

export function formatFieldForDisplay(field: string, value: unknown): string {
  if (value == null || value === '') return '—';
  const normalized = normalizeChoiceField(field, value);
  const display = normalized || String(value).trim();
  if (!display) return '—';
  return display;
}

export function buildReviewRows(
  data: Record<string, unknown>,
  fieldIds: string[]
): ReviewRow[] {
  return fieldIds
    .map((id) => {
      let value = '';
      if (id === 'address') {
        const parts = [data.provinsi, data.kabupaten, data.kecamatan, data.desa]
          .filter(Boolean)
          .join(', ');
        const rtRw =
          data.rt || data.rw
            ? `RT ${data.rt || '—'} / RW ${data.rw || '—'}`
            : '';
        value = [parts, rtRw].filter(Boolean).join(' · ') || String(data.addressLine || data.domicileAddress || '');
      } else if (id === 'birth') {
        const pob = data.placeOfBirth;
        const dob = data.dateOfBirth;
        value = pob && dob ? `${pob}, ${dob}` : String(pob || dob || '');
      } else if (id === 'bank') {
        value =
          data.bankName && data.accountNumber
            ? `${formatFieldForDisplay('bankName', data.bankName)} · ${data.accountNumber}`
            : formatFieldForDisplay('bankName', data.bankName);
      } else if (id === 'emergency') {
        value = data.emergencyName
          ? `${data.emergencyName} (${formatFieldForDisplay('emergencyRelation', data.emergencyRelation) || '—'}) · ${data.emergencyPhone || '—'}`
          : '';
      } else {
        value = formatFieldForDisplay(id, data[id]);
      }
      const label = FIELD_LABELS[id] || id;
      return { id, label, value: value || '—' };
    })
    .filter((row) => row.value !== '—');
}

/** Standard value list for Sara system prompt */
export function formatSaraChoiceFieldGuide(): string {
  return [
    'Nilai standar field pilihan (WAJIB pakai persis ini di JSON & memory):',
    `gender: ${GENDER_OPTIONS.join(' | ')}`,
    `religion: ${RELIGION_OPTIONS.join(' | ')}`,
    `maritalStatus: ${MARITAL_OPTIONS.join(' | ')}`,
    `willingToRelocate: ${RELOCATE_OPTIONS.join(' | ')}`,
    `lastEducation: ${EDUCATION_OPTIONS.join(' | ')}`,
    `bankName: ${BANK_OPTIONS.join(' | ')}`,
    `emergencyRelation: ${EMERGENCY_RELATION_OPTIONS.join(' | ')}`,
    'Saat menanyakan field di atas, sebutkan pilihan singkat (UI akan tampilkan tombol).',
  ].join('\n');
}