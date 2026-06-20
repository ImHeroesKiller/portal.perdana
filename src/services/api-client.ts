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

export type FetchCollectionOptions = {
  /** Tambah cache-bust ekstra — pakai saat force refresh dari UI */
  forceRefresh?: boolean;
};

export async function fetchCollection<T>(
  collection: string,
  options?: FetchCollectionOptions
): Promise<T[]> {
  const base = `/api/db/${collection}`;
  const url = options?.forceRefresh
    ? withCacheBust(`${base}?_force=${Date.now()}`)
    : withCacheBust(base);

  const started = performance.now();
  console.log(`[api-client] GET ${collection}`, { url, forceRefresh: Boolean(options?.forceRefresh) });

  const res = await fetch(url, FETCH_NO_STORE_INIT);
  if (!res.ok) {
    console.error(`[api-client] ${collection} failed`, { status: res.status, url });
    throw await parseApiError(
      res,
      `Gagal mengambil data ${collection} dari server (${res.status})`
    );
  }
  const body = await res.json();
  const rows = parseCollectionPayload<T>(body, collection);
  console.log(`[api-client] ${collection} ok`, {
    count: rows.length,
    ms: Math.round(performance.now() - started),
  });
  return rows;
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