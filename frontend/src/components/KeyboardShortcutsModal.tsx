import { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">Esc</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Unfocus input pane / Close modal</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">I</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Focus input pane</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">\\\</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Clear input and focus</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">A</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Show all panes</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">D</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Select differing panes</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">S</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Show your selected panes</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">U</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Unselect all (clear all checkboxes)</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">C</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Compare Test Runs</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">O</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Open Options</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">H</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Show help</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">K</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Show keyboard shortcuts</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">G</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">GitHub Setup</span>
            <kbd className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-800 dark:text-gray-200 font-mono">T</kbd>
            <span className="text-gray-600 dark:text-gray-300 self-center">Test Suite PR (submit new test)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
