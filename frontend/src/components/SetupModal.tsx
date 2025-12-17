import { useEffect, useState } from 'react';
import { getRequiredSandboxVersion } from '../lib/sandbox';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SANDBOX_VERSION = getRequiredSandboxVersion();
const DOCKER_COMMAND = `docker run --rm -d --name yaml-play -p 7481:7481 yamlio/yaml-play-sandbox:${SANDBOX_VERSION} 7481`;
const DOCKER_COMMAND_ALT = `docker run --rm -d --name yaml-play --network host yamlio/yaml-play-sandbox:${SANDBOX_VERSION} 7481`;

export function SetupModal({ isOpen, onClose }: SetupModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedAlt, setCopiedAlt] = useState(false);

  const copyCommand = async (command: string, setCopiedState: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = command;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sandbox Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Sandbox Setup */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
              Start the Sandbox Server (version {SANDBOX_VERSION})
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              These parsers run in a Docker container that you need to start on your machine.
              If you see connection errors, start the sandbox by running this command in a terminal:
            </p>
            <div className="flex gap-2 items-start">
              <pre className="flex-1 bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm text-green-700 dark:text-green-400 font-mono overflow-x-auto">
                {DOCKER_COMMAND}
              </pre>
              <button
                onClick={() => copyCommand(DOCKER_COMMAND, setCopied)}
                className="flex-shrink-0 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 mb-2">
              The Docker command above does not work for some users.
              If it does not work for you then try this command instead:
            </p>
            <div className="flex gap-2 items-start">
              <pre className="flex-1 bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm text-green-700 dark:text-green-400 font-mono overflow-x-auto">
                {DOCKER_COMMAND_ALT}
              </pre>
              <button
                onClick={() => copyCommand(DOCKER_COMMAND_ALT, setCopiedAlt)}
                className="flex-shrink-0 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={copiedAlt ? 'Copied!' : 'Copy to clipboard'}
              >
                {copiedAlt ? (
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">
              Note: If a different version of the sandbox server Docker container is already running, you'll need to kill that first.
            </p>
          </section>

          {/* HTTPS Certificate */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
              HTTPS Certificate (if needed)
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
              If you are still getting connection errors, you may need to accept the unsigned HTTPS certificate:
            </p>
            <ol className="text-gray-600 dark:text-gray-300 text-sm list-decimal list-inside space-y-1">
              <li>
                Click here:{' '}
                <a
                  href="https://localhost:7481"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline"
                >
                  https://localhost:7481
                </a>
                {' '}(opens in a new tab)
              </li>
              <li>Accept the security warning / proceed anyway</li>
              <li>Return to this page and refresh</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
