import { Request, Response, NextFunction } from 'express';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.lastAccessedAt = Date.now();
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      lastAccessedAt: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(`:${prefix}`) || key.includes(`/${prefix}`)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccessTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        return;
      }
      if (entry.lastAccessedAt < oldestAccessTime) {
        oldestAccessTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Express middleware that serves cached responses and caches 200 responses
   */
  middleware(ttlSeconds: number, keyPrefix?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only cache safe GET and HEAD requests
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }

      const prefix = keyPrefix ? `${keyPrefix}:` : '';
      const normalizedUrl = req.originalUrl || req.url;
      const cacheKey = `${prefix}${normalizedUrl}`;

      const cached = this.get(cacheKey);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
        return res.json(cached);
      }

      // Intercept res.json to capture response
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, ttlSeconds);
          res.setHeader('X-Cache', 'MISS');
          res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

export const appCache = new MemoryCache(200);
export default appCache;
