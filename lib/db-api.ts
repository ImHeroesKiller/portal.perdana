import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb, isAdminConfigured } from './firebase-admin';

export async function getAdminDbOrThrow(): Promise<Firestore> {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin belum dikonfigurasi di server.');
  }
  return getAdminDb();
}

export async function listCollection(collection: string): Promise<Record<string, unknown>[]> {
  const db = await getAdminDbOrThrow();
  const snap = await db.collection(collection).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  if (Array.isArray(body.employees)) {
    for (const emp of body.employees as { id: string }[]) {
      batch.set(db.collection('employees').doc(emp.id), emp);
    }
  }

  await batch.commit();
}