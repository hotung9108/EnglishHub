interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  /**
   * Retrieves data from the cache if present and not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Stores data into cache with a specific time-to-live (TTL in ms). Default: 30 seconds.
   */
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    if (ttlMs <= 0) return;
    this.cache.set(key, { data, expiry: Date.now() + ttlMs });
  }

  /**
   * Deduplicates concurrent identical requests.
   * If a request with the same key is already in-flight, returns that pending promise.
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Checks if an unexpired cache entry exists for a given key.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Removes cached entries matching a pattern, or clears all cache if no pattern is provided.
   */
  invalidate(pattern?: RegExp | string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Returns current count of entries in cache (including unexpired).
   */
  size(): number {
    return this.cache.size;
  }
}

// Global shared singleton cache instance
export const apiCache = new ApiCache();
