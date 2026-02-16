const CACHE_PREFIX = 'ashoka_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const sessionCache = {
  set: (key, data) => {
    try {
      // Validate key to prevent path traversal
      if (!key || typeof key !== 'string' || /[^a-zA-Z0-9_-]/.test(key)) {
        console.error('Invalid cache key');
        return;
      }
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },
  
  get: (key) => {
    try {
      // Validate key to prevent path traversal
      if (!key || typeof key !== 'string' || /[^a-zA-Z0-9_-]/.test(key)) {
        console.error('Invalid cache key');
        return null;
      }
      const cached = sessionStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      if (!parsed || typeof parsed !== 'object' || !parsed.hasOwnProperty('data') || !parsed.hasOwnProperty('timestamp')) {
        sessionStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      const { data, timestamp } = parsed;
      if (Date.now() - timestamp > CACHE_DURATION) {
        sessionStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  remove: (key) => {
    // Validate key to prevent path traversal
    if (!key || typeof key !== 'string' || /[^a-zA-Z0-9_-]/.test(key)) {
      console.error('Invalid cache key');
      return;
    }
    sessionStorage.removeItem(CACHE_PREFIX + key);
  },
  
  clear: () => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  },
  
  // Check if data exists and is valid
  has: (key) => {
    return sessionCache.get(key) !== null;
  },
  
  // Invalidate cache entries matching a pattern
  invalidatePattern: (pattern) => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX) && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};