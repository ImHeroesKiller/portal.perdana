import { findJsonInText, type CandidatePayload } from './candidate-payload';
import {
  getQuickReplyOptions,
  isQuickReplyField,
  normalizeChoiceField,
  normalizeRecruitmentChoices,
  type QuickReplyField,
} from './recruitment-field-options';

export type SaraChatTurn = { role: 'user' | 'assistant'; content: string };

/** NIK / KK must be exactly 16 numeric digits. */
export function parseSixteenDigitId(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return /^\d{16}$/.test(digits) ? digits : null;
}

export function isNikValid(value: unknown): boolean {
  if (value == null) return false;
  return parseSixteenDigitId(String(value)) !== null;
}

type FieldSpec = {
  key: keyof CandidatePayload | 'address';
  label: string;
  filled: (d: Partial<CandidatePayload>) => boolean;
  display: (d: Partial<CandidatePayload>) => string;
};

const COLLECTION_ORDER: FieldSpec[] = [
  {
    key: 'positionApplied',
    label: 'Posisi dilamar',
    filled: (d) => Boolean(d.positionApplied?.trim()),
    display: (d) => d.positionApplied || '',
  },
  {
    key: 'fullName',
    label: 'Nama lengkap',
    filled: (d) => Boolean(d.fullName?.trim()),
    display: (d) => d.fullName || '',
  },
  {
    key: 'nik',
    label: 'NIK',
    filled: (d) => isNikValid(d.nik),
    display: (d) => String(d.nik || ''),
  },
  {
    key: 'kkNumber',
    label: 'Nomor KK',
    filled: (d) => isNikValid(d.kkNumber),
    display: (d) => String(d.kkNumber || ''),
  },
  {
    key: 'npwp',
    label: 'NPWP',
    filled: (d) => isNikValid(d.npwp),
    display: (d) => String(d.npwp || ''),
  },
  {
    key: 'placeOfBirth',
    label: 'Tempat lahir',
    filled: (d) => Boolean(d.placeOfBirth?.trim()),
    display: (d) => d.placeOfBirth || '',
  },
  {
    key: 'dateOfBirth',
    label: 'Tanggal lahir',
    filled: (d) => Boolean(d.dateOfBirth?.trim()),
    display: (d) => d.dateOfBirth || '',
  },
  {
    key: 'gender',
    label: 'Jenis kelamin',
    filled: (d) => Boolean(normalizeChoiceField('gender', d.gender)),
    display: (d) => normalizeChoiceField('gender', d.gender) || d.gender || '',
  },
  {
    key: 'maritalStatus',
    label: 'Status pernikahan',
    filled: (d) => Boolean(normalizeChoiceField('maritalStatus', d.maritalStatus)),
    display: (d) => normalizeChoiceField('maritalStatus', d.maritalStatus) || d.maritalStatus || '',
  },
  {
    key: 'religion',
    label: 'Agama',
    filled: (d) => Boolean(normalizeChoiceField('religion', d.religion)),
    display: (d) => normalizeChoiceField('religion', d.religion) || d.religion || '',
  },
  {
    key: 'willingToRelocate',
    label: 'Relokasi',
    filled: (d) => {
      const v = normalizeChoiceField('willingToRelocate', d.willingToRelocate);
      return v === 'Ya' || v === 'Tidak';
    },
    display: (d) => normalizeChoiceField('willingToRelocate', d.willingToRelocate) || '',
  },
  {
    key: 'email',
    label: 'Email',
    filled: (d) => Boolean(d.email?.trim()),
    display: (d) => d.email || '',
  },
  {
    key: 'whatsappNumber',
    label: 'WhatsApp',
    filled: (d) => Boolean(d.whatsappNumber?.trim()),
    display: (d) => d.whatsappNumber || '',
  },
  {
    key: 'address',
    label: 'Alamat (prov/kab/kec/desa)',
    filled: (d) =>
      Boolean(
        d.provinsi?.trim() && d.kabupaten?.trim() && d.kecamatan?.trim() && d.desa?.trim()
      ),
    display: (d) =>
      [d.provinsi, d.kabupaten, d.kecamatan, d.desa, d.rt && `RT ${d.rt}`, d.rw && `RW ${d.rw}`]
        .filter(Boolean)
        .join(', ') || d.addressLine || '',
  },
  {
    key: 'lastEducation',
    label: 'Pendidikan terakhir',
    filled: (d) => Boolean(normalizeChoiceField('lastEducation', d.lastEducation)),
    display: (d) => normalizeChoiceField('lastEducation', d.lastEducation) || d.lastEducation || '',
  },
  {
    key: 'institutionName',
    label: 'Nama institusi',
    filled: (d) => Boolean(d.institutionName?.trim()),
    display: (d) => d.institutionName || '',
  },
  {
    key: 'major',
    label: 'Jurusan',
    filled: (d) => Boolean(d.major?.trim()),
    display: (d) => d.major || '',
  },
  {
    key: 'graduationYear',
    label: 'Tahun lulus',
    filled: (d) => d.graduationYear != null && String(d.graduationYear).trim() !== '',
    display: (d) => (d.graduationYear != null ? String(d.graduationYear) : ''),
  },
  {
    key: 'skills',
    label: 'Keahlian',
    filled: (d) => Boolean(String(d.skills || '').trim()),
    display: (d) => String(d.skills || ''),
  },
  {
    key: 'workExperience',
    label: 'Pengalaman kerja',
    filled: (d) => Boolean(d.workExperience?.trim()),
    display: (d) => d.workExperience || '',
  },
  {
    key: 'bankName',
    label: 'Nama bank',
    filled: (d) => Boolean(normalizeChoiceField('bankName', d.bankName)),
    display: (d) => normalizeChoiceField('bankName', d.bankName) || d.bankName || '',
  },
  {
    key: 'accountNumber',
    label: 'Nomor rekening',
    filled: (d) => Boolean(d.accountNumber?.trim()),
    display: (d) => d.accountNumber || '',
  },
  {
    key: 'emergencyName',
    label: 'Kontak darurat',
    filled: (d) => Boolean(d.emergencyName?.trim()),
    display: (d) => d.emergencyName || '',
  },
  {
    key: 'emergencyRelation',
    label: 'Hubungan darurat',
    filled: (d) => Boolean(normalizeChoiceField('emergencyRelation', d.emergencyRelation)),
    display: (d) =>
      normalizeChoiceField('emergencyRelation', d.emergencyRelation) || d.emergencyRelation || '',
  },
  {
    key: 'emergencyPhone',
    label: 'Telepon darurat',
    filled: (d) => Boolean(d.emergencyPhone?.trim()),
    display: (d) => d.emergencyPhone || '',
  },
];

function isCorrectionMessage(content: string): boolean {
  return /salah|bukan itu|maksudnya|koreksi|typo|harusnya|bukan,|keliru|ganti|maaf.*salah|salah ketik|bukan yang/i.test(
    content
  );
}

export function inferExpectedField(assistantText: string): keyof CandidatePayload | null {
  const t = assistantText.toLowerCase();
  const asksName = /nama lengkap|nama sesuai|nama kamu|siapa nama|kenalan|sekalian nama|nama.*ktp/i.test(
    t
  );
  const asksPosition = /posisi|melamar|lamar/i.test(t);

  if (asksName && asksPosition) return null;

  if (asksName) return 'fullName';
  if (/nomor kk|no\.?\s*kk|kartu keluarga/i.test(t)) return 'kkNumber';
  if (/\bnik\b/i.test(t)) return 'nik';
  if (asksPosition) return 'positionApplied';
  if (/e-?mail/i.test(t)) return 'email';
  if (/whatsapp|\bwa\b|nomor hp|no\.?\s*hp|telepon|handphone/i.test(t)) return 'whatsappNumber';
  if (/\bnpwp\b/i.test(t)) return 'npwp';
  if (/tempat lahir/i.test(t)) return 'placeOfBirth';
  if (/tanggal lahir|tgl\.?\s*lahir/i.test(t)) return 'dateOfBirth';
  if (/jenis kelamin/i.test(t)) return 'gender';
  if (/\bagama\b/i.test(t)) return 'religion';
  if (/status (nikah|perkawinan)|belum menikah|menikah/i.test(t)) return 'maritalStatus';
  if (/relokasi|pindah (kerja|domisili)|buka.*pindah|siap.*pindah/i.test(t)) return 'willingToRelocate';
  if (/sertifikat/i.test(t)) return 'certifications';
  if (/\bprovinsi\b/i.test(t)) return 'provinsi';
  if (/\bkabupaten\b|\bkota\b/i.test(t)) return 'kabupaten';
  if (/\bkecamatan\b|\bkec\.?\b/i.test(t)) return 'kecamatan';
  if (/\bdesa\b|\bkelurahan\b/i.test(t)) return 'desa';
  if (/\brt\b|\brw\b/i.test(t)) return 'rt';
  if (/\balamat\b/i.test(t)) return 'addressLine';
  if (/pendidikan terakhir|pendidikan/i.test(t)) return 'lastEducation';
  if (/nama (sekolah|institusi|kampus)/i.test(t)) return 'institutionName';
  if (/jurusan|prodi/i.test(t)) return 'major';
  if (/tahun lulus/i.test(t)) return 'graduationYear';
  if (/keahlian|\bskill/i.test(t)) return 'skills';
  if (/pengalaman kerja|pengalaman/i.test(t)) return 'workExperience';
  if (/nama bank|\bbank\b/i.test(t)) return 'bankName';
  if (/nomor rekening|no\.?\s*rekening|rekening/i.test(t)) return 'accountNumber';
  if (/nama.*darurat|kontak darurat/i.test(t)) return 'emergencyName';
  if (/hubungan.*darurat/i.test(t)) return 'emergencyRelation';
  if (/telepon darurat|hp darurat|nomor darurat/i.test(t)) return 'emergencyPhone';

  return null;
}

function parseName(raw: string): string | null {
  let s = raw.trim();
  s = s.replace(/^(nama (lengkap )?(saya |aku )?|aku |saya |ini )/i, '').trim();
  s = s.replace(/[.,!?~]+$/g, '').trim();
  if (s.length < 2 || /^\d+$/.test(s) || /@/.test(s) || /^\+?\d{10,}$/.test(s.replace(/\s/g, ''))) {
    return null;
  }
  return s;
}

function parsePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+62') && digits.length >= 11) return digits;
  if (digits.startsWith('62') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('08') && digits.length >= 10) return `+62${digits.slice(1)}`;
  return null;
}

function parseDate(raw: string): string | null {
  const iso = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const dmy = raw.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/** Detect invalid NIK/KK attempt for Sara to give friendly feedback. */
export function describeIdValidation(raw: string, label: 'NIK' | 'KK'): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (/^\d{16}$/.test(digits)) return null;
  if (digits.length < 16) return `${label} cuma ${digits.length} digit — harus tepat 16 angka ya`;
  return `${label} kepanjangan (${digits.length} digit) — harus tepat 16 angka ya`;
}

function normalizeFieldValue(
  field: keyof CandidatePayload | null,
  content: string
): string | number | null {
  const trimmed = content.trim();
  if (!field || !trimmed) return null;

  switch (field) {
    case 'fullName':
      return parseName(trimmed);
    case 'nik':
    case 'kkNumber':
    case 'npwp':
      return parseSixteenDigitId(trimmed);
    case 'email': {
      const match = trimmed.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      return match ? match[0] : null;
    }
    case 'whatsappNumber':
    case 'emergencyPhone':
      return parsePhone(trimmed);
    case 'dateOfBirth':
      return parseDate(trimmed);
    case 'graduationYear': {
      const year = trimmed.match(/\b(19|20)\d{2}\b/);
      return year ? Number(year[0]) : null;
    }
    case 'positionApplied': {
      const fromMsg = trimmed.match(/(?:lamar|melamar|posisi|jadi|untuk)\s+(.+?)(?:\.|,|$)/i);
      if (fromMsg) return fromMsg[1].trim();
      if (!/^(nama|saya|aku)\b/i.test(trimmed) && trimmed.length < 80) return trimmed;
      return null;
    }
    case 'gender': {
      const v = normalizeChoiceField('gender', trimmed);
      return v || null;
    }
    case 'religion': {
      const v = normalizeChoiceField('religion', trimmed);
      return v || null;
    }
    case 'maritalStatus': {
      const v = normalizeChoiceField('maritalStatus', trimmed);
      return v || null;
    }
    case 'willingToRelocate': {
      const v = normalizeChoiceField('willingToRelocate', trimmed);
      if (v) return v;
      if (/belum tahu|gk tahu|ga tahu|lupa|ragu/i.test(trimmed)) return null;
      return null;
    }
    case 'lastEducation': {
      const v = normalizeChoiceField('lastEducation', trimmed);
      return v || null;
    }
    case 'bankName': {
      const v = normalizeChoiceField('bankName', trimmed);
      return v || null;
    }
    case 'emergencyRelation': {
      const v = normalizeChoiceField('emergencyRelation', trimmed);
      return v || null;
    }
    default:
      if (/^(gk tahu|ga tahu|belum tahu|lupa|ragu)/i.test(trimmed)) return null;
      return trimmed.length > 0 && trimmed.length < 200 ? trimmed : null;
  }
}

function opportunisticExtract(
  content: string,
  out: Partial<CandidatePayload>,
  expectedField: keyof CandidatePayload | null
) {
  if (!out.email) {
    const email = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (email) out.email = email[0];
  }

  if (!out.whatsappNumber) {
    const phone = parsePhone(content);
    if (phone) out.whatsappNumber = phone;
  }

  const sixteen = parseSixteenDigitId(content);
  if (sixteen) {
    const lower = content.toLowerCase();
    if (
      expectedField === 'nik' ||
      (!out.nik && /nik/i.test(lower) && expectedField !== 'kkNumber')
    ) {
      out.nik = sixteen;
    } else if (
      expectedField === 'kkNumber' ||
      (!out.kkNumber && /(kk|kartu keluarga)/i.test(lower) && expectedField !== 'nik')
    ) {
      out.kkNumber = sixteen;
    } else if (expectedField === 'nik') {
      out.nik = sixteen;
    } else if (expectedField === 'kkNumber') {
      out.kkNumber = sixteen;
    }
  }

  if (!out.fullName) {
    const intro = content.match(
      /nama (?:saya |aku )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{1,60}?)(?=\s*(?:,|\.|dan |mau |ingin |lamar |$))/i
    );
    if (intro) {
      const name = parseName(intro[1]);
      if (name) out.fullName = name;
    }
  }

  if (!out.positionApplied) {
    const pos = content.match(/(?:mau |ingin )?(?:lamar|jadi|melamar)\s+(?:posisi\s+)?(.+?)(?:\.|,|$)/i);
    if (pos) out.positionApplied = pos[1].trim();
  }
}

/** Re-parse fields from correction messages (overwrite previous values). */
function applyCorrections(content: string, out: Partial<CandidatePayload>) {
  if (!isCorrectionMessage(content)) return;

  const nik = parseSixteenDigitId(content);
  if (nik && /nik/i.test(content)) out.nik = nik;

  const kk = parseSixteenDigitId(content);
  if (kk && /(kk|kartu keluarga)/i.test(content)) out.kkNumber = kk;

  const email = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (email) out.email = email[0];

  const phone = parsePhone(content);
  if (phone) out.whatsappNumber = phone;

  const name = content.match(
    /nama (?:saya |aku |lengkap )?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s'.-]{2,60})/i
  );
  if (name) {
    const parsed = parseName(name[1]);
    if (parsed) out.fullName = parsed;
  }
}

export function getNextMissingField(
  data: Partial<CandidatePayload>
): FieldSpec | null {
  return COLLECTION_ORDER.find((f) => !f.filled(data)) ?? null;
}

/** Merge JSON blocks + incremental parsing from user replies. */
export function extractFieldsFromChat(messages: SaraChatTurn[]): Partial<CandidatePayload> {
  const out: Partial<CandidatePayload> = {};

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    const json = findJsonInText(messages[i].content);
    if (!json) continue;
    try {
      const parsed = JSON.parse(json) as Partial<CandidatePayload>;
      if (parsed.nik && !isNikValid(parsed.nik)) delete parsed.nik;
      if (parsed.kkNumber && !isNikValid(parsed.kkNumber)) delete parsed.kkNumber;
      Object.assign(out, parsed);
      break;
    } catch {
      /* incomplete JSON */
    }
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const content = msg.content.trim();
    if (!content) continue;

    let prevAssistant = '';
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j].role === 'assistant') {
        prevAssistant = messages[j].content;
        break;
      }
    }

    const field = inferExpectedField(prevAssistant);
    const value = normalizeFieldValue(field, content);
    if (field && value != null && value !== '') {
      (out as Record<string, unknown>)[field] = value;
    }

    applyCorrections(content, out);
    opportunisticExtract(content, out, field);
  }

  if (out.nik && !isNikValid(out.nik)) delete out.nik;
  if (out.kkNumber && !isNikValid(out.kkNumber)) delete out.kkNumber;

  return normalizeRecruitmentChoices(out);
}

/** Quick-reply buttons for the field Sara is currently asking about. */
export function getQuickRepliesForChat(
  messages: SaraChatTurn[],
  knownData?: Partial<CandidatePayload>
): {
  field: QuickReplyField;
  options: string[];
} | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    const field = inferExpectedField(messages[i].content);
    if (isQuickReplyField(field)) {
      const options = getQuickReplyOptions(field);
      if (options?.length) return { field, options };
    }
    break;
  }

  if (knownData) {
    const next = getNextMissingField(knownData);
    if (next && isQuickReplyField(next.key)) {
      const options = getQuickReplyOptions(next.key);
      if (options?.length) return { field: next.key, options };
    }
  }

  return null;
}

export function isReadyForPreview(data: Partial<CandidatePayload>): boolean {
  return Boolean(
    data.fullName &&
      isNikValid(data.nik) &&
      data.whatsappNumber &&
      data.email &&
      data.lastEducation &&
      data.bankName
  );
}

/** Inject into Sara system prompt — full memory + anti-repeat guidance. */
export function formatKnownFieldsContext(data: Partial<CandidatePayload>): string {
  const filled = COLLECTION_ORDER.filter((f) => f.filled(data));
  const missing = COLLECTION_ORDER.filter((f) => !f.filled(data));
  const next = missing[0];

  const filledLines = filled.map((f) => `✓ ${f.label}: ${f.display(data)}`);

  const lines: string[] = [];

  if (filledLines.length > 0) {
    lines.push('SUDAH TERISI (ingat & jangan tanya ulang):');
    lines.push(...filledLines);
  } else {
    lines.push('SUDAH TERISI: belum ada — panggil "kamu", jangan nama dummy.');
  }

  if (missing.length > 0) {
    lines.push('');
    lines.push(`BELUM (${missing.length}): ${missing.map((f) => f.label).join(', ')}`);
    if (next) {
      lines.push(`LANJUTKAN: tanya HANYA "${next.label}" — jangan ulang field di atas.`);
    }
  } else {
    lines.push('');
    lines.push('SEMUA LENGKAP — siap output JSON.');
  }

  return lines.join('\n');
}

/** Last user message NIK/KK validation hint for Sara (if assistant just asked). */
export function formatLastTurnValidationHint(messages: SaraChatTurn[]): string {
  if (messages.length < 2) return '';

  const last = messages[messages.length - 1];
  const prev = messages[messages.length - 2];
  if (last.role !== 'user' || prev.role !== 'assistant') return '';

  const field = inferExpectedField(prev.content);
  if (field !== 'nik' && field !== 'kkNumber') return '';

  const label = field === 'nik' ? 'NIK' : 'KK';
  const hint = describeIdValidation(last.content, label);
  if (!hint) return '';

  return `VALIDASI: jawaban ${label} user belum valid — ${hint}. Minta ulang dengan ramah, jangan anggap sudah benar.`;
}

export function buildSaraChatContext(messages: SaraChatTurn[]): string {
  const data = extractFieldsFromChat(messages);
  const parts = [formatKnownFieldsContext(data)];
  const validation = formatLastTurnValidationHint(messages);
  if (validation) parts.push(validation);
  return parts.join('\n\n');
}