/** Convert Firestore field values to JSON-safe primitives for API responses. */
export function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serializeFirestoreValue);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('_seconds' in obj && '_nanoseconds' in obj) {
      const ms = Number(obj._seconds) * 1000 + Number(obj._nanoseconds) / 1_000_000;
      return new Date(ms).toISOString();
    }
    if (typeof (obj as { toDate?: () => Date }).toDate === 'function') {
      return (obj as { toDate: () => Date }).toDate().toISOString();
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = serializeFirestoreValue(val);
    }
    return result;
  }
  return value;
}

export function docToPlainObject(
  id: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  const serialized = serializeFirestoreValue(data) as Record<string, unknown>;
  return { id, ...serialized };
}