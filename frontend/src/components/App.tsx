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
import { PaneSelectorModal } from './PaneSelectorModal';
import { HelpModal } from './HelpModal';
import { SetupModal } from './SetupModal';
import { useLayoutPersistence } from '../hooks/useLayoutPersistence';
import { useParserResults } from '../hooks/useParserResults';
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
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sandboxAvailable, setSandboxAvailable] = useState(true);
  const inputPaneRef = useRef<InputPaneHandle>(null);
  const secretKeyRef = useRef<string>('');

  const {
    layout,
    updatePaneVisibility,
    reorderPanes,
    resetLayout,
    showAllPanes,
    hideAllPanes,
    showSelectedPanes,
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
      // P for Preferences
      if (key === 'P' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSelectorOpen(true);
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
      // Secret shortcut: XXX for settings reset
      if (key === 'X' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        secretKeyRef.current += 'X';
        if (secretKeyRef.current === 'XXX') {
          e.preventDefault();
          resetLayout();
          setYamlInput(DEFAULT_YAML);
          secretKeyRef.current = '';
        }
      } else {
        secretKeyRef.current = '';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAllPanes, hideAllPanes, showSelectedPanes, showErrorPanes, results, resetLayout]);

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

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">YAML Parser Playground</h1>
        <div className="flex items-center gap-2">
          {(!sandboxAvailable || hasVersionMismatch) && (
            <button
              onClick={() => setSetupOpen(true)}
              className="px-3 py-1.5 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400 transition-colors text-sm"
            >
              Setup
            </button>
          )}
          <button
            onClick={() => setSelectorOpen(true)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Preferences
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="px-3 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Help
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column - Input pane and optionally refparse below when multi-row */}
        {(() => {
          const needsMultiRow = visiblePanes.length > 8;
          const refParser = getParser('refparse');
          const otherPanes = needsMultiRow
            ? visiblePanes.filter(p => p.id !== 'refparse')
            : visiblePanes;

          return (
            <>
              <div
                key={needsMultiRow ? 'left-col-split' : 'left-col-full'}
                className={`${needsMultiRow ? 'grid grid-rows-2' : 'flex flex-col'} h-full border-r border-gray-700`}
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
                />
                {needsMultiRow && refParser && (
                  <div className="h-full overflow-hidden border-t border-gray-700">
                    <OutputPane
                      key="refparse-sidebar"
                      parser={refParser}
                      result={getResult('refparse')}
                      isDraggable={false}
                    />
                  </div>
                )}
              </div>

              {/* Output panes in a grid layout */}
              <div className="flex-1 grid grid-cols-4 overflow-y-auto pane-container gap-px bg-gray-700 auto-rows-fr">
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
      <StatusBar total={total} disagreeing={disagreeing} disagreeingNames={disagreeingNames} loading={parsersLoading} sandboxAvailable={sandboxAvailable} />

      {/* Parser selector modal */}
      <PaneSelectorModal
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        paneStates={layout.panes}
        onToggleVisibility={updatePaneVisibility}
        onReset={() => {
          resetLayout();
          setYamlInput(DEFAULT_YAML);
        }}
        colorScheme={colorScheme}
        onColorSchemeChange={setColorScheme}
        editorType={editorType}
        onEditorTypeChange={setEditorType}
      />

      {/* Help modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
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
    </div>
  );
}
