import type { Employee, NewEmployee } from '../../types';
import { toTitleCase } from '../utils';
import { invalidateDbQuery } from '../../lib/invalidate-queries';
import {
  CANDIDATES_COLLECTION,
  normalizeCandidateFromFirestore,
  prepareCandidateForFirestore,
  ensurePlus62,
} from '../../lib/candidate-record';
import { getCompanySettings } from '../../services/companySettings';
import { cleanDoc } from '../lib/doc-utils';
import { deleteDocument, fetchCollection, writeDocument } from './api-client';

export { CANDIDATES_COLLECTION };

function standardizeCandidate(data: Partial<Employee>): Partial<Employee> {
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

export type GetCandidatesOptions = {
  forceRefresh?: boolean;
};

export async function getCandidates(options?: GetCandidatesOptions): Promise<Employee[]> {
  console.log(`[candidateService] getCandidates → collection "${CANDIDATES_COLLECTION}"`, options);
  const list = await fetchCollection<Record<string, unknown>>(CANDIDATES_COLLECTION, {
    forceRefresh: options?.forceRefresh,
  });
  const sorted = list.sort(
    (a, b) =>
      new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );
  const normalized = sorted.map((doc) => normalizeCandidateFromFirestore(doc));
  console.log(`[candidateService] loaded ${normalized.length} candidates from "${CANDIDATES_COLLECTION}"`);
  return normalized;
}

export async function createCandidate(
  data: NewEmployee,
  source: 'manual' | 'ai-sara' | 'api-submit' | string = 'manual'
): Promise<Employee> {
  const id = Math.random().toString(36).substring(2, 11);
  const standardized = standardizeCandidate({ ...data, status: 'APPLIED' }) as Partial<Employee>;

  if (standardized.whatsappNumber) {
    standardized.whatsappNumber = ensurePlus62(standardized.whatsappNumber);
  }
  if (standardized.emergencyPhone) {
    standardized.emergencyPhone = ensurePlus62(standardized.emergencyPhone);
  }

  const prepared = prepareCandidateForFirestore(standardized as NewEmployee, { id, source });
  let finalCandidate = normalizeCandidateFromFirestore(prepared);

  try {
    const gwSettings = getCompanySettings().googleWorkspace;
    if (gwSettings?.enabled && gwSettings.webAppUrl) {
      const payload = {
        ...finalCandidate,
        applicationLetterFile: finalCandidate.applicationLetterPath,
        cvFile: finalCandidate.cvPath,
        ktpFile: finalCandidate.ktpPath,
        diplomaFile: finalCandidate.diplomaPath,
        photoFile: finalCandidate.photoPath,
        kkFile: finalCandidate.kkPath,
        certificateFile: finalCandidate.certificatePath,
        folderId: gwSettings.folderId,
      };

      const res = await fetch(gwSettings.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result?.status === 'success' && result.files) {
          finalCandidate = {
            ...finalCandidate,
            applicationLetterPath: result.files.applicationLetter || finalCandidate.applicationLetterPath,
            cvPath: result.files.cv || finalCandidate.cvPath,
            ktpPath: result.files.ktp || finalCandidate.ktpPath,
            diplomaPath: result.files.diploma || finalCandidate.diplomaPath,
            photoPath: result.files.photo || finalCandidate.photoPath,
            kkPath: result.files.kk || finalCandidate.kkPath,
            certificatePath: result.files.certificate || finalCandidate.certificatePath,
          };
        }
      }
    }
  } catch (err) {
    console.error('Google Workspace sync failed:', err);
  }

  try {
    await writeDocument(CANDIDATES_COLLECTION, id, cleanDoc(finalCandidate), 'POST');
    invalidateDbQuery('candidates');
    return finalCandidate;
  } catch (error) {
    console.warn('createCandidate failed:', error);
    try {
      const local = localStorage.getItem('local_candidates');
      const list = local ? JSON.parse(local) : [];
      list.push(finalCandidate);
      localStorage.setItem('local_candidates', JSON.stringify(list));
    } catch {
      /* ignore */
    }
    invalidateDbQuery('candidates');
    throw error instanceof Error ? error : new Error('Gagal menyimpan kandidat');
  }
}

export async function updateCandidate(id: string, updates: Partial<Employee>): Promise<Employee> {
  const standardized = standardizeCandidate(updates);
  if (standardized.whatsappNumber) {
    standardized.whatsappNumber = ensurePlus62(standardized.whatsappNumber);
  }
  if (standardized.emergencyPhone) {
    standardized.emergencyPhone = ensurePlus62(standardized.emergencyPhone);
  }

  const payload = prepareCandidateForFirestore({ ...standardized, id } as Partial<Employee>, { id });

  try {
    await writeDocument(CANDIDATES_COLLECTION, id, cleanDoc(payload), 'PUT');
    invalidateDbQuery('candidates');
  } catch (error) {
    console.warn('updateCandidate failed:', error);
    throw error instanceof Error ? error : new Error('Gagal memperbarui kandidat');
  }

  return normalizeCandidateFromFirestore({ ...payload, id });
}

export async function deleteCandidate(id: string): Promise<void> {
  try {
    await deleteDocument(CANDIDATES_COLLECTION, id);
    invalidateDbQuery('candidates');
  } catch (error) {
    console.warn('deleteCandidate failed:', error);
    throw error instanceof Error ? error : new Error('Gagal menghapus kandidat');
  }
}