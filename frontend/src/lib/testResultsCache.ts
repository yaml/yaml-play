const CACHE_KEY_PREFIX = 'yaml-play-test-results-';

export interface TestResultEntry {
  testId: string;
  passed: boolean;
}

export interface TestResultCache {
  parserVersion: string;
  testSuiteVersion: string;
  results: TestResultEntry[];
  elapsedTime?: number; // milliseconds
}

export function getCachedResults(parserId: string): TestResultCache | null {
  try {
    const key = CACHE_KEY_PREFIX + parserId;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as TestResultCache;
  } catch {
    return null;
  }
}

export function setCachedResults(parserId: string, cache: TestResultCache): void {
  try {
    const key = CACHE_KEY_PREFIX + parserId;
    localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

export function clearCachedResults(parserId: string): void {
  try {
    const key = CACHE_KEY_PREFIX + parserId;
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

export function isCacheValid(
  cache: TestResultCache | null,
  parserVersion: string,
  testSuiteVersion: string
): boolean {
  if (!cache) return false;
  return (
    cache.parserVersion === parserVersion &&
    cache.testSuiteVersion === testSuiteVersion
  );
}

export function clearAllTestCaches(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch {
    // Ignore errors
  }
}

export interface CachedParserResult {
  parserId: string;
  cache: TestResultCache;
}

export function getAllCachedResults(): CachedParserResult[] {
  const results: CachedParserResult[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        const parserId = key.substring(CACHE_KEY_PREFIX.length);
        const data = localStorage.getItem(key);
        if (data) {
          const cache = JSON.parse(data) as TestResultCache;
          results.push({ parserId, cache });
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return results;
}

export function getCachedResultsCount(): number {
  let count = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_KEY_PREFIX)) {
        count++;
      }
    }
  } catch {
    // Ignore errors
  }
  return count;
}
