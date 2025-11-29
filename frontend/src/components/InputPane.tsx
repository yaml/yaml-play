import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
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
}

export interface InputPaneHandle {
  focus: () => void;
  blur: () => void;
}

// Map color schemes to Monaco themes
const MONACO_THEMES: Record<ColorScheme, string> = {
  'dark': 'vs-dark',
  'light': 'light',
  'high-contrast': 'hc-black',
};

const DEFAULT_YAML = `# Try editing this YAML
name: YAML Parser Playground
version: 1.0
features:
- Compare parser outputs
- Visual whitespace
- Drag & drop panes
`;

const MIN_WIDTH = 200;
const MAX_WIDTH = 800;

export const InputPane = forwardRef<InputPaneHandle, InputPaneProps>(function InputPane(
  { value, onChange, width, onWidthChange, colorScheme, editorType, showBorder = true, heightMode = 'full' },
  ref
) {
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const codeMirrorRef = useRef<CodeMirrorEditorHandle>(null);
  const [testSuiteOpen, setTestSuiteOpen] = useState(false);

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
  const borderClass = showBorder ? 'border-r border-gray-700' : '';

  return (
    <div
      className={`flex flex-col ${heightClass} ${borderClass} relative`}
      style={{ width: `${width}px`, minWidth: `${MIN_WIDTH}px`, maxWidth: `${MAX_WIDTH}px` }}
    >
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-white font-semibold">YAML Input</h2>
        <button
          onClick={() => setTestSuiteOpen(true)}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Test Suite
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {editorType === 'codemirror' ? (
          <CodeMirrorEditor
            ref={codeMirrorRef}
            value={value}
            onChange={onChange}
            colorScheme={colorScheme}
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
      {/* Resize handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <TestSuiteModal
        isOpen={testSuiteOpen}
        onClose={() => setTestSuiteOpen(false)}
        onSelect={onChange}
      />
    </div>
  );
});

export { DEFAULT_YAML };
