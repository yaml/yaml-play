import { useEffect, useState, useRef, useCallback } from 'react';
import { ParserInfo } from '../lib/types';
import { TestCase, loadTestSuite } from '../lib/testsuite';
import { runParser, SandboxResponse } from '../lib/sandbox';
import { runRefparse } from '../lib/refparse';
import { compareOutputs } from '../lib/normalize';
import {
  TestResultCache,
  TestResultEntry,
  getCachedResults,
  setCachedResults,
  clearCachedResults,
  isCacheValid,
} from '../lib/testResultsCache';

type TestSortColumn = 'ok' | 'id' | 'description';
type TestSortDirection = 'asc' | 'desc';

interface TestSortState {
  column: TestSortColumn;
  direction: TestSortDirection;
}

const TEST_SORT_STORAGE_KEY = 'yaml-play-test-sort';

function loadTestSortState(): TestSortState {
  try {
    const stored = localStorage.getItem(TEST_SORT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TestSortState;
    }
  } catch {
    // Ignore errors
  }
  return { column: 'id', direction: 'asc' };
}

function saveTestSortState(state: TestSortState): void {
  try {
    localStorage.setItem(TEST_SORT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parser: ParserInfo;
  onSelectTest: (yaml: string) => void;
  forceRerun?: boolean;
  onCompare?: () => void;
  onRunAgain?: () => void;
  onClearCache?: () => void;
}

interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  running?: boolean;
}

export function TestRunnerModal({
  isOpen,
  onClose,
  parser,
  onSelectTest,
  forceRerun = false,
  onCompare,
  onRunAgain,
  onClearCache,
}: TestRunnerModalProps) {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sortState, setSortState] = useState<TestSortState>(loadTestSortState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldRun, setShouldRun] = useState(false);
  const abortedRef = useRef(false);
  const runningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Reload sort state from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      setSortState(loadTestSortState());
      setMenuOpen(false);
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const sortResults = useCallback((data: TestResult[], state: TestSortState): TestResult[] => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (state.column) {
        case 'ok':
          cmp = (a.passed ? 1 : 0) - (b.passed ? 1 : 0);
          break;
        case 'id':
          cmp = a.testId.localeCompare(b.testId);
          break;
        case 'description':
          cmp = a.testName.localeCompare(b.testName);
          break;
      }
      return state.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, []);

  const handleSort = (column: TestSortColumn) => {
    const newState: TestSortState = {
      column,
      direction: sortState.column === column && sortState.direction === 'asc' ? 'desc' : 'asc',
    };
    setSortState(newState);
    saveTestSortState(newState);
  };

  const getSortIndicator = (column: TestSortColumn) => {
    if (sortState.column !== column) return null;
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Get sorted results (don't sort while running to preserve order)
  const sortedResults = isRunning ? results : sortResults(results, sortState);

  // Set up running state when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      runningRef.current = false;
      setShouldRun(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Reset state when opening
    abortedRef.current = false;
    setError(null);
    setResults([]);
    setElapsedTime(0);
    setTests([]);

    // Prevent multiple runs (but allow new runs after key change)
    if (runningRef.current) return;

    // Set running state synchronously so modal shows immediately
    runningRef.current = true;
    setIsRunning(true);
    setShouldRun(true);

    // Start timer (updates every 10ms for centiseconds)
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current);
    }, 10);

    return () => {
      abortedRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, parser.id, parser.version, forceRerun]);

  // Actually run tests (triggered by shouldRun changing to true)
  useEffect(() => {
    if (!shouldRun || !isOpen) return;
    setShouldRun(false); // Prevent running again

    const runAllTests = async () => {
      try {
        // Load test suite
        const data = await loadTestSuite();
        if (abortedRef.current) {
          setIsRunning(false);
          runningRef.current = false;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
        setTests(data.tests);

        // Check cache
        const cached = getCachedResults(parser.id);
        if (!forceRerun && isCacheValid(cached, parser.version, data.version)) {
          // Use cached results
          const cachedResults: TestResult[] = cached!.results.map((r) => {
            const test = data.tests.find((t) => t.id === r.testId);
            return {
              testId: r.testId,
              testName: test?.name || r.testId,
              passed: r.passed,
            };
          });
          setResults(cachedResults);
          setIsRunning(false);
          runningRef.current = false;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return;
        }

        // Clear cache if force rerun
        if (forceRerun) {
          clearCachedResults(parser.id);
        }

        // Run tests one by one
        const newResults: TestResultEntry[] = [];

        for (let i = 0; i < data.tests.length; i++) {
          if (abortedRef.current) break;

          const test = data.tests[i];

          // Show running state for this test
          setResults((prev) => [
            ...prev,
            { testId: test.id, testName: test.name, passed: false, running: true },
          ]);

          // Run the parser
          let response: SandboxResponse;
          if (parser.id === 'refparse') {
            const refResult = await runRefparse(test.yaml);
            response = { status: refResult.status, output: refResult.output };
          } else {
            response = await runParser(parser.id, test.yaml, parser.version);
          }

          if (abortedRef.current) break;

          // Determine pass/fail
          let passed: boolean;
          if (test.error) {
            // Error tests pass if parser fails (status != 0)
            passed = response.status !== 0;
          } else {
            // Normal tests pass if output matches expected
            passed =
              response.status === 0 &&
              compareOutputs(test.expected, response.output, parser.id);
          }

          // Update result (remove running state)
          setResults((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = {
                testId: test.id,
                testName: test.name,
                passed,
                running: false,
              };
            }
            return updated;
          });

          newResults.push({ testId: test.id, passed });

          // Auto-scroll to show latest result
          setTimeout(() => {
            if (resultsContainerRef.current) {
              resultsContainerRef.current.scrollTop =
                resultsContainerRef.current.scrollHeight;
            }
          }, 0);
        }

        // Save to cache if completed (not aborted)
        if (!abortedRef.current && newResults.length === data.tests.length) {
          const finalElapsedTime = Date.now() - startTimeRef.current;
          const cache: TestResultCache = {
            parserVersion: parser.version,
            testSuiteVersion: data.version,
            results: newResults,
            elapsedTime: finalElapsedTime,
          };
          setCachedResults(parser.id, cache);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRunning(false);
        runningRef.current = false;

        // Scroll to top when complete
        setTimeout(() => {
          if (resultsContainerRef.current) {
            resultsContainerRef.current.scrollTop = 0;
          }
        }, 0);
      }
    };

    runAllTests();
  }, [shouldRun, isOpen, parser.id, parser.version, forceRerun]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) {
          setMenuOpen(false);
        } else {
          abortedRef.current = true;
          onClose();
        }
      }
      // C for Compare Test Runs (only when not running)
      if (e.key.toUpperCase() === 'C' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isRunning && onCompare) {
          onClose();
          onCompare();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isRunning, onCompare, menuOpen]);

  const handleTestClick = (test: TestCase) => {
    abortedRef.current = true;
    onSelectTest(test.yaml);
    onClose();
  };

  const handleClose = () => {
    abortedRef.current = true;
    onClose();
  };

  if (!isOpen) return null;

  const passCount = results.filter((r) => r.passed && !r.running).length;
  const failCount = results.filter((r) => !r.passed && !r.running).length;
  const totalTests = tests.length;
  const progress = totalTests > 0 ? Math.round((results.length / totalTests) * 100) : 0;
  const passPercent = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : '0.0';

  // Format elapsed time as seconds.centiseconds (e.g., "12.34s")
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {parser.name} - Test Suite
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Status bar */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
          <span className="text-green-600 dark:text-green-400">Pass: {passCount}</span>
          <span className="text-red-600 dark:text-red-400">Fail: {failCount}</span>
          <span className="text-gray-500 dark:text-gray-400">Total: {totalTests}</span>
          {isRunning ? (
            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
              {formatTime(elapsedTime)} ({progress}%)
            </span>
          ) : elapsedTime > 0 ? (
            <span className="text-gray-500">
              {passPercent}% passing ({formatTime(elapsedTime)})
            </span>
          ) : (
            <span className="text-gray-500">
              {passPercent}% passing (cached)
            </span>
          )}
          {!isRunning && (onRunAgain || onClearCache || onCompare) && (
            <div className="ml-auto relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-300 p-1"
                title="Menu"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[160px]">
                  {onCompare && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onClose();
                        onCompare();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <span className="underline">C</span>ompare Test Runs
                    </button>
                  )}
                  {onRunAgain && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onRunAgain();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Run Again
                    </button>
                  )}
                  {onClearCache && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onClearCache();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Clear Cache
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
            Error: {error}
          </div>
        )}

        {/* Column headers */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span
              className="w-10 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
              onClick={() => handleSort('ok')}
            >
              OK{getSortIndicator('ok')}
            </span>
            <span
              className="w-20 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none font-mono"
              onClick={() => handleSort('id')}
            >
              ID{getSortIndicator('id')}
            </span>
            <span
              className="flex-1 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
              onClick={() => handleSort('description')}
            >
              Description{getSortIndicator('description')}
            </span>
          </div>
        )}

        {/* Results list */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1"
        >
          {sortedResults.map((result) => {
            const test = tests.find((t) => t.id === result.testId);
            return (
              <button
                key={result.testId}
                onClick={() => test && handleTestClick(test)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  result.running ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <span className="w-10 flex-shrink-0 text-center">
                  {result.running ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full" />
                  ) : result.passed ? (
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">✗</span>
                  )}
                </span>
                <span className="w-20 text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                  {result.testId}
                </span>
                <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{result.testName}</span>
              </button>
            );
          })}
          {results.length === 0 && !isRunning && !error && (
            <div className="text-gray-500 text-center py-4">
              No test results available
            </div>
          )}
          {results.length === 0 && isRunning && (
            <div className="text-gray-500 text-center py-4">
              Loading test suite...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
