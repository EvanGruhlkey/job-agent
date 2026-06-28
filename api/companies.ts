import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getBackendUrl } from './utils/backendUrl';
import { forwardResponse } from './utils/forwardResponse';
import {
  buildAuthenticatedProxyHeaders,
  rejectUnlessAuthorized,
} from './utils/proxyAuth';

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!rejectUnlessAuthorized(req, res)) return;

  const { path, ...queryParams } = req.query;

  const pathParts = Array.isArray(path) ? path : [path].filter(Boolean);
  const targetPath = pathParts.join('/');

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const queryString = params.size ? `?${params}` : '';

  const backendUrl = getBackendUrl(req);
  const targetUrl = `${backendUrl}/api/companies${targetPath ? `/${targetPath}` : ''}${queryString}`;

  const headers: Record<string, string> = buildAuthenticatedProxyHeaders(req, {
    'Content-Type': 'application/json',
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (METHODS_WITH_BODY.has(req.method ?? '') && req.body != null) {
    fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    await forwardResponse(response, res);
  } catch (error) {
    console.error('[api/companies] Upstream fetch failed:', error);
    res.status(502).json({
      error: 'Upstream backend unavailable',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
