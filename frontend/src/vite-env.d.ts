/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANDBOX_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
