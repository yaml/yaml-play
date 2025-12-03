import { useEffect } from 'react';
import { parsers } from '../lib/parsers';
import { PaneState } from '../lib/types';

interface PaneSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  paneStates: PaneState[];
  onToggleVisibility: (id: string, visible: boolean) => void;
  insertAfterId?: string;
  onAddPaneAfter?: (afterId: string, paneId: string) => void;
}

export function PaneSelectorModal({
  isOpen,
  onClose,
  paneStates,
  onToggleVisibility,
  insertAfterId,
  onAddPaneAfter,
}: PaneSelectorModalProps) {
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

  const isAddMode = insertAfterId !== undefined && onAddPaneAfter !== undefined;
  const paneMap = new Map(paneStates.map(p => [p.id, p]));

  // In add mode, only show hidden parsers (excluding refparse)
  // In normal mode, show all parsers (excluding refparse)
  const sortedParsers = [...parsers]
    .filter(p => p.id !== 'refparse')
    .filter(p => !isAddMode || !(paneMap.get(p.id)?.visible ?? false))
    .sort((a, b) => a.id.localeCompare(b.id));

  const handleParserClick = (parserId: string) => {
    if (isAddMode) {
      onAddPaneAfter(insertAfterId, parserId);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAddMode ? 'Add Parser Pane' : 'Parser Panes'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {sortedParsers.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">All parsers are already visible.</p>
          ) : (
            sortedParsers.map(parser => {
              const state = paneMap.get(parser.id);
              const isVisible = state?.visible ?? false;
              // Show version only if it's dotted numbers (e.g., "1.2", "1.2.3", "0.2.1.1")
              const showVersion = /^\d+(\.\d+)+$/.test(parser.version);

              if (isAddMode) {
                // In add mode, show as clickable buttons
                return (
                  <button
                    key={parser.id}
                    onClick={() => handleParserClick(parser.id)}
                    className="flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{parser.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{parser.language}</span>
                    {showVersion && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">{parser.version}</span>
                    )}
                  </button>
                );
              }

              // Normal mode with checkboxes
              return (
                <label
                  key={parser.id}
                  className="flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => onToggleVisibility(parser.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900 dark:text-white font-medium">{parser.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{parser.language}</span>
                  {showVersion && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">{parser.version}</span>
                  )}
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
