declare global {
  interface Window {
    electron?: {
      secrets?: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        clear: (key: string) => Promise<boolean>;
      };
      news?: {
        fetch: (options: { apiKey?: string; country?: string; pageSize?: number }) => Promise<{ ok: boolean; status?: number; body?: any; error?: string | null }>;
        proxyPort: () => Promise<number>;
      };
      spotify?: {
        startAuth: (authUrl: string, redirectUri: string) => Promise<Record<string, string> | { cancelled: true } | { error: string } | null>;
      };
      debug?: {
        log: (message: string) => Promise<void>;
        filePath: () => Promise<string>;
      };
    };
  }
}

export {};
