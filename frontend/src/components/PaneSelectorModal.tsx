import { useEffect } from 'react';
import { parsers } from '../lib/parsers';
import { PaneState, ColorScheme, EditorType } from '../lib/types';

interface PaneSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  paneStates: PaneState[];
  onToggleVisibility: (id: string, visible: boolean) => void;
  onReset: () => void;
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  editorType: EditorType;
  onEditorTypeChange: (type: EditorType) => void;
}

const COLOR_SCHEMES: { id: ColorScheme; label: string }[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'high-contrast', label: 'High Contrast' },
];

const EDITOR_TYPES: { id: EditorType; label: string }[] = [
  { id: 'monaco', label: 'Monaco' },
  { id: 'codemirror', label: 'CodeMirror' },
];

export function PaneSelectorModal({
  isOpen,
  onClose,
  paneStates,
  onToggleVisibility,
  onReset,
  colorScheme,
  onColorSchemeChange,
  editorType,
  onEditorTypeChange,
}: PaneSelectorModalProps) {
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

  const paneMap = new Map(paneStates.map(p => [p.id, p]));
  const sortedParsers = [...parsers]
    .filter(p => p.id !== 'refparse')
    .sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
            Editor
          </h3>
          <div className="flex gap-2 mb-4">
            {EDITOR_TYPES.map(editor => (
              <button
                key={editor.id}
                onClick={() => onEditorTypeChange(editor.id)}
                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                  editorType === editor.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {editor.label}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
            Color Scheme
          </h3>
          <div className="flex gap-2 mb-4">
            {COLOR_SCHEMES.map(scheme => (
              <button
                key={scheme.id}
                onClick={() => onColorSchemeChange(scheme.id)}
                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                  colorScheme === scheme.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {scheme.label}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
            Options
          </h3>
          <button
            onClick={onReset}
            className="w-full text-left py-2 px-2 rounded text-red-500 hover:bg-gray-700 transition-colors"
          >
            Click here to clear all settings
          </button>

          <h3 className="text-sm font-semibold text-gray-400 mb-2 mt-4 uppercase">
            Parser Panes
          </h3>
          {sortedParsers.map(parser => {
            const state = paneMap.get(parser.id);
            const isVisible = state?.visible ?? false;

            return (
              <label
                key={parser.id}
                className="flex items-center gap-3 py-2 px-2 rounded cursor-pointer hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => onToggleVisibility(parser.id, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-white font-medium">{parser.id}</span>
                <span className="text-xs text-gray-400">{parser.language}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
