import { useState, useCallback } from 'react';
import { ParserInfo, ParserResult } from '../lib/types';
import { PaneHeader } from './PaneHeader';
import { ParserInfoModal } from './ParserInfoModal';
import { TestRunnerModal } from './TestRunnerModal';
import { CompareTestRunsModal } from './CompareTestRunsModal';
import { getParser } from '../lib/parsers';
import { clearCachedResults } from '../lib/testResultsCache';

interface OutputPaneProps {
  parser: ParserInfo;
  result?: ParserResult;
  onClose?: () => void;
  onAddPane?: () => void;
  isDraggable?: boolean;
  onSetYamlInput?: (yaml: string) => void;
  showTestSuite?: boolean;
}

// Check if error looks like a connection/network error or server error
function isConnectionError(error: string): boolean {
  const connectionPatterns = [
    'Failed to fetch',
    'NetworkError',
    'network error',
    'ERR_CONNECTION_REFUSED',
    'ECONNREFUSED',
    'fetch failed',
    'Load failed',
    'HTTP 500',
    'HTTP 502',
    'HTTP 503',
    'HTTP 504',
    'Internal Server Error',
  ];
  return connectionPatterns.some(pattern =>
    error.toLowerCase().includes(pattern.toLowerCase())
  );
}

export function OutputPane({
  parser,
  result,
  onClose,
  onAddPane,
  isDraggable = true,
  onSetYamlInput,
  showTestSuite = true,
}: OutputPaneProps) {
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [testRunnerOpen, setTestRunnerOpen] = useState(false);
  const [forceRerun, setForceRerun] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);
  const [viewCachedParserId, setViewCachedParserId] = useState<string | null>(null);
  const [viewForceRerun, setViewForceRerun] = useState(false);
  const [viewRunKey, setViewRunKey] = useState(0);

  const handleRunAgain = useCallback(() => {
    clearCachedResults(parser.id);
    setForceRerun(true);
    setRunKey(k => k + 1);
  }, [parser.id]);

  const handleClearCache = useCallback(() => {
    clearCachedResults(parser.id);
    setTestRunnerOpen(false);
  }, [parser.id]);

  const handleViewRunAgain = useCallback(() => {
    if (viewCachedParserId) {
      clearCachedResults(viewCachedParserId);
      setViewForceRerun(true);
      setViewRunKey(k => k + 1);
    }
  }, [viewCachedParserId]);

  const handleViewClearCache = useCallback(() => {
    if (viewCachedParserId) {
      clearCachedResults(viewCachedParserId);
      setViewCachedParserId(null);
    }
  }, [viewCachedParserId]);

  // Check if this is a sandbox parser (not refparse which runs in browser)
  const isSandboxParser = parser.id !== 'refparse';

  // Detect version mismatch
  const hasVersionMismatch = isSandboxParser && result?.versionMismatch;

  // Detect connection errors for sandbox parsers
  const hasConnectionError =
    isSandboxParser &&
    !hasVersionMismatch &&
    result?.status === -1 &&
    result?.output &&
    isConnectionError(result.output);

  return (
    <div className="flex flex-col h-full min-h-[200px] bg-gray-100 dark:bg-gray-900">
      <PaneHeader
        parser={parser}
        agrees={result?.agrees}
        loading={result?.loading}
        onClose={onClose}
        onAddPane={onAddPane}
        isDraggable={isDraggable}
        onInfoClick={() => setInfoModalOpen(true)}
        onRunTestSuite={() => {
          setForceRerun(false);
          setTestRunnerOpen(true);
        }}
        showTestSuite={showTestSuite}
        output={result?.output}
        parseSuccess={result ? result.status === 0 : undefined}
      />
      <ParserInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
        parser={parser}
      />
      <TestRunnerModal
        key={runKey}
        isOpen={testRunnerOpen}
        onClose={() => setTestRunnerOpen(false)}
        parser={parser}
        onSelectTest={(yaml) => onSetYamlInput?.(yaml)}
        forceRerun={forceRerun}
        onCompare={() => setCompareOpen(true)}
        onRunAgain={handleRunAgain}
        onClearCache={handleClearCache}
      />
      <CompareTestRunsModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        onSelectParser={(parserId) => setViewCachedParserId(parserId)}
      />
      {viewCachedParserId && getParser(viewCachedParserId) && (
        <TestRunnerModal
          key={`view-${viewCachedParserId}-${viewRunKey}`}
          isOpen={true}
          onClose={() => {
            setViewCachedParserId(null);
            setViewForceRerun(false);
          }}
          parser={getParser(viewCachedParserId)!}
          onSelectTest={(yaml) => onSetYamlInput?.(yaml)}
          forceRerun={viewForceRerun}
          onCompare={() => {
            setViewCachedParserId(null);
            setCompareOpen(true);
          }}
          onRunAgain={handleViewRunAgain}
          onClearCache={handleViewClearCache}
        />
      )}
      <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto">
        {result?.error ? (
          <pre className="p-3 text-red-600 dark:text-red-400 text-sm font-mono whitespace-pre-wrap">
            Error: {result.error}
          </pre>
        ) : hasVersionMismatch ? (
          <div className="p-3 text-sm">
            <p className="text-yellow-600 dark:text-yellow-400 mb-2">
              Wrong sandbox version ({result.versionMismatch!.found}) found.
              Requires {result.versionMismatch!.required}.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Click the "<span className="text-gray-900 dark:text-white font-medium">Setup</span>" button for instructions.
            </p>
          </div>
        ) : hasConnectionError ? (
          <div className="p-3 text-sm">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Can't connect to a local YAML parser sandbox server.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Click the "<span className="text-gray-900 dark:text-white font-medium">Setup</span>" button for instructions.
            </p>
          </div>
        ) : result?.loading ? (
          <div className="p-3 text-gray-500 text-sm">Running parser...</div>
        ) : (
          <pre className="p-3 text-gray-800 dark:text-gray-200 text-sm font-mono whitespace-pre-wrap">
            {result?.output || 'No output yet'}
          </pre>
        )}
      </div>
    </div>
  );
}
