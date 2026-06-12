import { BASE_RETRY_DELAY_MS, MAX_RETRY_DELAY_MS } from '@oftmp/shared';

export function calculateBackoffDelay(retryCount: number): number {
  const exponential = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
  const jitter = Math.random() * 500;
  return Math.min(exponential + jitter, MAX_RETRY_DELAY_MS);
}

export function getNextRetryTimestamp(retryCount: number): number {
  return Date.now() + calculateBackoffDelay(retryCount);
}

export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

export function isNonRetryableStatus(status: number): boolean {
  return [400, 401, 403, 404, 422].includes(status);
}
