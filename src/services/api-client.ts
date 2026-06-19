import { FETCH_NO_STORE_INIT, withCacheBust } from '../../lib/api-cache';

export async function fetchCollection<T>(collection: string): Promise<T[]> {
  const res = await fetch(withCacheBust(`/api/db/${collection}`), FETCH_NO_STORE_INIT);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data ${collection} dari server (${res.status})`);
  }
  return res.json() as Promise<T[]>;
}

export async function writeDocument(
  collection: string,
  id: string,
  data: unknown,
  method: 'POST' | 'PUT'
): Promise<void> {
  const res = await fetch(`/api/db/${collection}/${id}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Gagal menyimpan data ${collection}/${id} (${res.status})`);
  }
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
  const res = await fetch(`/api/db/${collection}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Gagal menghapus data ${collection}/${id} (${res.status})`);
  }
}