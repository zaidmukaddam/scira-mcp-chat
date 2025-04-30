declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: unknown) => void;
        on: (
          channel: string,
          listener: (event: unknown, ...args: unknown[]) => void,
        ) => void;
      };
      python: {
        execute: (
          scriptPath: string,
          args: string[],
        ) => Promise<{
          stdout?: string;
          stderr?: string;
          code?: number;
          error?: string;
        }>;
      };
      node: {
        execute: (
          scriptPath: string,
          args: string[],
        ) => Promise<{
          stdout?: string;
          stderr?: string;
          code?: number;
          error?: string;
        }>;
      };
      env: {
        get: (name: string) => Promise<string | undefined>;
      };
    };
  }
}

export {};
