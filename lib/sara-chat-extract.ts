import { findJsonInText, type CandidatePayload } from './candidate-payload';

export type SaraChatTurn = { role: 'user' | 'assistant'; content: string };

function inferExpectedField(assistantText: string): keyof CandidatePayload | null {
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

function normalizeFieldValue(
  field: keyof CandidatePayload | null,
  content: string,
  assistantContext: string
): string | number | null {
  const trimmed = content.trim();
  if (!field || !trimmed) return null;

  switch (field) {
    case 'fullName':
      return parseName(trimmed);
    case 'nik':
    case 'kkNumber': {
      const digits = trimmed.replace(/\D/g, '');
      return digits.length === 16 ? digits : null;
    }
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
      const fromMsg = trimmed.match(
        /(?:lamar|melamar|posisi|jadi|untuk)\s+(.+?)(?:\.|,|$)/i
      );
      if (fromMsg) return fromMsg[1].trim();
      if (!/^(nama|saya|aku)\b/i.test(trimmed) && trimmed.length < 80) return trimmed;
      return null;
    }
    case 'willingToRelocate': {
      const t = trimmed.toLowerCase();
      if (/^(ya|yes|siap|boleh|ok|oke|open)$/i.test(t)) return 'Ya';
      if (/^(tidak|nggak|gk|ga|no|belum)$/i.test(t)) return 'Tidak';
      if (/belum tahu|gk tahu|ga tahu|lupa|ragu/i.test(t)) return null;
      return null;
    }
    default:
      if (/^(ya|tidak|laki|perempuan|islam|kristen|katolik|hindu|buddha)$/i.test(trimmed)) {
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      }
      if (/^(gk tahu|ga tahu|belum tahu|lupa|ragu)/i.test(trimmed)) return null;
      return trimmed.length > 0 && trimmed.length < 200 ? trimmed : null;
  }
}

function opportunisticExtract(content: string, out: Partial<CandidatePayload>) {
  if (!out.email) {
    const email = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (email) out.email = email[0];
  }

  if (!out.whatsappNumber) {
    const phone = parsePhone(content);
    if (phone) out.whatsappNumber = phone;
  }

  if (!out.nik) {
    const digits = content.replace(/\D/g, '');
    if (digits.length === 16 && /nik/i.test(content)) out.nik = digits;
    else if (/^\d{16}$/.test(content.replace(/\s/g, ''))) out.nik = content.replace(/\s/g, '');
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
    const pos = content.match(
      /(?:mau |ingin )?(?:lamar|jadi|melamar)\s+(?:posisi\s+)?(.+?)(?:\.|,|$)/i
    );
    if (pos) out.positionApplied = pos[1].trim();
  }
}

/** Merge JSON blocks + incremental parsing from user replies. */
export function extractFieldsFromChat(messages: SaraChatTurn[]): Partial<CandidatePayload> {
  const out: Partial<CandidatePayload> = {};

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== 'assistant') continue;
    const json = findJsonInText(messages[i].content);
    if (!json) continue;
    try {
      Object.assign(out, JSON.parse(json) as Partial<CandidatePayload>);
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
    const value = normalizeFieldValue(field, content, prevAssistant);
    if (field && value != null && value !== '') {
      (out as Record<string, unknown>)[field] = value;
    }

    opportunisticExtract(content, out);
  }

  return out;
}

export function isReadyForPreview(data: Partial<CandidatePayload>): boolean {
  return Boolean(
    data.fullName &&
      data.nik &&
      data.whatsappNumber &&
      data.email &&
      data.lastEducation &&
      data.bankName
  );
}

const CONTEXT_LABELS: Partial<Record<keyof CandidatePayload, string>> = {
  positionApplied: 'posisi',
  fullName: 'nama',
  nik: 'NIK',
  kkNumber: 'no KK',
  email: 'email',
  whatsappNumber: 'WhatsApp',
  provinsi: 'provinsi',
  desa: 'desa',
  lastEducation: 'pendidikan',
  bankName: 'bank',
};

/** Inject into Sara system prompt so the model uses real user data, not examples. */
export function formatKnownFieldsContext(data: Partial<CandidatePayload>): string {
  const lines = (Object.keys(CONTEXT_LABELS) as (keyof CandidatePayload)[])
    .filter((key) => {
      const v = data[key];
      return typeof v === 'string' ? v.trim().length > 0 : v != null && v !== '';
    })
    .map((key) => `- ${CONTEXT_LABELS[key]}: ${data[key]}`);

  if (lines.length === 0) {
    return 'KONTEKS: belum ada data — panggil "kamu", jangan nama dummy.';
  }

  return `KONTEKS (pakai nilai ini, jangan nebak):\n${lines.join('\n')}`;
}