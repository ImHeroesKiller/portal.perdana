/**
 * Permanent employee records (ERP / payroll) — `employees` collection only.
 * Recruitment applicants use candidateService → `candidates` collection.
 */
import type { Employee } from '../../types';
import { toTitleCase } from '../utils';
import { invalidateDbQuery } from '../../lib/invalidate-queries';
import {
  normalizeCandidateFromFirestore,
  prepareCandidateForFirestore,
  ensurePlus62,
} from '../../lib/candidate-record';
import { cleanDoc } from '../lib/doc-utils';
import { deleteDocument, fetchCollection, writeDocument } from './api-client';

export const EMPLOYEES_COLLECTION = 'employees';

function standardizeEmployee(data: Partial<Employee>): Partial<Employee> {
  const fields = [
    'fullName',
    'placeOfBirth',
    'domicileAddress',
    'institutionName',
    'major',
    'bankName',
    'emergencyName',
  ];
  const standardized = { ...data };
  for (const field of fields) {
    const value = standardized[field as keyof Employee];
    if (typeof value === 'string') {
      (standardized as Record<string, string>)[field] = toTitleCase(value);
    }
  }
  return standardized;
}

export async function getPermanentEmployees(): Promise<Employee[]> {
  const list = await fetchCollection<Record<string, unknown>>(EMPLOYEES_COLLECTION);
  const sorted = list.sort(
    (a, b) =>
      new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );
  return sorted.map((doc) => normalizeCandidateFromFirestore(doc));
}

export async function getActivePermanentEmployees(): Promise<Employee[]> {
  const employees = await getPermanentEmployees();
  const active = employees.filter(
    (e) => e.status === 'HIRED' || e.status === 'CONTRACT' || e.employmentStatus === 'ACTIVE'
  );
  return active.length > 0 ? active : employees;
}

export async function updatePermanentEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee> {
  const standardized = standardizeEmployee(updates);
  if (standardized.whatsappNumber) {
    standardized.whatsappNumber = ensurePlus62(standardized.whatsappNumber);
  }
  if (standardized.emergencyPhone) {
    standardized.emergencyPhone = ensurePlus62(standardized.emergencyPhone);
  }

  const payload = prepareCandidateForFirestore(
    { ...standardized, id, source: 'erp' },
    { id, source: 'erp' }
  );

  try {
    await writeDocument(EMPLOYEES_COLLECTION, id, cleanDoc(payload), 'PUT');
    invalidateDbQuery('permanentEmployees');
  } catch (error) {
    throw error instanceof Error ? error : new Error('Gagal memperbarui data karyawan');
  }

  return normalizeCandidateFromFirestore({ ...payload, id });
}

export async function deletePermanentEmployee(id: string): Promise<void> {
  await deleteDocument(EMPLOYEES_COLLECTION, id);
  invalidateDbQuery('permanentEmployees');
}