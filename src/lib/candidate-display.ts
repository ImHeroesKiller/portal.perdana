import type { ApplicationStatus, Employee } from '../../types';

/** Standardized row for candidate tables across the app. */
export interface CandidateTableRow {
  id: string;
  fullName: string;
  positionApplied: string;
  email: string;
  whatsappNumber: string;
  domicileCity: string;
  domicileAddress: string;
  lastEducation: string;
  institutionName: string;
  major: string;
  status: ApplicationStatus;
  source: string;
  createdAt: string;
  skillsLabel: string;
}

export const CANDIDATE_TABLE_COLUMNS = [
  { key: 'fullName', label: 'Nama Pelamar' },
  { key: 'positionApplied', label: 'Lowongan' },
  { key: 'email', label: 'Email' },
  { key: 'whatsappNumber', label: 'WhatsApp' },
  { key: 'domicileCity', label: 'Domisili' },
  { key: 'lastEducation', label: 'Pendidikan' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Sumber' },
  { key: 'createdAt', label: 'Terdaftar' },
] as const;

function extractCity(candidate: Employee): string {
  const raw = candidate as Employee & { addressLine?: string; kabupaten?: string };
  if (raw.kabupaten?.trim()) return raw.kabupaten.trim();
  const address = raw.addressLine || candidate.domicileAddress || '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || candidate.placeOfBirth || '-';
}

function formatSkills(skills: Employee['skills']): string {
  if (Array.isArray(skills)) return skills.join(', ');
  if (typeof skills === 'string') return skills;
  return '-';
}

function formatSource(source: unknown): string {
  if (source === 'ai-sara') return 'AI Sara';
  if (source === 'manual') return 'Form Manual';
  if (source === 'api-submit') return 'API';
  if (typeof source === 'string' && source.trim()) return source;
  return 'Manual';
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export function toCandidateTableRow(candidate: Employee): CandidateTableRow {
  const raw = candidate as Employee & { source?: string; addressLine?: string };
  return {
    id: candidate.id,
    fullName: candidate.fullName || '-',
    positionApplied: candidate.positionApplied || '-',
    email: candidate.email || '-',
    whatsappNumber: candidate.whatsappNumber || '-',
    domicileCity: extractCity(candidate),
    domicileAddress: raw.addressLine || candidate.domicileAddress || '-',
    lastEducation: candidate.lastEducation || '-',
    institutionName: candidate.institutionName || '-',
    major: candidate.major || '-',
    status: candidate.status || 'APPLIED',
    source: formatSource(raw.source),
    createdAt: formatDate(candidate.createdAt),
    skillsLabel: formatSkills(candidate.skills),
  };
}

export function toCandidateTableRows(candidates: Employee[]): CandidateTableRow[] {
  return candidates.map(toCandidateTableRow);
}