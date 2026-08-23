interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface D1Database {}

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    TIANDITU_TK?: string;
    VITE_MAP_ENGINE?: string;
    VITE_TIANDITU_TK?: string;
  };
}
