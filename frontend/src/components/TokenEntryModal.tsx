import { useEffect, useState } from 'react';
import { GitHubDeviceAuth } from './GitHubDeviceAuth';
import { UseGitHubAuthReturn } from '../hooks/useGitHubAuth';
import { getGitHubModels } from '../lib/sandbox';
import { getGitHubToken } from '../lib/oauth';

interface TokenEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubAuth: UseGitHubAuthReturn;
}

const GITHUB_MODEL_KEY = 'github-model';

export function TokenEntryModal({ isOpen, onClose, githubAuth }: TokenEntryModalProps) {
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; publisher: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load saved model and fetch available models when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Load saved model preference
    const savedModel = localStorage.getItem(GITHUB_MODEL_KEY) || '';
    setSelectedModel(savedModel);

    // Fetch available models if we have a GitHub token
    const token = getGitHubToken();
    if (token) {
      setLoadingModels(true);
      getGitHubModels(token)
        .then(models => {
          setAvailableModels(models);
          setLoadingModels(false);

          // If no model is saved yet, set default to Llama-3.3-70B-Instruct
          if (!savedModel && models.length > 0) {
            const defaultModel = models.find(m => m.name === 'Llama-3.3-70B-Instruct');
            if (defaultModel) {
              handleModelChange(defaultModel.id);
            }
          }
        })
        .catch(() => {
          setLoadingModels(false);
        });
    }
  }, [isOpen]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    if (modelId) {
      localStorage.setItem(GITHUB_MODEL_KEY, modelId);
      // Save the display name (publisher/name) for showing in UI
      const model = availableModels.find(m => m.id === modelId);
      if (model) {
        localStorage.setItem('github-model-name', `${model.publisher}/${model.name}`);
      }
    } else {
      localStorage.removeItem(GITHUB_MODEL_KEY);
      localStorage.removeItem('github-model-name');
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Explanation section */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Login to GitHub with oauth if you want to submit new{' '}
            <a
              href="https://github.com/yaml/yaml-test-suite"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              YAML Test Suite
            </a>
            {' '}test cases. This will provide an internal token that allows you to submit pull requests with a single click. You can optionally select an AI model to suggest test names, tags and more via{' '}
            <a
              href="https://github.com/marketplace/models"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              GitHub Models
            </a>
            . All settings are stored locally in your browser only.
          </p>
        </div>

        <div className="p-4 space-y-6">
          {/* GitHub OAuth Section */}
          <GitHubDeviceAuth auth={githubAuth} />

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* GitHub Models Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <a
                href="https://github.com/marketplace/models"
                target="_blank"
                rel="noopener noreferrer"
                className="text-md font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub Models (AI Features)
              </a>
              {selectedModel && (
                <span className="text-xs text-green-600 dark:text-green-400">✓ Selected</span>
              )}
            </div>

            <div>
              <select
                id="github-model"
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                disabled={loadingModels || !githubAuth.isAuthenticated}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">None (Manual Mode)</option>
                {loadingModels && <option disabled>Loading models...</option>}
                {!loadingModels && availableModels.map(model => {
                  // Mark free tier models (use exact names from GitHub API)
                  const freeTierModels = ['OpenAI GPT-4o mini', 'Llama-3.3-70B-Instruct', 'DeepSeek-R1'];
                  const isFree = freeTierModels.includes(model.name);
                  return (
                    <option key={model.id} value={model.id}>
                      {model.publisher}/{model.name}{isFree ? ' (free)' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {githubAuth.isAuthenticated
                  ? 'Select a model for AI-powered test naming, or choose Manual Mode to fill in fields yourself. Uses your GitHub token.'
                  : 'Authenticate with GitHub above to access AI models.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
