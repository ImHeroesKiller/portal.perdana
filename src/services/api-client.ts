import { FETCH_NO_STORE_INIT, withCacheBust } from '../../lib/api-cache';

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
  missing?: string[];
};

function buildUserMessage(
  status: number,
  collection: string,
  body: ApiErrorBody | null,
  fallback: string
): string {
  const detail = (body?.message || body?.error || '').trim();

  if (status === 503) {
    const missingHint =
      body?.missing && body.missing.length > 0
        ? ` Variabel server belum diset: ${body.missing.join(', ')}.`
        : '';
    return (
      detail ||
      `Layanan database sementara tidak tersedia. Data ${collection} tidak dapat dimuat.${missingHint}`
    );
  }

  if (status === 500) {
    return (
      detail ||
      `Server mengalami gangguan saat memuat data ${collection}. Silakan coba lagi dalam beberapa saat.`
    );
  }

  if (status === 403) {
    return detail || `Akses ke data ${collection} ditolak. Hubungi administrator.`;
  }

  if (status === 404) {
    return detail || `Endpoint data ${collection} tidak ditemukan.`;
  }

  return detail || fallback;
}

async function parseApiError(
  res: Response,
  collection: string,
  context: 'read' | 'write' | 'delete' = 'read'
): Promise<Error> {
  const actionLabel =
    context === 'read' ? 'mengambil' : context === 'write' ? 'menyimpan' : 'menghapus';
  const fallback = `Gagal ${actionLabel} data ${collection} dari server (HTTP ${res.status})`;

  let body: ApiErrorBody | null = null;
  let rawText = '';

  try {
    rawText = await res.text();
    if (rawText) {
      const parsed = JSON.parse(rawText) as unknown;
      if (parsed && typeof parsed === 'object') {
        body = parsed as ApiErrorBody;
      }
    }
  } catch {
    /* body bukan JSON */
  }

  const userMessage = buildUserMessage(res.status, collection, body, fallback);

  console.error(`[api-client] ${collection} HTTP ${res.status}`, {
    userMessage,
    body,
    rawPreview: rawText.slice(0, 500),
  });

  const err = new Error(userMessage);
  Object.assign(err, {
    status: res.status,
    code: body?.code,
    missing: body?.missing,
  });
  return err;
}

function parseCollectionPayload<T>(body: unknown, collection: string): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data;
  }
  if (body && typeof body === 'object' && 'error' in body) {
    const msg = String((body as ApiErrorBody).message || (body as ApiErrorBody).error || '');
    throw new Error(
      msg || `Server mengembalikan error untuk ${collection}, bukan daftar data.`
    );
  }
  throw new Error(`Format respons ${collection} tidak valid dari server — diharapkan array JSON.`);
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

  let res: Response;
  try {
    res = await fetch(url, FETCH_NO_STORE_INIT);
  } catch (networkError) {
    const message =
      networkError instanceof Error
        ? networkError.message
        : 'Koneksi ke server gagal.';
    console.error(`[api-client] ${collection} network error`, networkError);
    throw new Error(
      `Tidak dapat terhubung ke server untuk memuat data ${collection}. ${message}`
    );
  }

  if (!res.ok) {
    throw await parseApiError(res, collection, 'read');
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error(
      `Respons data ${collection} dari server bukan JSON yang valid. Silakan coba lagi.`
    );
  }

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
    throw await parseApiError(res, `${collection}/${id}`, 'write');
  }
}

export async function deleteDocument(collection: string, id: string): Promise<void> {
  const res = await fetch(`/api/db/${collection}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw await parseApiError(res, `${collection}/${id}`, 'delete');
  }
}