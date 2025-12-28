import { useEffect, useState, useCallback, useMemo } from 'react';
import { previewTestPR, submitTestPR, getGitHubModels, generateFinalFile } from '../lib/sandbox';
import { getGitHubToken } from '../lib/oauth';
import { useIsMobile } from '../hooks/useIsMobile';

interface SubmitPRModalProps {
  isOpen: boolean;
  onClose: () => void;
  yaml: string;
  events: string;
  isError: boolean;
  onConfigureModel?: () => void;
}

type ModalState = 'generating' | 'preview' | 'submitting' | 'success' | 'error';

interface SimilarTest {
  id: string;
  name: string;
  url: string;
}

export function SubmitPRModal({ isOpen, onClose, yaml, events, isError, onConfigureModel }: SubmitPRModalProps) {
  const isMobile = useIsMobile(640);
  const [state, setState] = useState<ModalState>('generating');
  const [testId, setTestId] = useState('');
  const [testName, setTestName] = useState('');
  const [similarTests, setSimilarTests] = useState<SimilarTest[]>([]);
  const [prUrl, setPrUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fromAttribution, setFromAttribution] = useState('');
  const [invalidTags, setInvalidTags] = useState<string[]>([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [modelName, setModelName] = useState<string>('');
  const [llmError, setLlmError] = useState<string>('');
  const [regeneratingSimilar, setRegeneratingSimilar] = useState(false);
  const [finalFileContent, setFinalFileContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [includeJson, setIncludeJson] = useState(false);
  const [includeDump, setIncludeDump] = useState(false);
  const [updatingPreview, setUpdatingPreview] = useState(false);

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalFileContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = finalFileContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Regenerate final file preview
  const regenerateFinalFile = useCallback(async () => {
    if (!testName.trim()) {
      setFinalFileContent('');
      setUpdatingPreview(false);
      return;
    }

    setUpdatingPreview(true);
    try {
      const result = await generateFinalFile({
        testName,
        from: fromAttribution,
        tags: selectedTags,
        yaml,
        events,
        isError,
        includeJson,
        includeDump,
      });
      setFinalFileContent(result.finalFileContent);
    } catch (error) {
      console.error('Failed to regenerate final file:', error);
    } finally {
      setUpdatingPreview(false);
    }
  }, [testName, fromAttribution, selectedTags, yaml, events, isError, includeJson, includeDump]);

  // Debounce the regeneration
  const debouncedRegenerateFinalFile = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(regenerateFinalFile, 300);
    };
  }, [regenerateFinalFile]);

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
        testName: testName,  // Pass current name for better context
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

  // Generate preview when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setState('generating');
    setTestId('');
    setTestName('');
    setSimilarTests([]);
    setPrUrl('');
    setErrorMessage('');
    setAvailableTags([]);
    setSelectedTags([]);
    setFromAttribution('');
    setInvalidTags([]);
    setTagsDropdownOpen(false);
    setModelName('');

    const generate = async () => {
      try {
        const model = localStorage.getItem('github-model') || '';
        let modelDisplayName = localStorage.getItem('github-model-name') || '';

        // If we have a model but no display name, fetch it
        if (model && !modelDisplayName) {
          const githubToken = getGitHubToken() || '';
          if (githubToken) {
            try {
              const models = await getGitHubModels(githubToken);
              const selectedModel = models.find(m => m.id === model);
              if (selectedModel) {
                modelDisplayName = `${selectedModel.publisher}/${selectedModel.name}`;
                localStorage.setItem('github-model-name', modelDisplayName);
              }
            } catch (error) {
              console.error('Failed to fetch model name:', error);
            }
          }
        }

        setModelName(modelDisplayName);
        const githubToken = getGitHubToken() || '';
        const result = await previewTestPR({ yaml, events, isError, model, githubToken });

        setTestId(result.testId);
        setTestName(result.testName || ''); // Use LLM-generated name or empty for manual mode
        setSimilarTests(result.similarTests || []);
        setAvailableTags(result.availableTags || []);
        setSelectedTags(result.tags || []); // Use LLM-suggested tags
        setLlmError(result.llmError || '');

        // Set from attribution with GitHub username
        if (result.githubUsername) {
          setFromAttribution(`https://github.com/${result.githubUsername}`);
        }

        // Set final file content from server
        if (result.finalFileContent) {
          setFinalFileContent(result.finalFileContent);
        }

        setState('preview');
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to generate preview');
        setState('error');
      }
    };

    generate();
  }, [isOpen, yaml, events, isError]);

  // Regenerate final file when dependencies change
  useEffect(() => {
    if (state === 'preview' && testName.trim()) {
      debouncedRegenerateFinalFile();
    }
  }, [testName, selectedTags, includeJson, includeDump, state, debouncedRegenerateFinalFile]);

  // Handle tag toggle from dropdown
  const handleTagToggle = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter(t => t !== tag);
    setSelectedTags(newTags);
  };

  // Debounced validation: wait 1 second after last change to validate tags
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state === 'preview') {
        const invalid = selectedTags.filter(tag => !availableTags.includes(tag));
        setInvalidTags(invalid);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedTags, availableTags, state]);

  const handleSubmit = async () => {
    const token = getGitHubToken();
    if (!token) {
      setErrorMessage('No GitHub token found');
      setState('error');
      return;
    }

    // Validation
    if (!testName.trim()) {
      setErrorMessage('Test name is required');
      setState('error');
      return;
    }

    if (selectedTags.length === 0) {
      setErrorMessage('At least one tag must be selected');
      setState('error');
      return;
    }

    setState('submitting');

    try {
      const result = await submitTestPR({
        token,
        testId,
        testName,
        yaml,
        events,
        isError,
        similarTests,
        tags: selectedTags,
        from: fromAttribution,
      });

      if (result.success && result.prUrl) {
        setPrUrl(result.prUrl);
        setState('success');
      } else {
        setErrorMessage(result.error || 'Failed to create PR');
        setState('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit PR');
      setState('error');
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Submit to yaml-test-suite
            </h2>
            {modelName && onConfigureModel && (
              <button
                onClick={onConfigureModel}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                using {modelName}
              </button>
            )}
            {onConfigureModel && !modelName && (
              <button
                onClick={onConfigureModel}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Configure AI model
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Generating state */}
          {state === 'generating' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Generating new test ID, name and tags...</p>
            </div>
          )}

          {/* Preview state */}
          {state === 'preview' && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Test ID:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{testId}</span>
              </div>

              {llmError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-xs text-red-800 dark:text-red-200 mb-2">
                    <strong>AI Error:</strong>{' '}
                    {llmError.split(/(\(https?:\/\/[^)]+\))/).map((part, i) => {
                      const urlMatch = part.match(/\((https?:\/\/[^)]+)\)/);
                      if (urlMatch) {
                        return (
                          <span key={i}>
                            (
                            <a
                              href={urlMatch[1]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {urlMatch[1]}
                            </a>
                            )
                          </span>
                        );
                      }
                      return part;
                    })}
                  </p>
                  <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                    <li>Try 'docker logs yaml-play' or the browser console for more error info.</li>
                    <li>You might try a different model or just try this one again.</li>
                    <li>Otherwise, just fill in the test name and tags manually.</li>
                  </ul>
                </div>
              )}

              {!llmError && !localStorage.getItem('github-model') && onConfigureModel && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Tip:</strong> Enable AI-assisted test naming by{' '}
                    <button
                      onClick={onConfigureModel}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      configuring a GitHub model
                    </button>
                    . Otherwise, fill in the test name and tags manually.
                  </p>
                </div>
              )}

              {/* Test Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test Name {!testName.trim() && <span className="text-red-600">*</span>}
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Multiline plain scalar in flow sequence"
                />
              </div>

              {/* Tags Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags {selectedTags.length === 0 && <span className="text-red-600">*</span>}
                  {selectedTags.length > 0 && (
                    <span className="text-gray-500 font-normal ml-2">({selectedTags.length} selected)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-left text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedTags.length > 0 ? selectedTags.join(', ') : 'Select tags...'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${tagsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tagsDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto">
                    {availableTags.map(tag => (
                      <label
                        key={tag}
                        className="flex items-center px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={(e) => handleTagToggle(tag, e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Fields Checkboxes */}
              <div className="space-y-2">
                <label className={`flex items-center ${isError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={includeJson}
                    onChange={(e) => setIncludeJson(e.target.checked)}
                    disabled={isError}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include 'json' section</span>
                </label>
                <label className={`flex items-center ${isError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={includeDump}
                    onChange={(e) => setIncludeDump(e.target.checked)}
                    disabled={isError}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 mr-2 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include 'dump' section (canonical YAML)</span>
                </label>
              </div>

              {/* Final File Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Final File Content
                    </label>
                    {updatingPreview && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    disabled={!finalFileContent}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
                <pre className="w-full h-[20rem] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm overflow-auto whitespace-pre">
{finalFileContent || 'Enter a test name to see the final file content...'}
                </pre>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This is the exact file that will be submitted to yaml-test-suite.
                </p>
              </div>

              {/* Similar Tests Section */}
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
            </>
          )}

          {/* Submitting state */}
          {state === 'submitting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Creating pull request...</p>
            </div>
          )}

          {/* Success state */}
          {state === 'success' && (
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

          {/* Error state */}
          {state === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
                <p className="font-semibold mb-2">Error</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Footer with Submit button - only show in preview state and not on mobile */}
        {state === 'preview' && !isMobile && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {(!testName.trim() || selectedTags.length === 0 || invalidTags.length > 0) && (
              <p className="text-xs text-red-600 dark:text-red-400 text-center mb-2">
                {invalidTags.length > 0
                  ? `Invalid tags: ${invalidTags.join(', ')}`
                  : 'Please fill in test name and select at least one tag'}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={!testName.trim() || selectedTags.length === 0 || invalidTags.length > 0}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              Submit PR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
