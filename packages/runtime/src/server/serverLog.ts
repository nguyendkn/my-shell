// Stub: server logger.
export interface ServerLogger {
  readonly info: (msg: string) => void;
  readonly warn: (msg: string) => void;
  readonly error: (msg: string) => void;
}
export function createServerLogger(): ServerLogger {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}
