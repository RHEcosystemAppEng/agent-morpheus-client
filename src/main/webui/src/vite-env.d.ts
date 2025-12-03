/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STANDALONE?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

