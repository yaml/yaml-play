import { useState, useRef, useEffect } from 'react';

interface HeaderMenuProps {
  onHelp: () => void;
  onOptions: () => void;
  onAllPanes: () => void;
  onUnselectAll: () => void;
  onTestFormat: () => void;
  onKeyboardShortcuts: () => void;
  onSandboxSetup: () => void;
  onAddTokens: () => void;
  onFactoryReset: () => void;
  hasTokens: boolean;
}

export function HeaderMenu({ onHelp, onOptions, onAllPanes, onUnselectAll, onTestFormat, onKeyboardShortcuts, onSandboxSetup, onAddTokens, onFactoryReset, hasTokens }: HeaderMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-gray-300 p-2"
        title="Menu"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[160px]">
          <button
            onClick={() => {
              setMenuOpen(false);
              onHelp();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">H</span>elp
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onKeyboardShortcuts();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">K</span>eyboard Shortcuts
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onOptions();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">O</span>ptions
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onAllPanes();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">A</span>ll Panes
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onUnselectAll();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">U</span>nselect All
          </button>
          {hasTokens && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onTestFormat();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="font-bold text-blue-600 dark:text-blue-400">T</span>est Suite PR
            </button>
          )}
          <button
            onClick={() => {
              setMenuOpen(false);
              onAddTokens();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <span className="font-bold text-blue-600 dark:text-blue-400">G</span>itHub Setup
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onSandboxSetup();
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sandbox Setup
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              onFactoryReset();
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Factory Reset
          </button>
        </div>
      )}
    </div>
  );
}
