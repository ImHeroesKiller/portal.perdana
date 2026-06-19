import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb, isAdminConfigured } from './firebase-admin';
import { FirebaseConfigError, FirebaseConnectionError } from './firebase-errors';
import { docToPlainObject } from './firestore-serialize';
import { JOBS_COLLECTION } from './job-record';

export async function getAdminDbOrThrow(): Promise<Firestore> {
  if (!isAdminConfigured()) {
    throw new FirebaseConfigError(
      'Firebase Admin belum dikonfigurasi di server.',
      ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
    );
  }
  return getAdminDb();
}

async function readCollectionDocs(
  db: Firestore,
  collection: string
): Promise<Record<string, unknown>[]> {
  const snap = await db.collection(collection).get();
  return snap.docs.map((doc) => docToPlainObject(doc.id, doc.data() as Record<string, unknown>));
}

export async function listCollection(collection: string): Promise<Record<string, unknown>[]> {
  const db = await getAdminDbOrThrow();
  try {
    return await readCollectionDocs(db, collection);
  } catch (error) {
    if (error instanceof FirebaseConfigError || error instanceof FirebaseConnectionError) {
      throw error;
    }
    throw new FirebaseConnectionError(
      `Gagal membaca collection "${collection}" dari Firestore.`,
      error
    );
  }
}

/** Read jobs from the `jobs` collection with stable ordering for the frontend. */
export async function listJobs(): Promise<Record<string, unknown>[]> {
  const db = await getAdminDbOrThrow();
  try {
    const snap = await db.collection(JOBS_COLLECTION).orderBy('createdAt', 'desc').get();
    return snap.docs.map((doc) => docToPlainObject(doc.id, doc.data() as Record<string, unknown>));
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('index') || message.includes('order')) {
      try {
        return await readCollectionDocs(db, JOBS_COLLECTION);
      } catch (fallbackError) {
        throw new FirebaseConnectionError(
          'Gagal membaca collection "jobs" dari Firestore.',
          fallbackError
        );
      }
    }
    if (error instanceof FirebaseConfigError || error instanceof FirebaseConnectionError) {
      throw error;
    }
    throw new FirebaseConnectionError('Gagal membaca collection "jobs" dari Firestore.', error);
  }
}

export async function setDocument(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ id: string }> {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).set(data);
  return { id };
}

export async function updateDocument(
  collection: string,
  id: string,
  updates: Record<string, unknown>
): Promise<{ id: string }> {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).update(updates);
  return { id };
}

export async function deleteDocument(collection: string, id: string): Promise<{ id: string }> {
  const db = await getAdminDbOrThrow();
  await db.collection(collection).doc(id).delete();
  return { id };
}

export async function seedAllCollections(body: {
  clients?: unknown[];
  projects?: unknown[];
  jobs?: unknown[];
  candidates?: unknown[];
  /** @deprecated Use candidates */
  employees?: unknown[];
}): Promise<void> {
  const db = await getAdminDbOrThrow();
  const batch = db.batch();

  if (Array.isArray(body.clients)) {
    for (const cli of body.clients as { id: string }[]) {
      batch.set(db.collection('clients').doc(cli.id), cli);
    }
  }
  if (Array.isArray(body.projects)) {
    for (const prj of body.projects as { id: string }[]) {
      batch.set(db.collection('projects').doc(prj.id), prj);
    }
  }
  if (Array.isArray(body.jobs)) {
    for (const job of body.jobs as { id: string }[]) {
      batch.set(db.collection('jobs').doc(job.id), job);
    }
  }
  const candidateRows = body.candidates ?? body.employees;
  if (Array.isArray(candidateRows)) {
    for (const row of candidateRows as { id: string }[]) {
      batch.set(db.collection('candidates').doc(row.id), row);
    }
  }

  await batch.commit();
}