import { useEffect } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
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
        className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Help</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">Esc</kbd>
              <span className="text-gray-300 self-center">Unfocus input pane / Close modal</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">I</kbd>
              <span className="text-gray-300 self-center">Focus input pane</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">A</kbd>
              <span className="text-gray-300 self-center">Show all panes</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">N</kbd>
              <span className="text-gray-300 self-center">Hide all panes</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">D</kbd>
              <span className="text-gray-300 self-center">Show differing panes</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">S</kbd>
              <span className="text-gray-300 self-center">Show your selected panes</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">P</kbd>
              <span className="text-gray-300 self-center">Open Preferences</span>
              <kbd className="bg-gray-900 px-2 py-1 rounded text-gray-200 font-mono">H</kbd>
              <span className="text-gray-300 self-center">Open Help</span>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
              About
            </h3>
            <p className="text-gray-300 text-sm">
              The YAML Parser Playground compares output from multiple YAML parser
              implementations. The Reference Parser is used as the baseline.
              Green headers indicate matching output and red ones indicate differences.
            </p>
            <br />
            <p className="text-gray-300 text-sm">
              The output format is a DSL for YAML parser "events", which are the
              data structures most YAML parsers create internally.
              A YAML "parser" is just one of many stages in a YAML "loader"'s
              stack, but it is the most difficult and important one to get
              right. This DSL is the one used by the <a
              href="https://github.com/yaml/yaml-test-suite">YAML Test
              Suite</a>.
            </p>
            <br />
            <p className="text-gray-300 text-sm">
              Note: The S key will restore your selected panes after using A, N,
              or D to show all, none, or differing panes.
            </p>
            <br />
            <p className="text-gray-300 text-sm">
              This site turns your input into sharable URLs.
              This can be very useful when discussing particular YAML issues or reporting bugs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
