interface ImportMetaEnv {
  readonly VITE_MAP_ENGINE?: "svg" | "tdt";
  readonly VITE_TIANDITU_TK?: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
