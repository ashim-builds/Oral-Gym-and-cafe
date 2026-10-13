import AsyncStorage from '@react-native-async-storage/async-storage';

class SwrCache {
  private memoryMap = new Map<string, any>();

  /**
   * Synchronously read from memory or Web sessionStorage for instant 0ms hydration
   */
  get<T>(key: string): T | null {
    // 1. Check in-memory map
    if (this.memoryMap.has(key)) {
      return this.memoryMap.get(key) as T;
    }

    // 2. Check window.sessionStorage in web browser
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const raw = window.sessionStorage.getItem(`swr:${key}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryMap.set(key, parsed);
          return parsed as T;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Save to memory and sessionStorage (and background AsyncStorage)
   */
  set<T>(key: string, data: T): void {
    this.memoryMap.set(key, data);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`swr:${key}`, JSON.stringify(data));
      } catch {}
    }

    // Background sync to AsyncStorage for native mobile continuity
    AsyncStorage.setItem(`swr:${key}`, JSON.stringify(data)).catch(() => {});
  }

  delete(key: string): void {
    this.memoryMap.delete(key);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(`swr:${key}`);
      } catch {}
    }
    AsyncStorage.removeItem(`swr:${key}`).catch(() => {});
  }

  clear(): void {
    this.memoryMap.clear();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith('swr:')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      } catch {}
    }
  }

  /**
   * Stale-While-Revalidate execution helper:
   * 1. Returns cached copy immediately if found (0ms)
   * 2. Silently executes network fetch in background to sync fresh data
   */
  async execute<T>(
    key: string,
    fetcher: () => Promise<T>,
    onData: (data: T, isFromCache: boolean) => void
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      onData(cached, true);
    }

    try {
      const fresh = await fetcher();
      this.set(key, fresh);
      onData(fresh, false);
      return fresh;
    } catch (err) {
      // If network fails but we had cached data, do not break the UI
      if (cached !== null) {
        return cached;
      }
      throw err;
    }
  }
}

export const swrCache = new SwrCache();
export default swrCache;
