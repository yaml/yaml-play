import { useState, useEffect, useRef } from 'react';
import { loadTestSuite, TestCase } from '../lib/testsuite';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (yaml: string) => void;
}

export function TestSuiteModal({ isOpen, onClose, onSelect }: TestSuiteModalProps) {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [filteredTests, setFilteredTests] = useState<TestCase[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regexError, setRegexError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load tests when modal opens
  useEffect(() => {
    if (isOpen && tests.length === 0 && !loading) {
      setLoading(true);
      loadTestSuite()
        .then(data => {
          setTests(data.tests);
          setFilteredTests(data.tests);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [isOpen, tests.length, loading]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter tests with regex when search changes
  useEffect(() => {
    if (!search) {
      setFilteredTests(tests);
      setRegexError(null);
      return;
    }

    try {
      const regex = new RegExp(search, 'i');
      setRegexError(null);
      setFilteredTests(tests.filter(test =>
        regex.test(test.id) || regex.test(test.name)
      ));
    } catch {
      setRegexError('Invalid regex');
      setFilteredTests([]);
    }
  }, [search, tests]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (test: TestCase) => {
    onSelect(test.yaml);
    onClose();
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Search{' '}
            <a
              href="https://github.com/yaml/yaml-test-suite/tree/data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              YAML Test Suite
            </a>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            X
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-gray-700">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by regex (e.g., 'block.*map' or 'spec example')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          {regexError && (
            <div className="mt-1 text-red-400 text-sm">{regexError}</div>
          )}
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-gray-400">Loading tests...</div>
          )}
          {error && (
            <div className="p-8 text-center text-red-400">{error}</div>
          )}
          {!loading && !error && filteredTests.map(test => (
            <button
              key={test.id}
              onClick={() => handleSelect(test)}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <span className={`font-mono ${test.error ? 'text-red-400' : 'text-blue-400'}`}>{test.id}</span>
              <span className="text-gray-400 mx-2">-</span>
              <span className="text-gray-200">{test.name}</span>
            </button>
          ))}
          {!loading && !error && filteredTests.length === 0 && search && !regexError && (
            <div className="p-8 text-center text-gray-400">No tests match your search</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700 text-sm text-gray-500 flex justify-between">
          <span>{filteredTests.length} of {tests.length} tests</span>
          <span>(E) = expected parse error</span>
        </div>
      </div>
    </div>
  );
}
