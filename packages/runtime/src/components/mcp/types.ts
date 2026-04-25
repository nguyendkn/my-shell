// View-model types used by the MCP component tree.
//
// The runtime stores connections as MCPServerConnection (a discriminated
// union by `client.type`); the component layer wraps each connection
// with display metadata (auth state, scope, classification flags).

import type {
  ConfigScope,
  MCPServerConnection,
  ScopedMcpServerConfig,
} from "src/services/mcp/types.js";

export type ServerClient = MCPServerConnection;

export type BaseServerInfo = {
  name: string;
  // The connected client. Optional because some display-only flows
  // (services/mcp/utils.collectAgentMcpServers) build info objects from
  // config alone without a live connection.
  client?: ServerClient;
  isAuthenticated?: boolean;
  config?: ScopedMcpServerConfig;
  scope?: ConfigScope;
  description?: string;
  pluginSource?: string;
};

export type AgentMcpServerInfo = BaseServerInfo & {
  kind?: "agent";
  // Agent identifiers that contribute this MCP server to the agent's
  // tool/resource set. Multiple agents can reference the same server, so
  // the de-dup pass in services/mcp/utils collects them into an array.
  sourceAgents: string[];
  // Display fields the menu reads directly without a config narrowing pass.
  // Optional because not every transport carries every field. ws is the
  // legacy WebSocket variant; included for completeness.
  transport?: "stdio" | "sse" | "http" | "claudeai-proxy" | "ws";
  url?: string;
  command?: string;
  needsAuth?: boolean;
};

export type ClaudeAIServerInfo = BaseServerInfo & {
  kind?: "claudeai";
  authProvider?: string;
  transport?: "claudeai-proxy";
};

export type HTTPServerInfo = BaseServerInfo & {
  kind?: "http";
  url?: string;
  transport?: "http";
};

export type SSEServerInfo = BaseServerInfo & {
  kind?: "sse";
  url?: string;
  transport?: "sse";
};

export type StdioServerInfo = BaseServerInfo & {
  kind?: "stdio";
  command?: string;
  args?: string[];
  transport?: "stdio";
};

export type ServerInfo =
  | AgentMcpServerInfo
  | ClaudeAIServerInfo
  | HTTPServerInfo
  | SSEServerInfo
  | StdioServerInfo;

export type MCPViewState = string;
