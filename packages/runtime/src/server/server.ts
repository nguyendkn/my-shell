// Stub: HTTP server entry. Disabled in external builds.
import type { SessionManager } from "./sessionManager.js";
import type { ServerLogger } from "./serverLog.js";

export interface ServerStartConfig {
  port: number;
  host: string;
  authToken: string;
  unix?: string;
  workspace?: string;
  idleTimeoutMs: number;
  maxSessions: number;
}

export interface ServerHandle {
  readonly port: number | null;
  stop(graceful?: boolean): void;
  close(): Promise<void>;
}

export async function startServer(
  config?: ServerStartConfig,
  _sessionManager?: SessionManager,
  _logger?: ServerLogger,
): Promise<ServerHandle> {
  // Stub server: throws if anything beyond construction is exercised.
  // config is optional so the stubs.test.ts call (no args) gets the
  // descriptive Error rather than a TypeError on .port access. Async so
  // callers awaiting the result get a rejecting Promise rather than a
  // sync throw (matches stubs.test.ts's expectation).
  throw new Error(`server is not available in this build (port ${config?.port ?? "n/a"})`);
}
