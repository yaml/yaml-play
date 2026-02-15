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
    version: '2.8.2',
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
    version: '0.18.17',
    language: 'Python',
  },
  {
    id: 'goyaml',
    name: 'go-yaml',
    version: 'main',
    repo: 'https://github.com/pantoniou/yaml',
    language: 'Go',
  },
  {
    id: 'libfyaml',
    name: 'libfyaml',
    version: '0.9.4',
    repo: 'https://github.com/pantoniou/libfyaml',
    language: 'C',
  },
  {
    id: 'rapid',
    name: 'rapidyaml',
    version: '0.10.0',
    repo: 'https://github.com/biojppm/rapidyaml',
    language: 'C++',
  },
  {
    id: 'rustyaml',
    name: 'serde-yaml',
    version: '0.9.34',
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
  return ['refparse', 'pyyaml', 'libyaml', 'goyaml'];
};
