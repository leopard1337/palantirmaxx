import { getApiUrl } from './base-url';

const dedupeCache = new Map<string, Promise<Response>>();
const DEDUPE_MS = 100;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt = 1
): Promise<Response> {
  const maxAttempts = 3;
  const delays = [1000, 2000, 4000];

  try {
    const res = await fetch(url, options);

    if (res.status >= 500 && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delays[attempt - 1]));
      return fetchWithRetry(url, options, attempt + 1);
    }

    return res;
  } catch (err) {
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delays[attempt - 1]));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw err;
  }
}

export async function apiRequest<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = getApiUrl('/api/glint' + path, params);

  const cacheKey = url;
  const existing = dedupeCache.get(cacheKey);
  if (existing) {
    const res = await existing;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API error ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  const promise = fetchWithRetry(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  dedupeCache.set(cacheKey, promise);
  setTimeout(() => dedupeCache.delete(cacheKey), DEDUPE_MS);

  const res = await promise;

  if (res.status === 401) {
    throw new Error('Token expired or invalid. Please update GLINT_BEARER.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
