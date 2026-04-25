// Progress payloads forwarded from sub-agents and long-running tools.
//
// Each variant carries enough shape for the consumer to narrow on `type`
// (or `kind`, in the older callsites) — e.g. AgentTool/UI.tsx pulls the
// embedded normalized message out of agent_progress / skill_progress
// payloads, while bash_progress carries plain stdout bytes.

import type { Message } from "src/types/message.js";

export type AgentToolProgress = {
  type: "agent_progress";
  message: Message;
  prompt?: string;
  agentId?: string;
  [key: string]: unknown;
};

export type SkillToolProgress = {
  type: "skill_progress";
  message: Message;
  skillName?: string;
  [key: string]: unknown;
};

export type ShellProgress = {
  type: "shell_progress" | "bash_progress" | "powershell_progress";
  data?: string;
  stdout?: string;
  stderr?: string;
  // Wall-clock seconds since the shell tool started. Forwarded to the SDK's
  // tool_progress event so consumers can render long-running command timers.
  elapsedTimeSeconds?: number;
  // Optional caller task identifier — present when the shell tool runs as
  // part of a task tracked in the SDK (used to correlate with task summaries).
  taskId?: string;
  [key: string]: unknown;
};

export type BashProgress = ShellProgress & { type: "bash_progress" };
export type PowerShellProgress = ShellProgress & { type: "powershell_progress" };

export type MCPProgress = {
  type: "mcp_progress";
  serverName?: string;
  message?: Message;
  // MCP progress notifications carry numeric progress/total per the spec; the
  // optional progressMessage is human-readable text from the server.
  progress?: number;
  total?: number;
  progressMessage?: string;
  // Connection status surfaced by the MCP client — used by the Spinner row
  // to render "connecting…" / "ready" affordances ahead of progress numbers.
  status?: string;
  // Tool identifier emitted alongside server-level progress events when the
  // server knows which tool triggered the notification.
  toolName?: string;
  // Retry metadata for notifications that describe reconnect attempts.
  attempt?: number;
  maxAttempts?: number;
  // Elapsed time since the request started — surfaced for slow-tool warnings.
  elapsedTimeMs?: number;
};

export type TaskOutputProgress = {
  // Canonical "task_output_progress" event plus a "waiting_for_task" stage
  // emitted while the tool is blocking on a child task to complete.
  type: "task_output_progress" | "waiting_for_task";
  taskId?: string;
  output?: string;
  taskDescription?: string;
  taskType?: string;
};

export type WebSearchProgress = {
  // Discriminator: "web_search_progress" is the canonical event; the
  // streaming runtime also emits per-stage variants ("query_update" while a
  // query is forming, "search_results_received" when results land).
  type: "web_search_progress" | "query_update" | "search_results_received";
  query?: string;
  resultCount?: number;
};

export type REPLToolProgress = {
  type: "repl_progress";
  message?: Message;
  [key: string]: unknown;
};

export type SdkWorkflowProgress = {
  type: "sdk_workflow_progress";
  message?: Message;
  [key: string]: unknown;
};

export type ToolProgressData =
  | AgentToolProgress
  | SkillToolProgress
  | ShellProgress
  | BashProgress
  | PowerShellProgress
  | MCPProgress
  | TaskOutputProgress
  | WebSearchProgress
  | REPLToolProgress
  | SdkWorkflowProgress;
