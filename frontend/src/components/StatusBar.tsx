interface StatusBarProps {
  total: number;
  disagreeing: number;
  disagreeingNames: string[];
  loading: boolean;
  sandboxAvailable?: boolean;
  onSandboxSetup: () => void;
}

export function StatusBar({ total, disagreeing, disagreeingNames, loading, sandboxAvailable = true, onSandboxSetup }: StatusBarProps) {
  if (!sandboxAvailable) {
    return (
      <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <span className="text-gray-900 dark:text-white font-semibold">
          Can't connect to sandbox server. Click{' '}
          <button onClick={onSandboxSetup} className="text-yellow-600 dark:text-yellow-400 underline hover:no-underline">
            Setup
          </button>
          .
        </span>
        <a
          href="https://github.com/yaml/yaml-play"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="View on GitHub"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-2">
        <span className="text-gray-500 dark:text-gray-400 font-semibold">Running parsers...</span>
      </div>
    );
  }

  const allAgree = disagreeing === 0;

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
      {allAgree ? (
        <span className="text-green-600 dark:text-green-400 font-semibold">
          All {total} parsers agree with the Reference Parser
        </span>
      ) : (
        <span className="text-red-600 dark:text-red-400 font-semibold">
          {disagreeing}/{total} parsers disagree with the Reference Parser: {disagreeingNames.join(', ')}
        </span>
      )}
      <a
        href="https://github.com/yaml/yaml-play"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        title="View on GitHub"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
        </svg>
      </a>
    </div>
  );
}
