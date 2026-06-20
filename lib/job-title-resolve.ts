/**
 * Resolusi judul lowongan dari berbagai variasi field API / Firestore.
 */

/** Daftar posisi seed (job-1 … job-N) — fallback jika field title kosong */
export const SEED_JOB_POSITIONS = [
  'OPERATOR DUMP',
  'OPERATOR TRAILER',
  'OPERATOR',
  'OPERATOR BOOM',
  'OPERATOR EXCAVATOR',
  'OPERATOR CRANE 80',
  'OPERATOR CRANE 65 T',
  'OPERATOR CRANE 35 T',
  'OPERATOR CRANE 25',
  'OPERATOR FORKLIFT',
  'OPERATOR CRANE',
  'OPERATOR CREW LAR MAX 100',
  'OPERATOR CREW LAR MIN 100',
  'OPERATOR CREW LAR MIN 150',
  'OPERATOR CREW LAR MIN 250',
  'DRIVER LIGER TRUCK',
  'OPERATOR KENDE',
  'OPERATOR GRADER',
  'OPERATOR ADT',
  'Road Roller Vibro Compactor',
  'Truck Mixer',
  'Fuel Tank Truck',
  'Operator Drilling',
  'Helper Crew',
  'Tukang',
  'Crew Ketinggian',
  'Tukang kayu',
  'Tukang Besi',
  'Tukang Las Acet / Oxy',
  'Tukang Las CAW/ Co2',
  'Las argon',
  'Operator LV',
  'Juru ukur',
  'Tukang Scaffolding',
  'Tukang Listrik',
  'Tukang Batu',
  'Safety',
  'Tukang Cat',
  'Fitter Piping',
  'Mekanik Sedang',
  'Mekanik Senior',
  'Pengawas',
  'Admin',
] as const;

export const TITLE_FIELD_KEYS = [
  'title',
  'jobTitle',
  'job_title',
  'JobTitle',
  'Title',
  'name',
  'Name',
  'position',
  'Position',
  'positionName',
  'positionApplied',
  'nama',
  'Nama',
  'judul',
  'Judul',
  'namaLowongan',
  'namaJabatan',
  'jabatan',
  'posisi',
  'role',
  'label',
  'lowongan',
  'vacancyTitle',
  'jobName',
  'job_name',
] as const;

const GENERIC_TITLE_VALUES = new Set([
  'lowongan',
  'job',
  'vacancy',
  '-',
  'n/a',
  'na',
  'undefined',
  'null',
  'tbd',
  'todo',
]);

const TITLE_KEY_PATTERN =
  /(^|_)(title|name|position|judul|nama|jabatan|posisi|role|label|lowongan)(_|$)/i;

const SKIP_KEY_PATTERN =
  /department|description|location|client|project|created|active|education|salary|skill|requirement|latitude|longitude|gender|type|path|url|id$/i;

export function safeJobString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['value', 'text', 'label', 'name', 'title']) {
      const nested = safeJobString(obj[key]);
      if (nested) return nested;
    }
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

export function isMeaningfulJobTitle(value: unknown): boolean {
  const text = safeJobString(value);
  if (!text) return false;
  const lower = text.toLowerCase();
  if (GENERIC_TITLE_VALUES.has(lower)) return false;
  if (lower.length < 2) return false;
  return true;
}

export function mergeJobNestedFields(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.data;
  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return { ...raw };
  }

  const merged: Record<string, unknown> = { ...raw };
  for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
    const existing = safeJobString(merged[key]);
    const incoming = safeJobString(value);
    if (!existing && incoming) {
      merged[key] = value;
    } else if (merged[key] == null && value != null) {
      merged[key] = value;
    }
  }
  return merged;
}

function buildCaseInsensitiveMap(record: Record<string, unknown>): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const [key, value] of Object.entries(record)) {
    map.set(key.toLowerCase(), value);
  }
  return map;
}

function pickFromKnownKeys(record: Record<string, unknown>): string {
  const ci = buildCaseInsensitiveMap(record);
  for (const key of TITLE_FIELD_KEYS) {
    const direct = record[key];
    if (isMeaningfulJobTitle(direct)) return safeJobString(direct);
    const insensitive = ci.get(key.toLowerCase());
    if (isMeaningfulJobTitle(insensitive)) return safeJobString(insensitive);
  }
  return '';
}

function pickFromFuzzyKeys(record: Record<string, unknown>): string {
  for (const [key, value] of Object.entries(record)) {
    if (SKIP_KEY_PATTERN.test(key)) continue;
    if (!TITLE_KEY_PATTERN.test(key)) continue;
    if (isMeaningfulJobTitle(value)) return safeJobString(value);
  }
  return '';
}

function titleFromSeedJobId(id: unknown): string {
  const text = safeJobString(id);
  const match = /^job-(\d+)$/i.exec(text);
  if (!match) return '';
  const index = parseInt(match[1], 10) - 1;
  if (index < 0 || index >= SEED_JOB_POSITIONS.length) return '';
  return SEED_JOB_POSITIONS[index] ?? '';
}

/** Ambil judul dari record JSON mentah (sebelum / sesudah normalize) */
export function resolveJobTitleFromRaw(record: Record<string, unknown>): string {
  const merged = mergeJobNestedFields(record);

  const ordered = [
    pickFromKnownKeys(merged),
    pickFromFuzzyKeys(merged),
    titleFromSeedJobId(merged.id ?? record.id),
  ];

  for (const candidate of ordered) {
    if (isMeaningfulJobTitle(candidate)) return candidate;
  }

  return 'Lowongan';
}

/** Debug: tunjukkan field mana yang terbaca dari job */
export function inspectJobTitleSources(job: Record<string, unknown>): {
  id: string;
  allKeys: string[];
  knownFields: Record<string, unknown>;
  fuzzyMatches: Record<string, unknown>;
  seedIdFallback: string;
  resolved: string;
} {
  const merged = mergeJobNestedFields(job);
  const ci = buildCaseInsensitiveMap(merged);

  const knownFields: Record<string, unknown> = {};
  for (const key of TITLE_FIELD_KEYS) {
    const v = merged[key] ?? ci.get(key.toLowerCase());
    if (v !== undefined) knownFields[key] = v;
  }

  const fuzzyMatches: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (SKIP_KEY_PATTERN.test(key)) continue;
    if (TITLE_KEY_PATTERN.test(key)) fuzzyMatches[key] = value;
  }

  return {
    id: safeJobString(merged.id ?? job.id),
    allKeys: Object.keys(merged).sort(),
    knownFields,
    fuzzyMatches,
    seedIdFallback: titleFromSeedJobId(merged.id ?? job.id),
    resolved: resolveJobTitleFromRaw(merged),
  };
}