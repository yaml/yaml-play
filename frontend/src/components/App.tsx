import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { InputPane, DEFAULT_YAML, InputPaneHandle } from './InputPane';
import { OutputPane } from './OutputPane';
import { StatusBar } from './StatusBar';
import { OptionsModal } from './OptionsModal';
import { SetupModal } from './SetupModal';
import { HeaderMenu } from './HeaderMenu';
import { HelpModal } from './HelpModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { CompareTestRunsModal } from './CompareTestRunsModal';
import { TestRunnerModal } from './TestRunnerModal';
import { SubmitPRModal } from './SubmitPRModal';
import { TokenEntryModal } from './TokenEntryModal';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useParserResults } from '../hooks/useParserResults';
import { useIsMobile, useIsLandscape } from '../hooks/useIsMobile';
import { useGitHubAuth } from '../hooks/useGitHubAuth';
import { getParser } from '../lib/parsers';
import { checkSandboxAvailable } from '../lib/sandbox';

// Read YAML from URL hash (base64 encoded)
function getYamlFromUrl(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    return atob(hash);
  } catch {
    return null;
  }
}

// Update URL hash with base64 encoded YAML
function updateUrlHash(yaml: string) {
  const hash = btoa(yaml);
  window.history.replaceState(null, '', `#${hash}`);
}

export default function App() {
  const [yamlInput, setYamlInput] = useState(() => {
    return getYamlFromUrl() || DEFAULT_YAML;
  });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedCompareParser, setSelectedCompareParser] = useState<string | null>(null);
  const [testFormatOpen, setTestFormatOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [sandboxAvailable, setSandboxAvailable] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputPaneRef = useRef<InputPaneHandle>(null);
  const secretKeyRef = useRef<string>('');
  const isMobile = useIsMobile(640);
  const isLandscape = useIsLandscape();
  const githubAuth = useGitHubAuth();

  // Check if GitHub token is configured (required for test submission)
  const hasTokens = () => {
    return githubAuth.isAuthenticated;
  };

  const {
    layout,
    updatePaneVisibility,
    togglePaneSelection,
    reorderPanes,
    resetLayout,
    showAllPanes,
    hideAllPanes,
    showSelectedPanes,
    clearSelectedPanes,
    showErrorPanes,
    getVisiblePanes,
    inputPaneWidth,
    setInputPaneWidth,
    colorScheme,
    setColorScheme,
    editorType,
    setEditorType,
  } = useLayoutPersistence();

  const {
    results,
    runAllParsers,
    getResult,
    getAgreementCount,
  } = useParserResults();

  const visiblePanes = getVisiblePanes();
  const { total, disagreeing, disagreeingNames, loading: parsersLoading } = getAgreementCount();

  // Track visible pane IDs as a stable string for dependency comparison
  const visiblePaneIds = visiblePanes.map(p => p.id).join(',');
  const lastRunRef = useRef<{ input: string; panes: string }>({ input: '', panes: '' });

  // Check if any parser result has a version mismatch
  const hasVersionMismatch = Array.from(results.values()).some(r => r.versionMismatch);

  // Check sandbox availability on mount and periodically
  useEffect(() => {
    const checkSandbox = async () => {
      const available = await checkSandboxAvailable();
      setSandboxAvailable(available);
    };
    checkSandbox();
    const interval = setInterval(checkSandbox, 10000);
    return () => clearInterval(interval);
  }, []);

  // Ensure refparse is always visible and first
  useEffect(() => {
    const refPane = layout.panes.find(p => p.id === 'refparse');
    if (refPane && !refPane.visible) {
      updatePaneVisibility('refparse', true);
    }
  }, [layout.panes, updatePaneVisibility]);

  // Update URL when input changes (debounced to avoid too many history entries)
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateUrlHash(yamlInput);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [yamlInput]);

  // Run parsers when input changes (debounced)
  useEffect(() => {
    // Skip if nothing changed
    if (lastRunRef.current.input === yamlInput && lastRunRef.current.panes === visiblePaneIds) {
      return;
    }

    const timeout = setTimeout(() => {
      const visibleIds = visiblePaneIds.split(',').filter(Boolean);
      if (visibleIds.length > 0) {
        lastRunRef.current = { input: yamlInput, panes: visiblePaneIds };
        runAllParsers(yamlInput, visibleIds);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [yamlInput, visiblePaneIds, runAllParsers]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInEditor = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('.monaco-editor') ||
        target.closest('.cm-editor');

      // Esc to unfocus input pane (works even when in editor)
      if (e.key === 'Escape' && isInEditor) {
        e.preventDefault();
        inputPaneRef.current?.blur();
        return;
      }

      // Don't trigger other shortcuts when typing in an input/textarea or editor
      if (isInEditor) {
        return;
      }

      const key = e.key.toUpperCase();

      // I for focus Input
      if (key === 'I' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputPaneRef.current?.focus();
      }
      // H for Help
      if (key === 'H' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setHelpOpen(true);
      }
      // O for Options
      if (key === 'O' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOptionsOpen(true);
      }
      // A for show All panes
      if (key === 'A' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        showAllPanes();
      }
      // N for hide all panes (None)
      if (key === 'N' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        hideAllPanes();
      }
      // S for show Selected panes
      if (key === 'S' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        showSelectedPanes();
      }
      // U for Unselect all panes (clear all checkboxes)
      if (key === 'U' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        clearSelectedPanes();
      }
      // C for Compare Test Runs
      if (key === 'C' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setCompareOpen(true);
      }
      // K for Keyboard shortcuts
      if (key === 'K' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      // G for GitHub
      if (key === 'G' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setTokenModalOpen(true);
      }
      // T for Test Format
      if (key === 'T' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (hasTokens()) {
          setTestFormatOpen(true);
        } else {
          setTokenModalOpen(true);
        }
      }
      // \\\ for clear input and focus
      if (e.key === '\\' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        secretKeyRef.current += '\\';
        if (secretKeyRef.current === '\\\\\\') {
          e.preventDefault();
          setYamlInput('');
          inputPaneRef.current?.focus();
          secretKeyRef.current = '';
        }
      }
      // D for show Differing panes
      if (key === 'D' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        // Find all panes that differ from refparse
        const differingPaneIds: string[] = [];
        results.forEach((result, id) => {
          if (id !== 'refparse' && result.agrees === false) {
            differingPaneIds.push(id);
          }
        });
        if (differingPaneIds.length > 0) {
          showErrorPanes(differingPaneIds);
        }
      }
      // Secret shortcut: XXX for factory reset
      if (key === 'X' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        secretKeyRef.current += 'X';
        if (secretKeyRef.current === 'XXX') {
          e.preventDefault();
          resetLayout();
          setYamlInput(DEFAULT_YAML);
          // Clear GitHub auth and model settings
          localStorage.removeItem('github-model');
          localStorage.removeItem('github-model-name');
          // Sign out of GitHub (this also clears github-token and github-user)
          githubAuth.logout();
          secretKeyRef.current = '';
        }
      } else if (e.key !== '\\' && key !== 'X') {
        secretKeyRef.current = '';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAllPanes, hideAllPanes, showSelectedPanes, showErrorPanes, results, resetLayout, githubAuth.isAuthenticated]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Don't allow dragging refparse
      if (active.id === 'refparse') return;
      reorderPanes(active.id as string, over.id as string);
    }
  }, [reorderPanes]);

  const refParser = getParser('refparse');

  // Mobile layout: just Input + Refparse (no Docker/sandbox on mobile)
  // Portrait: stacked vertically, Landscape: side by side
  if (isMobile) {
    return (
      <div className={`h-screen flex flex-col bg-gray-100 dark:bg-gray-900 ${colorScheme === 'dark' ? 'dark' : ''}`}>
        {/* Mobile Header */}
        <header className="bg-white dark:bg-gray-800 px-3 py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">YAML Playground</h1>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => { setHelpOpen(true); setMenuOpen(false); }}
                  className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); setMenuOpen(false); }}
                  className="w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Share
                </button>
                <a
                  href="https://github.com/yaml/yaml-play"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-4 py-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  GitHub
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Mobile main content - portrait: stacked, landscape: side by side */}
        <div className={`flex-1 flex ${isLandscape ? 'flex-row' : 'flex-col'} overflow-hidden min-h-0`}>
          <div className={`${isLandscape ? 'w-1/2 h-full' : 'h-1/2 w-full'} flex flex-col overflow-hidden ${isLandscape ? 'border-r border-gray-300 dark:border-gray-700' : 'border-b border-gray-300 dark:border-gray-700'}`}>
            <InputPane
              ref={inputPaneRef}
              value={yamlInput}
              onChange={setYamlInput}
              width={inputPaneWidth}
              onWidthChange={setInputPaneWidth}
              colorScheme={colorScheme}
              editorType={editorType}
              showBorder={false}
              isMobile={true}
              onSubmitPR={() => setTestFormatOpen(true)}
              onSignIn={() => setTokenModalOpen(true)}
              isGitHubAuthenticated={githubAuth.isAuthenticated}
            />
          </div>
          {refParser && (
            <div className={`${isLandscape ? 'w-1/2 h-full' : 'h-1/2 w-full'} flex flex-col overflow-hidden`}>
              <OutputPane
                parser={refParser}
                result={getResult('refparse')}
                isDraggable={false}
                onSetYamlInput={setYamlInput}
                showTestSuite={false}
              />
            </div>
          )}
        </div>

      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`h-screen flex flex-col bg-gray-100 dark:bg-gray-900 ${colorScheme === 'dark' ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">YAML Parser Playground</h1>
        <div className="flex items-center gap-2">
          {(!sandboxAvailable || hasVersionMismatch) && (
            <button
              onClick={() => setSetupOpen(true)}
              className="px-3 py-1.5 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              Setup
            </button>
          )}
          <HeaderMenu
            onHelp={() => setHelpOpen(true)}
            onOptions={() => setOptionsOpen(true)}
            onAllPanes={showAllPanes}
            onUnselectAll={clearSelectedPanes}
            onTestFormat={() => setTestFormatOpen(true)}
            onKeyboardShortcuts={() => setShortcutsOpen(true)}
            onSandboxSetup={() => setSetupOpen(true)}
            onAddTokens={() => setTokenModalOpen(true)}
            hasTokens={hasTokens()}
            onFactoryReset={() => {
              resetLayout();
              setYamlInput(DEFAULT_YAML);
              // Clear GitHub auth and model settings
              localStorage.removeItem('github-model');
              localStorage.removeItem('github-model-name');
              // Sign out of GitHub (this also clears github-token and github-user)
              githubAuth.logout();
            }}
          />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - Input pane and optionally refparse below when multi-row */}
        {(() => {
          const needsMultiRow = visiblePanes.length > 8;
          const otherPanes = needsMultiRow
            ? visiblePanes.filter(p => p.id !== 'refparse')
            : visiblePanes;

          return (
            <>
              <div
                key={needsMultiRow ? 'left-col-split' : 'left-col-full'}
                className={`${needsMultiRow ? 'grid grid-rows-2' : 'flex flex-col'} h-full border-r border-gray-300 dark:border-gray-700`}
                style={{ width: `${inputPaneWidth}px`, minWidth: '200px', maxWidth: '800px' }}
              >
                <InputPane
                  ref={inputPaneRef}
                  value={yamlInput}
                  onChange={setYamlInput}
                  width={inputPaneWidth}
                  onWidthChange={setInputPaneWidth}
                  colorScheme={colorScheme}
                  editorType={editorType}
                  showBorder={false}
                  heightMode={needsMultiRow ? 'half' : 'full'}
                  onSubmitPR={() => setTestFormatOpen(true)}
                  onSignIn={() => setTokenModalOpen(true)}
                  isGitHubAuthenticated={githubAuth.isAuthenticated}
                />
                {needsMultiRow && refParser && (
                  <div className="h-full overflow-hidden border-t border-gray-300 dark:border-gray-700">
                    <OutputPane
                      key="refparse-sidebar"
                      parser={refParser}
                      result={getResult('refparse')}
                      isDraggable={false}
                      onSetYamlInput={setYamlInput}
                    />
                  </div>
                )}
              </div>

              {/* Output panes in a grid layout */}
              <div className="flex-1 grid grid-cols-4 overflow-y-auto pane-container gap-px bg-gray-300 dark:bg-gray-700 auto-rows-fr">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={otherPanes.map(p => p.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {otherPanes.map(paneState => {
                      const parser = getParser(paneState.id);
                      if (!parser) return null;
                      const isRefParser = paneState.id === 'refparse';

                      return (
                        <OutputPane
                          key={paneState.id}
                          parser={parser}
                          result={getResult(paneState.id)}
                          onClose={isRefParser ? undefined : () => updatePaneVisibility(paneState.id, false)}
                          isDraggable={!isRefParser}
                          onSetYamlInput={setYamlInput}
                          isSelected={isRefParser ? false : (layout.selectedPaneIds?.includes(paneState.id) ?? false)}
                          onToggleSelection={isRefParser ? undefined : () => togglePaneSelection(paneState.id)}
                        />
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </>
          );
        })()}
      </div>

      {/* Status bar */}
      <StatusBar total={total} disagreeing={disagreeing} disagreeingNames={disagreeingNames} loading={parsersLoading} sandboxAvailable={sandboxAvailable} onSandboxSetup={() => setSetupOpen(true)} />

      {/* Options modal */}
      <OptionsModal
        isOpen={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        colorScheme={colorScheme}
        onColorSchemeChange={setColorScheme}
        editorType={editorType}
        onEditorTypeChange={setEditorType}
      />

      {/* Setup modal */}
      <SetupModal
        isOpen={setupOpen}
        onClose={() => {
          setSetupOpen(false);
          // Force refresh of parsers when modal closes
          const visibleIds = visiblePaneIds.split(',').filter(Boolean);
          if (visibleIds.length > 0) {
            runAllParsers(yamlInput, visibleIds);
          }
        }}
      />

      {/* Help modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Keyboard Shortcuts modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* Compare Test Runs modal */}
      <CompareTestRunsModal
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        onSelectParser={(parserId) => setSelectedCompareParser(parserId)}
      />

      {/* Test Format modal */}
      <SubmitPRModal
        isOpen={testFormatOpen}
        onClose={() => setTestFormatOpen(false)}
        yaml={yamlInput}
        events={getResult('refparse')?.output || ''}
        isError={(getResult('refparse')?.status ?? 0) !== 0}
        onConfigureModel={() => setTokenModalOpen(true)}
      />

      {/* Token Entry modal */}
      <TokenEntryModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        githubAuth={githubAuth}
      />

      {/* Test Runner modal for selected parser from Compare */}
      {selectedCompareParser && getParser(selectedCompareParser) && (
        <TestRunnerModal
          isOpen={true}
          onClose={() => setSelectedCompareParser(null)}
          parser={getParser(selectedCompareParser)!}
          onSelectTest={(yaml) => setYamlInput(yaml)}
          forceRerun={false}
          onCompare={() => {
            setSelectedCompareParser(null);
            setCompareOpen(true);
          }}
        />
      )}
    </div>
  );
}
