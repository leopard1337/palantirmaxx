const BASE_URL = 'https://api.glint.trade';

const BEARER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGVmMjliZGItMjUzOC00NDI0LTk3NmUtMzUwODAzYmYxYTM2IiwiZXhwIjoxNzczMDE0NTAxLCJpYXQiOjE3NzI0MDk3MDF9.ACalhz5aTTOKUssltyI7uZLN3ygmkAnBceJGEmMRlso';

const getToken = () => BEARER_TOKEN;

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
  const search = params ? new URLSearchParams(params).toString() : '';
  const url = `${BASE_URL}${path}${search ? `?${search}` : ''}`;

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

  const token = getToken();
  const promise = fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${token}`,
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
