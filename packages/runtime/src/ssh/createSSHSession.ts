// SSH session handle returned by createSSHSession. Wraps the underlying
// SSH child process and provides a manager factory for SDK message
// streaming.

// SDK-shaped permission request the SSH server forwards to the client.
// Loosely typed because the server-side schema may evolve independently;
// the client narrows the fields it reads.
export type SSHPermissionRequest = {
  tool_name: string;
  tool_use_id: string;
  input: Record<string, unknown>;
  description?: string;
  permission_suggestions?: unknown;
  blocked_path?: string;
  [key: string]: unknown;
};

// Permission decision sent back to the SSH server. Mirrors the SDK
// PermissionResult union (allow/deny + per-variant payload).
export type SSHPermissionResponse =
  | { behavior: "allow"; updatedInput?: unknown }
  | { behavior: "deny"; message?: string };

export type SSHManagerCallbacks = {
  onMessage: (msg: unknown) => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
  onPermissionRequest?: (request: SSHPermissionRequest, requestId: string) => void;
  onConnected?: () => void;
  onReconnecting?: (attempt: number, max: number) => void;
  onReconnected?: () => void;
};

export type SSHManager = {
  connect(): void;
  disconnect(): void;
  // Send the user's permission decision back to the SSH server. Keyed by
  // requestId so multiple in-flight requests don't collide.
  respondToPermissionRequest(requestId: string, response: SSHPermissionResponse): void;
};

export type SSHProcess = {
  exitCode: number | null;
  signalCode?: string | null;
};

export type SSHProxy = {
  stop(): void;
};

export type SSHSession = {
  createManager(callbacks: SSHManagerCallbacks): SSHManager;
  getStderrTail(): string;
  proc: SSHProcess;
  proxy: SSHProxy;
  remoteCwd: string;
  [key: string]: unknown;
};

export interface SSHSessionOptions {
  host: string;
  cwd?: string;
  localVersion?: string;
  permissionMode?: string;
  dangerouslySkipPermissions?: boolean;
  extraCliArgs?: readonly string[];
}

export interface SSHSessionProgressOptions {
  onProgress?: (msg: string) => void;
}

export interface LocalSSHSessionOptions {
  cwd?: string;
  permissionMode?: string;
  dangerouslySkipPermissions?: boolean;
}

export class SSHSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SSHSessionError";
  }
}

function makeStubSession(): SSHSession {
  return {
    createManager: () => ({
      connect: () => {},
      disconnect: () => {},
      respondToPermissionRequest: () => {},
    }),
    getStderrTail: () => "",
    proc: { exitCode: null, signalCode: null },
    proxy: { stop: () => {} },
    remoteCwd: "",
  };
}

export async function createSSHSession(
  _options?: SSHSessionOptions,
  _progress?: SSHSessionProgressOptions,
): Promise<SSHSession> {
  // Stub session — returns the structural surface useSSHSession expects.
  // Real impl spawns the SSH child process and wires the streaming JSON
  // protocol; the restored runtime never reaches this hook (the SSH
  // entry point is gated off).
  return makeStubSession();
}

export function createLocalSSHSession(_options?: LocalSSHSessionOptions): SSHSession {
  return makeStubSession();
}
