import { useEffect } from 'react';
import { ParserInfo } from '../lib/types';

interface ParserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  parser: ParserInfo;
}

export function ParserInfoModal({ isOpen, onClose, parser }: ParserInfoModalProps) {
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
        className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{parser.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {parser.repo && (
              <>
                <span className="text-gray-400">Repository</span>
                <a
                  href={parser.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline truncate"
                >
                  {parser.repo}
                </a>
              </>
            )}
            <span className="text-gray-400">Language</span>
            <span className="text-white">{parser.language}</span>
            <span className="text-gray-400">Version</span>
            <span className="text-white">{parser.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
