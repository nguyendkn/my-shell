// Configuration for a single LSP server instance. Mirrors the relevant
// subset of MCP server config — command/args/env/workspaceFolder for spawn,
// initializationOptions for the LSP initialize request, and crash recovery
// tuning. Index signature stays open so plugin-provided servers can carry
// extra metadata without breaking the typed surface.
export type LspServerConfig = {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  workspaceFolder?: string;
  initializationOptions?: Record<string, unknown>;
  // Maximum crash-recovery restart attempts before giving up.
  maxRestarts?: number;
  // Optional max idle ms before the server is shut down to free resources.
  idleShutdownMs?: number;
  // Wall-clock ms to wait for client.initialize() before giving up.
  startupTimeout?: number;
  [key: string]: unknown;
};

// LSP server config with its origin scope (project, user, etc). Stored on
// disk under settings.lspServers.
export type ScopedLspServerConfig = LspServerConfig & {
  scope?: string;
  pluginSource?: string;
};

export type LspServerState =
  | "stopped"
  | "starting"
  | "running"
  | "error"
  | "shutting-down"
  | string;
