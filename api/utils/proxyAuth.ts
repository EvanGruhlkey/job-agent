import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getInternalKeyHeader } from './internalKey';

/** Reject unauthenticated callers before hitting the Railway backend. */
export function rejectUnlessAuthorized(req: VercelRequest, res: VercelResponse): boolean {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Unauthorized' });
    return false;
  }
  return true;
}

/** Headers for an authenticated upstream proxy request. */
export function buildAuthenticatedProxyHeaders(
  req: VercelRequest,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: req.headers.authorization!,
    ...getInternalKeyHeader(),
    ...extra,
  };
}
