// lib/validation-cache.ts
const validationCache = new Map<string, any>();

export function getValidationCacheKey(narrative: string, offense: any): string {
  const narrativeHash = narrative.substring(0, 100).replace(/\s+/g, '_');
  return `${offense.id}-${narrativeHash}-${Date.now()}`;
}

export function getCachedValidation(cacheKey: string) {
  return validationCache.get(cacheKey);
}

export function setCachedValidation(cacheKey: string, result: any) {
  // Cache for 5 minutes
  validationCache.set(cacheKey, result);
  setTimeout(() => {
    validationCache.delete(cacheKey);
  }, 5 * 60 * 1000);
}

export function clearExpiredCache() {
  // Optional: periodically clear expired cache
}