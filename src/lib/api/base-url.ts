/**
 * Resolves the app base URL for server-side fetches.
 * On Vercel: uses VERCEL_URL. Locally: localhost.
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  );
}

export function getApiUrl(path: string, params?: Record<string, string>): string {
  const base = getBaseUrl();
  const url = new URL(path, base);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}
