import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect } from 'react';
import { ParserInfo } from '../lib/types';

interface PaneHeaderProps {
  parser: ParserInfo;
  matches?: boolean;
  loading?: boolean;
  onClose?: () => void;
  isDraggable?: boolean;
  onInfoClick?: () => void;
  onRunTestSuite?: () => void;
  showTestSuite?: boolean;
  output?: string;
}

export function PaneHeader({
  parser,
  matches,
  loading,
  onClose,
  isDraggable = true,
  onInfoClick,
  onRunTestSuite,
  showTestSuite = true,
  output,
}: PaneHeaderProps) {
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parser.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const bgColor = loading
    ? 'bg-gray-300 dark:bg-gray-700'
    : matches === undefined
    ? 'bg-gray-300 dark:bg-gray-700'
    : matches
    ? 'bg-green-300 dark:bg-green-700'
    : 'bg-red-300 dark:bg-red-700';

  const hoverInfo = `${parser.name} v${parser.version} (${parser.language})`;

  const handleTitleBarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${bgColor} px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing select-none`}
      {...attributes}
      {...listeners}
    >
      <div
        className="flex items-center gap-2 cursor-pointer flex-1 relative"
        onClick={handleTitleBarClick}
        ref={menuRef}
      >
        {/* Hamburger icon */}
        <svg className="w-4 h-4 text-gray-700 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-gray-900 dark:text-white font-semibold" title={hoverInfo}>
          {parser.name}
        </span>
        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[140px]">
            {showTestSuite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onRunTestSuite?.();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Test Suite
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onInfoClick?.();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Parser Info
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-gray-700 dark:border-white border-t-transparent rounded-full" />
        )}
        {output && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(output);
            }}
            className="text-gray-700 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 p-1"
            title="Copy output"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
        {onClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-700 dark:text-white hover:text-gray-500 dark:hover:text-gray-300 text-lg leading-none px-1"
            title="Close pane"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
