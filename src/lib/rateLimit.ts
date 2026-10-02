import { isCloudStoreConfigured, upstash } from '@/lib/store';

/**
 * Failed-login limiter. Counts failures per key inside a fixed window.
 * Uses Upstash when configured (shared across serverless instances),
 * otherwise an in-memory map (local development).
 */

const memoryCounters = new Map<string, { count: number; resetAt: number }>();

async function readCount(key: string): Promise<number> {
  if (isCloudStoreConfigured) {
    const result = await upstash(`get/${encodeURIComponent(key)}`);
    return Number(result) || 0;
  }
  const entry = memoryCounters.get(key);
  if (!entry || entry.resetAt < Date.now()) return 0;
  return entry.count;
}

async function increment(key: string, windowSeconds: number): Promise<void> {
  if (isCloudStoreConfigured) {
    const count = Number(await upstash(`incr/${encodeURIComponent(key)}`));
    if (count === 1) await upstash(`expire/${encodeURIComponent(key)}/${windowSeconds}`);
    return;
  }
  const entry = memoryCounters.get(key);
  if (!entry || entry.resetAt < Date.now()) {
    memoryCounters.set(key, { count: 1, resetAt: Date.now() + windowSeconds * 1000 });
  } else {
    entry.count += 1;
  }
}

export interface LoginLimit {
  key: string;
  maxFailures: number;
  windowSeconds: number;
}

/** Returns true if any of the given limits has been exceeded. */
export async function isLoginBlocked(limits: LoginLimit[]): Promise<boolean> {
  try {
    const counts = await Promise.all(limits.map((l) => readCount(`ratelimit:${l.key}`)));
    return counts.some((count, i) => count >= limits[i].maxFailures);
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return false;
  }
}

export async function recordLoginFailure(limits: LoginLimit[]): Promise<void> {
  try {
    await Promise.all(limits.map((l) => increment(`ratelimit:${l.key}`, l.windowSeconds)));
  } catch (err) {
    console.error('Rate limit record failed:', err);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}
