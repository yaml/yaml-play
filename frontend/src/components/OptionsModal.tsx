import { useEffect } from 'react';
import { ColorScheme, EditorType } from '../lib/types';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  editorType: EditorType;
  onEditorTypeChange: (type: EditorType) => void;
}

const COLOR_SCHEMES: { id: ColorScheme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

const EDITOR_TYPES: { id: EditorType; label: string }[] = [
  { id: 'monaco', label: 'Monaco' },
  { id: 'codemirror', label: 'CodeMirror' },
];

export function OptionsModal({
  isOpen,
  onClose,
  colorScheme,
  onColorSchemeChange,
  editorType,
  onEditorTypeChange,
}: OptionsModalProps) {
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Options</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
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
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {editor.label}
              </button>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
            Mode
          </h3>
          <div className="flex gap-2">
            {COLOR_SCHEMES.map(scheme => (
              <button
                key={scheme.id}
                onClick={() => onColorSchemeChange(scheme.id)}
                className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
                  colorScheme === scheme.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {scheme.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
