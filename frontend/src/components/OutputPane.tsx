import { ParserInfo, ParserResult } from '../lib/types';
import { PaneHeader } from './PaneHeader';

interface OutputPaneProps {
  parser: ParserInfo;
  result?: ParserResult;
  onClose?: () => void;
  isDraggable?: boolean;
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
  isDraggable = true,
}: OutputPaneProps) {
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
    <div className="flex flex-col h-full min-h-[200px] bg-gray-900">
      <PaneHeader
        parser={parser}
        matches={result?.matches}
        loading={result?.loading}
        onClose={onClose}
        isDraggable={isDraggable}
      />
      <div className="flex-1 bg-gray-900 overflow-auto">
        {result?.error ? (
          <pre className="p-3 text-red-400 text-sm font-mono whitespace-pre-wrap">
            Error: {result.error}
          </pre>
        ) : hasVersionMismatch ? (
          <div className="p-3 text-sm">
            <p className="text-yellow-400 mb-2">
              Wrong sandbox version ({result.versionMismatch!.found}) found.
              Requires {result.versionMismatch!.required}.
            </p>
            <p className="text-gray-400">
              Click the "<span className="text-white font-medium">Setup</span>" button for instructions.
            </p>
          </div>
        ) : hasConnectionError ? (
          <div className="p-3 text-sm">
            <p className="text-gray-300 mb-2">
              Can't connect to a local YAML parser sandbox server.
            </p>
            <p className="text-gray-400">
              Click the "<span className="text-white font-medium">Setup</span>" button for instructions.
            </p>
          </div>
        ) : result?.loading ? (
          <div className="p-3 text-gray-500 text-sm">Running parser...</div>
        ) : (
          <pre className="p-3 text-gray-200 text-sm font-mono whitespace-pre-wrap">
            {result?.output || 'No output yet'}
          </pre>
        )}
      </div>
    </div>
  );
}
