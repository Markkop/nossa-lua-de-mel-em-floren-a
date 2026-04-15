/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PIX_CODE_MARK?: string;
  readonly VITE_PIX_CODE_YOSHA?: string;
  readonly VITE_KARAOKE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
