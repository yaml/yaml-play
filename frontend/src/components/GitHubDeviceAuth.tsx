import { useState, useEffect } from 'react';
import { UseGitHubAuthReturn, DeviceFlowData } from '../hooks/useGitHubAuth';

interface GitHubDeviceAuthProps {
  auth: UseGitHubAuthReturn;
}

export function GitHubDeviceAuth({ auth }: GitHubDeviceAuthProps) {
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowData | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    const result = await auth.login();
    if (result) {
      setDeviceFlow(result);
    }
  };

  // Start polling when device flow is initiated
  useEffect(() => {
    if (deviceFlow && !auth.isAuthenticated) {
      auth.waitForAuth(deviceFlow.deviceCode, deviceFlow.interval);
    }
  }, [deviceFlow, auth]);

  const handleCopyCode = async () => {
    if (deviceFlow) {
      await navigator.clipboard.writeText(deviceFlow.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not authenticated, not loading
  if (!auth.isAuthenticated && !auth.isLoading && !deviceFlow) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            GitHub Authentication
          </span>
        </div>

        <div>
          <button
            onClick={handleLogin}
            className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.137 18.165 20 14.418 20 10c0-5.523-4.477-10-10-10z"
                clipRule="evenodd"
              />
            </svg>
            Sign in with GitHub
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Enables PR submission to yaml-test-suite. Uses OAuth Device Flow - no password required.
          </p>
        </div>

        {auth.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{auth.error}</p>
        )}
      </div>
    );
  }

  // Device flow in progress
  if (deviceFlow && !auth.isAuthenticated) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            Complete GitHub Authorization
          </span>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-4 space-y-3">
          <p className="text-sm text-gray-900 dark:text-white font-medium">
            Copy this code, then click "Open GitHhub":
          </p>

          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-4 py-3 text-2xl font-mono font-bold text-center text-gray-900 dark:text-white tracking-wider">
              {deviceFlow.userCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="px-3 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              title="Copy code"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>

          <a
            href={deviceFlow.verificationUri}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-center rounded transition-colors"
          >
            Open GitHub →
          </a>

          <p className="text-xs text-gray-600 dark:text-gray-300">
            Waiting for authorization... This page will update automatically.
          </p>
        </div>

        {auth.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{auth.error}</p>
        )}

        <button
          onClick={() => setDeviceFlow(null)}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Authenticated
  if (auth.isAuthenticated && auth.user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-md font-semibold text-gray-900 dark:text-white">
            GitHub Authentication
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">✓ Signed in</span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          <img
            src={auth.user.avatar_url}
            alt={auth.user.login}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {auth.user.name || auth.user.login}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{auth.user.login}</p>
          </div>
          <button
            onClick={auth.logout}
            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Loading
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-md font-semibold text-gray-900 dark:text-white">
          GitHub Authentication
        </span>
      </div>
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}
