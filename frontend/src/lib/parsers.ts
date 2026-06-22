import { ParserInfo } from './types';

// Parser definitions - will be replaced by generated parsers.json from Config.mk
export const parsers: ParserInfo[] = [
  {
    id: 'refparse',
    name: 'Reference Parser',
    version: 'f00319457419feacddf743d75eb317dacf5caf4b',
    repo: 'https://github.com/yaml/yaml-reference-parser',
    language: 'JavaScript',
    isJavaScript: true,
  },
  {
    id: 'npmyaml',
    name: 'eemeli/yaml',
    version: '3.0.0-0',
    repo: 'https://github.com/eemeli/yaml',
    language: 'JavaScript',
    isJavaScript: true,
  },
  {
    id: 'libyaml',
    name: 'libyaml',
    version: '0.2.5',
    repo: 'https://github.com/yaml/libyaml',
    language: 'C',
  },
  {
    id: 'pyyaml',
    name: 'PyYAML',
    version: '6.0.3',
    language: 'Python',
  },
  {
    id: 'ruamel',
    name: 'ruamel.yaml',
    version: '0.19.1',
    language: 'Python',
  },
  {
    id: 'goyaml',
    name: 'go-yaml',
    version: '348d6304d5a8f71e755d9c9c4599f8ef7053cc37',
    repo: 'https://github.com/pantoniou/yaml',
    language: 'Go',
  },
  {
    id: 'libfyaml',
    name: 'libfyaml',
    version: '1.0.0-alpha7',
    repo: 'https://github.com/pantoniou/libfyaml',
    language: 'C',
  },
  {
    id: 'rapid',
    name: 'rapidyaml',
    version: '0.15.2',
    repo: 'https://github.com/biojppm/rapidyaml',
    language: 'C++',
  },
  {
    id: 'rustyaml',
    name: 'serde-yaml',
    version: '0.10.4',
    repo: 'https://github.com/dtolnay/serde-yaml',
    language: 'Rust',
  },
  {
    id: 'snake',
    name: 'SnakeYAML',
    version: '2.5',
    repo: 'https://bitbucket.org/snakeyaml/snakeyaml',
    language: 'Java',
  },
  {
    id: 'snakeeng',
    name: 'SnakeYAML Engine',
    version: '3.0.1',
    repo: 'https://bitbucket.org/snakeyaml/snakeyaml-engine',
    language: 'Java',
  },
  {
    id: 'dotnet',
    name: 'YamlDotNet',
    version: '16.3.0',
    repo: 'https://github.com/aaubry/YamlDotNet',
    language: 'C#',
  },
  {
    id: 'luayaml',
    name: 'lyaml',
    version: '6.2.8',
    repo: 'https://github.com/gvvaughan/lyaml',
    language: 'Lua',
  },
  {
    id: 'nimyaml',
    name: 'NimYAML',
    version: '2.2.1',
    repo: 'https://github.com/flyx/NimYAML',
    language: 'Nim',
  },
  {
    id: 'ppyaml',
    name: 'YAML::PP',
    version: '0.039',
    language: 'Perl',
  },
  {
    id: 'hsyaml',
    name: 'HsYAML',
    version: '0.2.1.5',
    repo: 'https://github.com/haskell-hvr/HsYAML',
    language: 'Haskell',
  },
  {
    id: 'refhs',
    name: 'yamlreference',
    version: 'bf471f804ccd014fcdded3a8c74c338df8f33c85',
    repo: 'https://github.com/orenbenkiki/yamlreference',
    language: 'Haskell',
  },
];

export const getParser = (id: string): ParserInfo | undefined => {
  return parsers.find(p => p.id === id);
};

// Default visible parsers in display order (refparse is always first)
export const getDefaultVisibleParsers = (): string[] => {
  return parsers.map(p => p.id);
};

// Character mapping for compact URL encoding (refparse excluded - always shown)
export const PARSER_CHAR_MAP: Record<string, string> = {
  // Parser ID to character
  'dotnet': 'd',
  'goyaml': 'g',
  'hsyaml': 'h',
  'libfyaml': 'f',
  'libyaml': 'l',
  'luayaml': 'L',
  'nimyaml': 'n',
  'npmyaml': 'J',
  'ppyaml': 'P',
  'pyyaml': 'p',
  'rapid': 'x',
  'refhs': 'H',
  'ruamel': 'U',
  'rustyaml': 'r',
  'snake': 's',
  'snakeeng': 'S',
  // Character to parser ID (reverse mapping)
  'd': 'dotnet',
  'g': 'goyaml',
  'h': 'hsyaml',
  'f': 'libfyaml',
  'l': 'libyaml',
  'L': 'luayaml',
  'n': 'nimyaml',
  'J': 'npmyaml',
  'P': 'ppyaml',
  'p': 'pyyaml',
  'x': 'rapid',
  'H': 'refhs',
  'U': 'ruamel',
  'r': 'rustyaml',
  's': 'snake',
  'S': 'snakeeng',
};

// Encode visible parser IDs to compact character string (refparse excluded)
export const encodeVisibleParsers = (ids: string[]): string => {
  return ids
    .filter(id => id !== 'refparse')
    .map(id => PARSER_CHAR_MAP[id])
    .filter(Boolean)
    .join('');
};

// Decode compact character string to parser IDs (refparse not included in encoding)
export const decodeVisibleParsers = (code: string): string[] => {
  const decoded = code
    .split('')
    .map(char => PARSER_CHAR_MAP[char])
    .filter(Boolean);

  // Always include refparse first
  return ['refparse', ...decoded];
};
