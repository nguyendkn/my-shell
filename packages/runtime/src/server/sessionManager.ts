// Stub: SessionManager. Disabled in external builds.

export interface SessionManagerOptions {
  idleTimeoutMs: number;
  maxSessions: number;
}

export interface SessionBackend {
  readonly name: string;
}

export class SessionManager {
  constructor(_backend: SessionBackend, _options: SessionManagerOptions) {
    throw new Error("SessionManager is not available in this build");
  }

  async destroyAll(): Promise<void> {}
}
