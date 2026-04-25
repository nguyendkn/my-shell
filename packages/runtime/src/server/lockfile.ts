// Stub: server lockfile management. No-op side-effect import.
export async function acquire(_path?: string): Promise<() => Promise<void>> {
  return async () => {};
}

export interface ServerLockInfo {
  pid: number;
  port: number;
  host: string;
  httpUrl: string;
  startedAt: number;
}

export async function writeServerLock(_info: ServerLockInfo): Promise<void> {}
export async function removeServerLock(): Promise<void> {}
export async function probeRunningServer(): Promise<ServerLockInfo | null> {
  return null;
}
