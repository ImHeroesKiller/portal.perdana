import type { ApplicationStatus, Employee, NewEmployee } from '../types';

export function ensurePlus62(num: string | undefined): string {
  if (!num) return '';
  let clean = num.replace(/[^0-9]/g, '');
  if (!clean.length) return '';
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (clean.startsWith('62')) return `+${clean}`;
  return `+62${clean}`;
}

export const CANDIDATES_COLLECTION = 'candidates';

const LEGACY_STATUS_MAP: Record<string, ApplicationStatus> = {
  new: 'APPLIED',
  applied: 'APPLIED',
  screening: 'SCREENING',
  interview: 'INTERVIEW',
  offering: 'OFFERING',
  contract: 'CONTRACT',
  hired: 'HIRED',
  rejected: 'REJECTED',
  terminated: 'TERMINATED',
  resigned: 'RESIGNED',
};

export function normalizeApplicationStatus(status: unknown): ApplicationStatus {
  if (typeof status !== 'string' || !status.trim()) return 'APPLIED';
  const key = status.trim().toLowerCase();
  if (LEGACY_STATUS_MAP[key]) return LEGACY_STATUS_MAP[key];
  const upper = status.trim().toUpperCase() as ApplicationStatus;
  const valid: ApplicationStatus[] = [
    'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERING', 'CONTRACT', 'HIRED', 'REJECTED', 'TERMINATED', 'RESIGNED',
  ];
  return valid.includes(upper) ? upper : 'APPLIED';
}

export function inferCandidateSource(doc: Record<string, unknown>): string {
  if (typeof doc.source === 'string' && doc.source.trim()) return doc.source.trim();
  if (doc.aiInterview) return 'ai-sara';
  return 'manual';
}

/** Map legacy employees collection document → candidates collection shape. */
export function mapLegacyEmployeeToCandidate(
  doc: Record<string, unknown>,
  id: string
): Record<string, unknown> {
  const addressLine =
    (typeof doc.addressLine === 'string' && doc.addressLine) ||
    (typeof doc.domicileAddress === 'string' && doc.domicileAddress) ||
    '';

  const domicileAddress =
    (typeof doc.domicileAddress === 'string' && doc.domicileAddress) || addressLine;

  const willingToRelocate =
    typeof doc.willingToRelocate === 'boolean'
      ? doc.willingToRelocate
      : doc.willingToRelocate != null
        ? !['tidak', 'no', 'false', '0'].includes(String(doc.willingToRelocate).toLowerCase())
        : true;

  const mapped: Record<string, unknown> = {
    ...doc,
    id,
    positionApplied:
      doc.positionApplied || doc.position || 'Staff Operasional',
    addressLine,
    domicileAddress,
    willingToRelocate,
    email: typeof doc.email === 'string' ? doc.email.toLowerCase() : doc.email,
    whatsappNumber: ensurePlus62(
      (doc.whatsappNumber as string | undefined) || (doc.whatsapp as string | undefined)
    ),
    emergencyPhone: ensurePlus62(doc.emergencyPhone as string | undefined) || '-',
    status: normalizeApplicationStatus(doc.status),
    source: inferCandidateSource(doc),
    createdAt:
      typeof doc.createdAt === 'string'
        ? doc.createdAt
        : new Date().toISOString(),
  };

  if (mapped.graduationYear != null) {
    mapped.graduationYear = Number(mapped.graduationYear) || new Date().getFullYear();
  }

  return mapped;
}

/** Normalize Firestore candidate doc for frontend (Employee type). */
export function normalizeCandidateFromFirestore(raw: Record<string, unknown>): Employee {
  const id = String(raw.id ?? '');
  const mapped = mapLegacyEmployeeToCandidate(raw, id);
  return mapped as unknown as Employee;
}

/** Prepare candidate payload for Firestore write. */
export function prepareCandidateForFirestore(
  data: Partial<Employee> | NewEmployee,
  options?: { id?: string; source?: string }
): Record<string, unknown> {
  const id = options?.id || (data as Employee).id || Math.random().toString(36).substring(2, 11);
  const addressLine =
    (data as Record<string, unknown>).addressLine as string | undefined ||
    data.domicileAddress ||
    '';

  const record: Record<string, unknown> = {
    ...data,
    id,
    addressLine,
    domicileAddress: data.domicileAddress || addressLine,
    email: (data.email || '').toLowerCase(),
    whatsappNumber: ensurePlus62(data.whatsappNumber),
    emergencyPhone: ensurePlus62(data.emergencyPhone) || '-',
    status: normalizeApplicationStatus((data as Employee).status ?? 'APPLIED'),
    source: options?.source || inferCandidateSource(data as Record<string, unknown>),
    createdAt: (data as Employee).createdAt || new Date().toISOString(),
  };

  return record;
}