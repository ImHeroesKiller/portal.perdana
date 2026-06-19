import { listCollection, listJobs } from '../../lib/db-api';
import { withApiHandler, sendApiError } from '../../lib/api-handler';
import { JOBS_COLLECTION, normalizeJobFromFirestore } from '../../lib/job-record';

async function handler(req: any, res: any) {
  const collection = Array.isArray(req.query?.collection)
    ? req.query.collection[0]
    : req.query?.collection;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!collection || typeof collection !== 'string') {
    return res.status(400).json({ error: 'Collection name required' });
  }

  try {
    if (collection === JOBS_COLLECTION) {
      const list = await listJobs();
      const jobs = list.map((doc) => normalizeJobFromFirestore(doc));
      return res.status(200).json(jobs);
    }

    const list = await listCollection(collection);
    return res.status(200).json(list);
  } catch (error: unknown) {
    sendApiError(res, error);
  }
}

export default withApiHandler(handler);