const { getDb, applyCors, toStatus } = require('../../_helpers/firebase');

module.exports = async function handler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const collection = Array.isArray(req.query?.collection)
    ? req.query.collection[0]
    : req.query?.collection;
  const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;

  if (!collection || typeof collection !== 'string' || !id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Collection and document id required' });
  }

  try {
    const db = getDb();
    const ref = db.collection(collection).doc(id);

    if (req.method === 'POST') {
      await ref.set(req.body || {});
      return res.status(200).json({ success: true, id });
    }

    if (req.method === 'PUT') {
      await ref.update(req.body || {});
      return res.status(200).json({ success: true, id });
    }

    if (req.method === 'DELETE') {
      await ref.delete();
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error(`${req.method} /api/db/${collection}/${id} error:`, error);
    const status = toStatus(error);
    const payload = { error: error?.message || 'Database operation failed' };
    if (error?.missing) payload.missing = error.missing;
    return res.status(status).json(payload);
  }
};