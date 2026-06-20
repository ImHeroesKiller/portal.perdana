import { guardApi } from '../../../lib/api-cors';
import { RATE_LIMITS } from '../../../lib/api-rate-limit';
import { seedAllCollections } from '../../../lib/db-api';
import { formatFirebaseError, toHttpStatus } from '../../../lib/firebase-errors';

export default async function handler(req: any, res: any) {
  if (
    !guardApi(req, res, {
      rateLimit: RATE_LIMITS.seed,
      requireOrigin: true,
      requireAdmin: true,
    })
  ) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await seedAllCollections(req.body ?? {});
    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully from server-side batch!',
    });
  } catch (error: unknown) {
    console.error('POST /api/db/seed/all error:', error);
    return res.status(toHttpStatus(error)).json({
      error: formatFirebaseError(error) || 'Failed server-side seeding batch write',
    });
  }
}