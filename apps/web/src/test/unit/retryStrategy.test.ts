import { describe, expect, it } from 'vitest';
import {
  calculateBackoffDelay,
  getNextRetryTimestamp,
  isNonRetryableStatus,
  isRetryableStatus,
} from '../../offline/sync/retryStrategy.js';

describe('retryStrategy', () => {
  it('calculates exponential backoff with cap', () => {
    const delay0 = calculateBackoffDelay(0);
    const delay4 = calculateBackoffDelay(4);

    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThan(2000);
    expect(delay4).toBeLessThanOrEqual(60500);
  });

  it('returns future timestamp for next retry', () => {
    const next = getNextRetryTimestamp(1);
    expect(next).toBeGreaterThan(Date.now());
  });

  it('identifies retryable HTTP statuses', () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
  });

  it('identifies non-retryable HTTP statuses', () => {
    expect(isNonRetryableStatus(401)).toBe(true);
    expect(isNonRetryableStatus(404)).toBe(true);
    expect(isNonRetryableStatus(500)).toBe(false);
  });
});
