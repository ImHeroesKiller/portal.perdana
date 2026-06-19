import { applyCors, handleOptions } from '../../../lib/api-cors';
import { applyNoStoreHeaders } from '../../../lib/api-cache';
import { setDocument, updateDocument, deleteDocument } from '../../../lib/db-api';
import { formatFirebaseError, toHttpStatus } from '../../../lib/firebase-errors';

export default async function handler(req: any, res: any) {
  applyCors(res);
  applyNoStoreHeaders(res);
  if (handleOptions(req, res)) return;

  const { collection, id } = req.query;

  if (!collection || typeof collection !== 'string' || !id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Collection and document id required' });
  }

  try {
    if (req.method === 'POST') {
      const result = await setDocument(collection, id, req.body ?? {});
      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === 'PUT') {
      const result = await updateDocument(collection, id, req.body ?? {});
      return res.status(200).json({ success: true, ...result });
    }

    if (req.method === 'DELETE') {
      const result = await deleteDocument(collection, id);
      return res.status(200).json({ success: true, ...result });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error(`${req.method} /api/db/${collection}/${id} error:`, error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || 'Database operation failed',
    });
  }
}