/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KARAOKE_API_URL?: string;
  /** Polling interval for GET /api/karaoke/state (ms). Default ~60000. Min 1000. */
  readonly VITE_KARAOKE_POLL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
