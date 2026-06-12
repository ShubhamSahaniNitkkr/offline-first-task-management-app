import type { CorsOptions } from 'cors';

/** Accept comma-separated origins; ignore trailing-slash mismatches. */
export function buildCorsOptions(corsOrigin: string): CorsOptions {
  const allowed = corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      if (allowed.includes(normalized)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  };
}
