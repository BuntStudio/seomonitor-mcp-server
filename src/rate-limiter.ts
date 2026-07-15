// Per-API-key token bucket. In-memory is sufficient: the server runs as a
// single stateless container, so there is no cross-instance state to share.
interface Bucket {
  tokens: number;
  lastRefill: number;
  lastUsed: number;
}

const SWEEP_INTERVAL_MS = 60_000;
const BUCKET_IDLE_TTL_MS = 10 * 60_000;

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private ratePerMinute: number;
  private burst: number;

  constructor(ratePerMinute: number, burst: number) {
    this.ratePerMinute = ratePerMinute;
    this.burst = burst;
    setInterval(() => this.sweep(), SWEEP_INTERVAL_MS).unref();
  }

  /**
   * Consume one token for the key. Returns 0 when allowed, otherwise the
   * number of seconds after which the caller should retry.
   */
  check(key: string): number {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.burst, lastRefill: now, lastUsed: now };
      this.buckets.set(key, bucket);
    }

    const elapsedMinutes = (now - bucket.lastRefill) / 60_000;
    bucket.tokens = Math.min(this.burst, bucket.tokens + elapsedMinutes * this.ratePerMinute);
    bucket.lastRefill = now;
    bucket.lastUsed = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return 0;
    }

    return Math.ceil(((1 - bucket.tokens) * 60) / this.ratePerMinute);
  }

  private sweep(): void {
    const cutoff = Date.now() - BUCKET_IDLE_TTL_MS;
    for (const [key, bucket] of this.buckets) {
      if (bucket.lastUsed < cutoff) {
        this.buckets.delete(key);
      }
    }
  }
}
