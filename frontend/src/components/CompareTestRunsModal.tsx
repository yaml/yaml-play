import { useEffect, useState, useCallback } from 'react';
import { getAllCachedResults, CachedParserResult } from '../lib/testResultsCache';
import { getParser } from '../lib/parsers';

interface CompareTestRunsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParser: (parserId: string) => void;
}

interface ParserComparison {
  parserId: string;
  parserName: string;
  passed: number;
  failed: number;
  total: number;
  percent: string;
  percentNum: number;
  version: string;
  elapsedTime?: number;
}

type SortColumn = 'parserName' | 'version' | 'passed' | 'failed' | 'total' | 'percent' | 'time';
type SortDirection = 'asc' | 'desc';

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const SORT_STORAGE_KEY = 'yaml-play-compare-sort';

// Format elapsed time as seconds.centiseconds (e.g., "12.34s")
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
}

function loadSortState(): SortState {
  try {
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as SortState;
    }
  } catch {
    // Ignore errors
  }
  return { column: 'percent', direction: 'desc' };
}

function saveSortState(state: SortState): void {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

export function CompareTestRunsModal({ isOpen, onClose, onSelectParser }: CompareTestRunsModalProps) {
  const [comparisons, setComparisons] = useState<ParserComparison[]>([]);
  const [sortState, setSortState] = useState<SortState>(loadSortState);

  // Reload sort state from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      setSortState(loadSortState());
    }
  }, [isOpen]);

  const sortComparisons = useCallback((data: ParserComparison[], state: SortState): ParserComparison[] => {
    const sorted = [...data];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (state.column) {
        case 'parserName':
          cmp = a.parserName.localeCompare(b.parserName);
          break;
        case 'version':
          cmp = a.version.localeCompare(b.version);
          break;
        case 'passed':
          cmp = a.passed - b.passed;
          break;
        case 'failed':
          cmp = a.failed - b.failed;
          break;
        case 'total':
          cmp = a.total - b.total;
          break;
        case 'percent':
          cmp = a.percentNum - b.percentNum;
          break;
        case 'time':
          cmp = (a.elapsedTime ?? 0) - (b.elapsedTime ?? 0);
          break;
      }
      return state.direction === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const cachedResults = getAllCachedResults();
    const comparisonData: ParserComparison[] = cachedResults.map((cr: CachedParserResult) => {
      const parser = getParser(cr.parserId);
      const passed = cr.cache.results.filter(r => r.passed).length;
      const total = cr.cache.results.length;
      const failed = total - passed;
      const percentNum = total > 0 ? (passed / total) * 100 : 0;
      const percent = percentNum.toFixed(1);

      return {
        parserId: cr.parserId,
        parserName: parser?.name || cr.parserId,
        passed,
        failed,
        total,
        percent,
        percentNum,
        version: cr.cache.parserVersion,
        elapsedTime: cr.cache.elapsedTime,
      };
    });

    setComparisons(sortComparisons(comparisonData, sortState));
  }, [isOpen, sortState, sortComparisons]);

  const handleSort = (column: SortColumn) => {
    const newState: SortState = {
      column,
      direction: sortState.column === column && sortState.direction === 'asc' ? 'desc' : 'asc',
    };
    setSortState(newState);
    saveSortState(newState);
  };

  const getSortIndicator = (column: SortColumn) => {
    if (sortState.column !== column) return null;
    return sortState.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Compare Test Runs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Comparison table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th
                  className="pb-2 cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('parserName')}
                >
                  Parser{getSortIndicator('parserName')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('version')}
                >
                  Version{getSortIndicator('version')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('passed')}
                >
                  Pass{getSortIndicator('passed')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('failed')}
                >
                  Fail{getSortIndicator('failed')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('total')}
                >
                  Total{getSortIndicator('total')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('percent')}
                >
                  %{getSortIndicator('percent')}
                </th>
                <th
                  className="pb-2 text-right cursor-pointer hover:text-gray-900 dark:hover:text-white select-none"
                  onClick={() => handleSort('time')}
                >
                  Time{getSortIndicator('time')}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comp) => (
                <tr
                  key={comp.parserId}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    onSelectParser(comp.parserId);
                    onClose();
                  }}
                >
                  <td className="py-2 text-gray-900 dark:text-white">{comp.parserName}</td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400 font-mono text-xs">{comp.version}</td>
                  <td className="py-2 text-right text-green-600 dark:text-green-400">{comp.passed}</td>
                  <td className="py-2 text-right text-red-600 dark:text-red-400">{comp.failed}</td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400">{comp.total}</td>
                  <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">{comp.percent}%</td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {comp.elapsedTime != null ? formatTime(comp.elapsedTime) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comparisons.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              No cached test results available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
