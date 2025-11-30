export interface TestCase {
  id: string;
  name: string;
  error: boolean;
  yaml: string;
  expected: string;
}

export interface TestSuiteData {
  version: string;
  tests: TestCase[];
}

let cachedData: TestSuiteData | null = null;
let loadPromise: Promise<TestSuiteData> | null = null;

export async function loadTestSuite(): Promise<TestSuiteData> {
  if (cachedData) return cachedData;

  if (!loadPromise) {
    loadPromise = (async () => {
      const response = await fetch('/testsuite/tests.json');
      if (!response.ok) {
        throw new Error(`Failed to load test suite: ${response.status}`);
      }
      cachedData = await response.json();
      return cachedData!;
    })();
  }

  return loadPromise;
}
