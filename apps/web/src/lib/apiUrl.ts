/**
 * Resolves the API base URL at runtime.
 * Render static sites bake env at build time — if PUBLIC_API_URL was missing,
 * we infer the API host from the frontend hostname (…-web → …-api on onrender.com).
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.PUBLIC_API_URL as string | undefined;

  if (fromEnv && !isLocalUrl(fromEnv)) {
    return normalizeBaseUrl(fromEnv);
  }

  if (typeof window !== 'undefined') {
    const meta = document.querySelector('meta[name="api-base-url"]');
    const metaUrl = meta?.getAttribute('content');
    if (metaUrl && !isLocalUrl(metaUrl)) {
      return normalizeBaseUrl(metaUrl);
    }

    const { hostname, protocol } = window.location;
    if (hostname.endsWith('.onrender.com') && hostname.includes('-web')) {
      const apiHost = hostname.replace('-web', '-api');
      return `${protocol}//${apiHost}/api/v1`;
    }
  }

  return normalizeBaseUrl(fromEnv ?? 'http://localhost:3001/api/v1');
}

function isLocalUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/.test(url);
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}
