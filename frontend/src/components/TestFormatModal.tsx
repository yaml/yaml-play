import { useEffect, useState } from 'react';
import { previewTestPR, submitTestPR } from '../lib/sandbox';
import { getGitHubToken } from '../lib/oauth';

interface TestFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  yaml: string;
  events: string;
  isError: boolean;
}

interface SimilarTest {
  id: string;
  name: string;
  url: string;
}

const AVAILABLE_TAGS = [
  "alias", "anchor", "comment", "complex-key", "directive",
  "document", "double", "duplicate-key", "edge", "empty",
  "empty-key", "error", "explicit-key", "flow", "folded",
  "footer", "header", "indent", "literal", "local-tag",
  "mapping", "scalar", "sequence", "simple", "single",
  "spec", "tag", "unknown-tag", "whitespace",
  "1.3-err", "1.3-mod", "libyaml-err", "upto-1.2"
];

export function TestFormatModal({ isOpen, onClose, yaml, events, isError }: TestFormatModalProps) {
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState('');
  const [testId, setTestId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [json, setJson] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [testFormat, setTestFormat] = useState('');
  const [similarTests, setSimilarTests] = useState<SimilarTest[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [regeneratingSimilar, setRegeneratingSimilar] = useState(false);

  // Regenerate similar tests only
  const regenerateSimilarTests = async () => {
    setRegeneratingSimilar(true);
    try {
      const model = localStorage.getItem('github-model') || '';
      const githubToken = getGitHubToken() || '';

      const result = await previewTestPR({
        yaml,
        events,
        isError,
        model,
        githubToken,
        testName,  // Pass current (possibly user-edited) test name for better context
        currentTags: selectedTags  // Pass current tags for better context
      });

      // Only update similar tests, don't touch name or tags
      setSimilarTests(result.similarTests || []);
    } catch (error) {
      console.error('Failed to regenerate similar tests:', error);
    } finally {
      setRegeneratingSimilar(false);
    }
  };

  // Transform flat events to indented tree format
  const transformEventsToTree = (events: string): string => {
    let level = 0;
    return events.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease level for closing tags
      if (trimmed.startsWith('-')) {
        level = Math.max(0, level - 1);
      }

      const indented = ' '.repeat(level) + trimmed;

      // Increase level for opening tags
      if (trimmed.startsWith('+')) {
        level++;
      }

      return indented;
    }).filter(Boolean).join('\n');
  };

  // Generate test format in yaml-test-suite src/ style
  const generateTestFormat = (name: string, tags: string[], jsonOutput: string | null, username: string | null) => {
    let format = `name: ${name}\n`;

    if (username) {
      format += `from: '@${username}'\n`;
    }

    if (tags.length > 0) {
      format += `tags: ${tags.join(' ')}\n`;
    }

    if (isError) {
      format += `fail: true\n`;
    }

    // yaml with pipe literal
    format += `yaml: |\n`;
    format += yaml.split('\n').map(line => '  ' + line).join('\n') + '\n';

    // tree with proper indentation
    format += `tree: |\n`;
    const tree = transformEventsToTree(events);
    format += tree.split('\n').map(line => '  ' + line).join('\n') + '\n';

    // json if available
    if (jsonOutput) {
      format += `json: |\n`;
      format += jsonOutput.split('\n').map(line => '  ' + line).join('\n') + '\n';
    }

    return format;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(testFormat);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = testFormat;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Submit the PR
  const handleSubmitPR = async () => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const token = getGitHubToken() || '';
      const result = await submitTestPR({
        token,
        testId,
        testName,
        yaml,
        events,
        isError,
        similarTests,
        tags: selectedTags,
        from: githubUsername ? `https://github.com/${githubUsername}` : '',
      });

      if (result.success && result.prUrl) {
        setPrUrl(result.prUrl);
        setShowSuccess(true);
      } else {
        setErrorMessage(result.error || 'Failed to create PR');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit PR');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag].sort();
      }
    });
  };

  // Auto-call server when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setErrorMessage('');
      setShowSuccess(false);
      setPrUrl('');

      const loadData = async () => {
        try {
          const model = localStorage.getItem('github-model') || '';
          const githubToken = getGitHubToken() || '';

          const result = await previewTestPR({
            yaml,
            events,
            isError,
            model,
            githubToken
          });

          setTestId(result.testId);
          setTestName(result.testName);
          setSelectedTags(result.tags || []);
          setJson(result.json);
          setGithubUsername(result.githubUsername);
          setSimilarTests(result.similarTests || []);

          // Generate initial format
          const format = generateTestFormat(
            result.testName,
            result.tags || [],
            result.json,
            result.githubUsername
          );
          setTestFormat(format);
        } catch (error) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load test data');
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [isOpen, yaml, events, isError]);

  // Update format when tags change
  useEffect(() => {
    if (!loading && testName) {
      const format = generateTestFormat(testName, selectedTags, json, githubUsername);
      setTestFormat(format);
    }
  }, [selectedTags, testName, json, githubUsername, loading]);

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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {showSuccess ? 'PR Created!' : 'YAML Test Suite Format'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded text-sm">
              {errorMessage}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Generating test format...</p>
            </div>
          )}

          {/* Success state */}
          {showSuccess && !loading && (
            <div className="text-center py-8 space-y-4">
              <div className="text-green-600 dark:text-green-400 text-5xl">✓</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">PR Created Successfully!</p>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {prUrl}
              </a>
            </div>
          )}

          {/* Main content */}
          {!loading && !showSuccess && (
            <>
              <div>
                <textarea
                  id="test-format"
                  value={testFormat}
                  onChange={(e) => setTestFormat(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Tag multi-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Similar tests */}
              {similarTests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Potentially Similar Existing Tests
                    </label>
                    <button
                      onClick={regenerateSimilarTests}
                      disabled={regeneratingSimilar}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {regeneratingSimilar ? 'Searching...' : 'Search Again'}
                    </button>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 space-y-2">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
                      The following tests may already cover similar features:
                    </p>
                    <ul className="space-y-1.5">
                      {similarTests.map((test) => (
                        <li key={test.id}>
                          <a
                            href={test.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono flex items-start"
                          >
                            <span className="font-bold mr-2">{test.id}:</span>
                            <span className="flex-1">{test.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleSubmitPR}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating PR...' : 'Create PR'}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                This format can be used to submit a test case PR to the{' '}
                <a
                  href="https://github.com/yaml/yaml-test-suite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  yaml-test-suite
                </a>{' '}
                repository.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
