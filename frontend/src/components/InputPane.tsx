import { useState, useCallback, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { ColorScheme, EditorType } from '../lib/types';
import { CodeMirrorEditor, CodeMirrorEditorHandle } from './CodeMirrorEditor';
import { TestSuiteModal } from './TestSuiteModal';
import * as monaco from 'monaco-editor';

interface InputPaneProps {
  value: string;
  onChange: (value: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  colorScheme: ColorScheme;
  editorType: EditorType;
  showBorder?: boolean;
  heightMode?: 'full' | 'half';
  isMobile?: boolean;
  onSubmitPR?: () => void;
  onSignIn?: () => void;
  isGitHubAuthenticated?: boolean;
}

export interface InputPaneHandle {
  focus: () => void;
  blur: () => void;
}

// Map color schemes to Monaco themes
const MONACO_THEMES: Record<ColorScheme, string> = {
  'dark': 'vs-dark',
  'light': 'light',
};

const DEFAULT_YAML = `\
# Edit this YAML and see how
# different parsers handle it.

# Green = matches reference parser
# Red = differs or errored

name: YAML Parser Playground

url: https://play.yaml.com/
repo:
  https://github.com/yaml/yaml-play

current parsers: 17
actively maintained: true

features:
- Compare outputs from multiple
  YAML parsers
- Search and load tests from the
  YAML Test Suite
- Select and drag output panes
- Click Help for shortcut keys
`;

const MIN_WIDTH = 200;
const MAX_WIDTH = 800;

export const InputPane = forwardRef<InputPaneHandle, InputPaneProps>(function InputPane(
  { value, onChange, width, onWidthChange, colorScheme, editorType, showBorder = true, heightMode = 'full', isMobile = false, onSubmitPR, onSignIn, isGitHubAuthenticated = false },
  ref
) {
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const codeMirrorRef = useRef<CodeMirrorEditorHandle>(null);
  const [testSuiteOpen, setTestSuiteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (editorType === 'codemirror') {
        codeMirrorRef.current?.focus();
      } else {
        monacoEditorRef.current?.focus();
      }
    },
    blur: () => {
      if (editorType === 'codemirror') {
        codeMirrorRef.current?.blur();
      } else {
        const domNode = monacoEditorRef.current?.getDomNode();
        if (domNode) {
          (document.activeElement as HTMLElement)?.blur();
        }
      }
    },
  }), [editorType]);

  // Force tab settings on the model after mount
  const handleEditorMount: OnMount = useCallback((editor) => {
    monacoEditorRef.current = editor;
    const model = editor.getModel();
    if (model) {
      model.updateOptions({
        tabSize: 4,
        insertSpaces: false,
      });
    }
    // Track focus state for Monaco
    editor.onDidFocusEditorText(() => setIsFocused(true));
    editor.onDidBlurEditorText(() => setIsFocused(false));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = e.clientX - startX.current;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, onWidthChange]);

  const heightClass = heightMode === 'full' ? 'h-full' : 'h-full overflow-hidden';
  const borderClass = showBorder ? 'border-r border-gray-300 dark:border-gray-700' : '';
  const focusBorderClass = isFocused ? 'ring-2 ring-blue-500 ring-inset' : '';

  const containerStyle = isMobile
    ? {}  // Let parent control size on mobile
    : { width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` };

  return (
    <div
      className={`flex flex-col ${heightClass} ${isMobile ? 'w-full border-b border-gray-300 dark:border-gray-700' : borderClass} ${focusBorderClass} relative transition-shadow`}
      style={containerStyle}
    >
      <div className="bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
        <h2 className={`font-semibold transition-colors ${isFocused ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
          {isFocused ? 'YAML Input Editor (editing)' : 'YAML Input Editor'}
        </h2>
        <div className="flex items-center gap-1">
          {!isMobile && (onSubmitPR || onSignIn) && (
            <button
              onClick={() => {
                if (isGitHubAuthenticated && onSubmitPR) {
                  onSubmitPR();
                } else if (onSignIn) {
                  onSignIn();
                }
              }}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              title="Submit to yaml-test-suite"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
          )}
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
            title="Copy YAML"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1"
              title="Menu"
            >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-lg z-50 min-w-[160px]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setTestSuiteOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Search Test Suite
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onChange('');
                  if (editorType === 'codemirror') {
                    codeMirrorRef.current?.focus();
                  } else {
                    monacoEditorRef.current?.focus();
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onChange(DEFAULT_YAML);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Default YAML
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {editorType === 'codemirror' ? (
          <CodeMirrorEditor
            ref={codeMirrorRef}
            value={value}
            onChange={onChange}
            colorScheme={colorScheme}
            onFocusChange={setIsFocused}
          />
        ) : (
          <Editor
            height="100%"
            defaultLanguage="yaml"
            defaultValue={DEFAULT_YAML}
            value={value}
            onChange={(val) => onChange(val || '')}
            theme={MONACO_THEMES[colorScheme]}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              lineNumbers: 'on',
              renderWhitespace: 'all',
              tabSize: 4,
              insertSpaces: false,
              detectIndentation: false,
              useTabStops: false,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        )}
      </div>
      {/* Resize handle - hidden on mobile */}
      {!isMobile && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={handleMouseDown}
        />
      )}
      <TestSuiteModal
        isOpen={testSuiteOpen}
        onClose={() => setTestSuiteOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
});

export { DEFAULT_YAML };
