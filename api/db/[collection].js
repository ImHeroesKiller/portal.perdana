import { firestore } from '../../lib/firebase-admin';
import { applyCors } from '../../lib/api-cors';

export default async function handler(req: any, res: any) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const collectionName = Array.isArray(req.query.collection) 
    ? req.query.collection[0] 
    : req.query.collection;

  if (!collectionName || typeof collectionName !== 'string') {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  try {
    const snapshot = await firestore.collection(collectionName).get();

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`[API] Fetched ${data.length} documents from collection: ${collectionName}`);

    return res.status(200).json(data);

  } catch (error: any) {
    console.error(`[API Error] Failed to fetch collection '${collectionName}':`, error);

    return res.status(500).json({
      error: `Failed to fetch collection: ${collectionName}`,
      message: error.message || 'Unknown error',
      code: error.code
    });
  }
}
