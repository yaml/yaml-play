import { useEffect } from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            The YAML Parser Playground compares output from multiple YAML parser
            implementations. The Reference Parser is used as the baseline.
            Green headers indicate matching output and red ones indicate differences.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            The output format is a DSL for YAML parser "events", which are the
            data structures most YAML parsers create internally.
            A YAML "parser" is just one of many stages in a YAML "loader"'s
            stack, but it is the most difficult and important one to get
            right. This DSL is the one used by the{' '}
            <a
              href="https://github.com/yaml/yaml-test-suite"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              YAML Test Suite
            </a>.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            This site turns your input into sharable URLs.
            This can be very useful when discussing particular YAML issues or reporting bugs.
          </p>
        </div>
      </div>
    </div>
  );
}
