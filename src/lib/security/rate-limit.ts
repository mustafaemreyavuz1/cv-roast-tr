export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface BucketEntry {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, BucketEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private lastCleanup = Date.now();

  constructor(config?: Partial<RateLimitConfig>) {
    const envMax = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
    const envWindow = Number(process.env.RATE_LIMIT_WINDOW_MS);

    this.maxRequests =
      config?.maxRequests ?? (Number.isFinite(envMax) && envMax > 0 ? envMax : 10);
    this.windowMs =
      config?.windowMs ?? (Number.isFinite(envWindow) && envWindow >= 1000 ? envWindow : 60_000);
  }

  public check(key: string, now = Date.now()): RateLimitResult {
    this.maybeCleanup(now);

    const windowStart = now - this.windowMs;
    const entry = this.buckets.get(key) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= this.maxRequests) {
      const oldestInWindow = entry.timestamps[0] ?? now;
      const retryAfterMs = Math.max(1000, oldestInWindow + this.windowMs - now);
      this.buckets.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      };
    }

    entry.timestamps.push(now);
    this.buckets.set(key, entry);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - entry.timestamps.length),
      retryAfterSeconds: 0,
    };
  }

  public reset(): void {
    this.buckets.clear();
  }

  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < this.windowMs) {
      return;
    }
    this.lastCleanup = now;
    const windowStart = now - this.windowMs;

    for (const [key, entry] of this.buckets.entries()) {
      const active = entry.timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        this.buckets.delete(key);
      } else {
        entry.timestamps = active;
      }
    }
  }
}

export const defaultRateLimiter = new InMemoryRateLimiter();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}
