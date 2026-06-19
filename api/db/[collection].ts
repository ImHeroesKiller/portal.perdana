import { applyCors, handleOptions } from '../../lib/api-cors';
import { applyNoStoreHeaders } from '../../lib/api-cache';
import { listCollection } from '../../lib/db-api';
import { formatFirebaseError, toHttpStatus } from '../../lib/firebase-errors';

export default async function handler(req: any, res: any) {
  applyCors(res);
  applyNoStoreHeaders(res);
  if (handleOptions(req, res)) return;

  const { collection } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' });
  }

  try {
    const list = await listCollection(collection);
    return res.status(200).json(list);
  } catch (error: unknown) {
    console.error(`GET /api/db/${collection} error:`, error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || 'Failed to fetch collection',
    });
  }
}