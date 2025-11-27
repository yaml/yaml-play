import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, drawSelection, highlightActiveLine, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { EditorState, Compartment, EditorSelection } from '@codemirror/state';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap } from '@codemirror/commands';
import { lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { ColorScheme } from '../lib/types';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  colorScheme: ColorScheme;
}

export interface CodeMirrorEditorHandle {
  focus: () => void;
  blur: () => void;
}

// Insert literal tab character at cursor position
const insertTab = (view: EditorView): boolean => {
  const { state } = view;
  const changes = state.changeByRange(range => {
    return {
      changes: { from: range.from, to: range.to, insert: '\t' },
      range: EditorSelection.cursor(range.from + 1),
    };
  });
  view.dispatch(changes);
  return true;
};

// Custom tab keymap - insert literal tab, don't indent
const tabKeymap = keymap.of([
  { key: 'Tab', run: insertTab },
]);

// Widget for rendering a space as a centered dot
class SpaceWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-space-dot';
    span.textContent = '·';
    return span;
  }
}

// Widget for rendering a tab as an arrow
class TabWidget extends WidgetType {
  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-tab-arrow';
    span.textContent = '→';
    return span;
  }
}

// Plugin to show whitespace characters
const showWhitespace = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const widgets: { from: number; to: number; decoration: Decoration }[] = [];

    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to);
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const pos = from + i;
        if (char === ' ') {
          widgets.push({
            from: pos,
            to: pos + 1,
            decoration: Decoration.replace({ widget: new SpaceWidget() }),
          });
        } else if (char === '\t') {
          widgets.push({
            from: pos,
            to: pos + 1,
            decoration: Decoration.replace({ widget: new TabWidget() }),
          });
        }
      }
    }

    return Decoration.set(widgets.map(w => w.decoration.range(w.from, w.to)));
  }
}, {
  decorations: v => v.decorations,
});

// Light theme
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  '.cm-content': {
    caretColor: '#000000',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    color: '#999999',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#e8e8e8',
  },
  '.cm-activeLine': {
    backgroundColor: '#f0f0f0',
  },
  '.cm-space-dot': {
    color: '#999999',
  },
  '.cm-tab-arrow': {
    color: '#999999',
    display: 'inline-block',
    width: 'calc(4ch)',
    textAlign: 'left',
  },
});

// High contrast theme
const highContrastTheme = EditorView.theme({
  '&': {
    backgroundColor: '#000000',
    color: '#ffffff',
  },
  '.cm-content': {
    caretColor: '#ffffff',
  },
  '.cm-gutters': {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#333333',
  },
  '.cm-activeLine': {
    backgroundColor: '#222222',
  },
  '.cm-space-dot': {
    color: '#ffff00',
  },
  '.cm-tab-arrow': {
    color: '#ffff00',
    display: 'inline-block',
    width: 'calc(4ch)',
    textAlign: 'left',
  },
});

// Dark theme base (complementing oneDark)
const darkThemeBase = EditorView.theme({
  '.cm-space-dot': {
    color: '#666666',
  },
  '.cm-tab-arrow': {
    color: '#666666',
    display: 'inline-block',
    width: 'calc(4ch)',
    textAlign: 'left',
  },
});

function getTheme(colorScheme: ColorScheme) {
  switch (colorScheme) {
    case 'light':
      return [lightTheme];
    case 'high-contrast':
      return [highContrastTheme];
    case 'dark':
    default:
      return [oneDark, darkThemeBase];
  }
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, CodeMirrorEditorProps>(
  function CodeMirrorEditor({ value, onChange, colorScheme }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());

  useImperativeHandle(ref, () => ({
    focus: () => {
      viewRef.current?.focus();
    },
    blur: () => {
      viewRef.current?.contentDOM.blur();
    },
  }), []);

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        yaml(),
        tabKeymap,
        keymap.of(defaultKeymap),
        EditorState.tabSize.of(4),
        showWhitespace,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        themeCompartment.current.of(getTheme(colorScheme)),
        EditorView.lineWrapping,
      ],
    });

    viewRef.current = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update content when value changes externally
  const updateContent = useCallback((newValue: string) => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== newValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: newValue },
      });
    }
  }, []);

  useEffect(() => {
    updateContent(value);
  }, [value, updateContent]);

  // Update theme when colorScheme changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: themeCompartment.current.reconfigure(getTheme(colorScheme)),
    });
  }, [colorScheme]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
      style={{ fontSize: '14px' }}
    />
  );
});
