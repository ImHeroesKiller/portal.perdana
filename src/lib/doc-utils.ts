/** Strip undefined values — Firestore rejects undefined fields. */
export function cleanDoc(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(cleanDoc);
  const cleaned: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (val !== undefined) cleaned[key] = cleanDoc(val);
  }
  return cleaned;
}