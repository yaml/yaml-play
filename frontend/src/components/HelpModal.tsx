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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Overview */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Overview
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              The <strong className="text-gray-900 dark:text-white">YAML Parser Playground</strong> lets
              you compare how 17+ different YAML parser implementations handle the same input.
              Enter YAML in the input editor on the left, and see the parsed output from each
              parser in the panes on the right.
            </p>
          </section>

          {/* Understanding Colors */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Understanding the Colors
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Each output pane has a colored header showing the parse status:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="inline-block w-4 h-4 bg-green-300 border-4 border-green-300 rounded flex-shrink-0 mt-0.5"></span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Green:</strong> The YAML parsed successfully (no errors)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-4 h-4 bg-red-300 border-4 border-red-300 rounded flex-shrink-0 mt-0.5"></span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Red:</strong> The parser returned an error
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-4 h-4 bg-green-300 border-4 border-red-600 rounded flex-shrink-0 mt-0.5"></span>
                <span className="text-gray-600 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Red border:</strong> Output differs from the Reference Parser
                </span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              A red border indicates disagreement — either the output differs from the Reference Parser,
              or one parser succeeded while the other failed.
            </p>
          </section>

          {/* Reference Parser */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              The Reference Parser
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              The <strong className="text-gray-900 dark:text-white">Reference Parser</strong> pane shows output
              from the official YAML Reference Parser, which aims to implement the YAML 1.2 specification
              exactly. All other parsers are compared against it. The Reference Parser runs directly in your browser
              and doesn't require the sandbox.
            </p>
          </section>

          {/* Output Format */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Output Format
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              The output is a DSL (domain-specific language) representing YAML parser "events" —
              the internal data structures parsers create when processing YAML. This is the same
              format used by the{' '}
              <a
                href="https://github.com/yaml/yaml-test-suite"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                YAML Test Suite
              </a>.
              A "parser" is just one stage in a YAML "loader" — it converts text to events,
              while later stages convert events to native data structures.
            </p>
          </section>

          {/* Sandbox Setup */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Running Other Parsers
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Most parsers (Python, Go, Ruby, Java, etc.) require a local Docker sandbox to run.
              Click the <strong className="text-gray-900 dark:text-white">Setup</strong> button in the
              header for instructions on starting the sandbox container. Without it, only the
              JavaScript-based Reference Parser will work.
            </p>
          </section>

          {/* Test Suite */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              YAML Test Suite
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              Use the <strong className="text-gray-900 dark:text-white">Search Test Suite</strong> feature
              (in the input pane menu) to load test cases from the official YAML Test Suite. You can
              also run the entire test suite against any parser by clicking its hamburger menu and
              selecting <strong className="text-gray-900 dark:text-white">Test Suite</strong>.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 mb-2">
              <strong className="text-gray-900 dark:text-white">Contributing Tests:</strong> You can submit
              new test cases directly to the yaml-test-suite repository. Press{' '}
              <kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">T</kbd>{' '}
              or use the menu to open <strong className="text-gray-900 dark:text-white">Test Format</strong>.
              Choose between <strong className="text-gray-900 dark:text-white">Manual Mode</strong> (fill in test name and tags yourself)
              or use <strong className="text-gray-900 dark:text-white">GitHub Models</strong> to AI-generate these fields.
              You'll select applicable tags from a list, review similar tests to avoid duplicates, and create a pull request with one click.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              <em>Note: Test submission requires a GitHub token for PR creation. Optionally, select a model from{' '}
              <strong className="text-gray-900 dark:text-white">API Tokens</strong> in the menu
              to enable AI-powered test naming via GitHub Models (uses your GitHub token, no additional API key needed).</em>
            </p>
          </section>

          {/* URL Sharing */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Sharing URLs
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Your YAML input is automatically encoded in the URL. Copy and share the URL to let
              others see exactly what you're working on — great for bug reports and discussions
              about YAML edge cases.
            </p>
          </section>

          {/* Keyboard Shortcuts */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Keyboard Shortcuts
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Press <kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">K</kbd> to
              see all keyboard shortcuts. Highlights include:
            </p>
            <ul className="text-gray-600 dark:text-gray-300 text-sm mt-2 space-y-1 list-disc list-inside">
              <li><kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">I</kbd> — Focus the input editor</li>
              <li><kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">A</kbd> / <kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">N</kbd> — Show all / no panes</li>
              <li><kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">D</kbd> — Show only differing panes</li>
              <li><kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">O</kbd> / <kbd className="bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 font-mono text-xs">P</kbd> — Options / Parser Panes</li>
            </ul>
          </section>

          {/* Drag and Drop */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Organizing Panes
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Drag parser panes by their headers to reorder them. Use{' '}
              <strong className="text-gray-900 dark:text-white">Parser Panes</strong> (press P) to
              show/hide specific parsers, or <strong className="text-gray-900 dark:text-white">Options</strong> (press O)
              to change the editor type or color scheme.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
