import { FETCH_NO_STORE_INIT, withCacheBust } from '../../lib/api-cache';

async function parseApiError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return new Error(body.error);
  } catch {
    /* response body bukan JSON */
  }
  return new Error(fallback);
}

function parseCollectionPayload<T>(body: unknown, collection: string): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data;
  }
  throw new Error(`Format respons ${collection} tidak valid dari server.`);
}

export async function fetchCollection<T>(collection: string): Promise<T[]> {
  const res = await fetch(withCacheBust(`/api/db/${collection}`), FETCH_NO_STORE_INIT);
  if (!res.ok) {
    throw await parseApiError(
      res,
      `Gagal mengambil data ${collection} dari server (${res.status})`
    );
  }
  const body = await res.json();
  return parseCollectionPayload<T>(body, collection);
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