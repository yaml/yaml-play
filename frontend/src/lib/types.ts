export interface ParserInfo {
  id: string;
  name: string;
  version: string;
  repo?: string;
  language: string;
  isJavaScript?: boolean;
}

export interface ParserResult {
  parserId: string;
  output: string;
  status: number;  // 0 = success, non-zero = parse error
  error?: string;  // HTTP/network error
  loading: boolean;
  matches?: boolean;  // For header color: green = valid YAML + matches refparse
  agrees?: boolean;   // For status bar: does this parser agree with refparse?
  versionMismatch?: {
    required: string;
    found: string;
  };
}

export interface PaneState {
  id: string;
  visible: boolean;
  order: number;
}

export type ColorScheme = 'dark' | 'light';

export type EditorType = 'monaco' | 'codemirror';

export interface LayoutState {
  panes: PaneState[];
  inputPaneWidth?: number;
  colorScheme?: ColorScheme;
  editorType?: EditorType;
  selectedPaneIds?: string[];
}
