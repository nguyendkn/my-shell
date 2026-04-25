export type ProjectRuntimeMode = "Plan" | "Act";

export type ProjectRuntimeAttachment = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "image";
};

export type ProjectRuntimeTurnParams = {
  projectId: number;
  projectName: string;
  cwd?: string;
  prompt: string;
  mode: ProjectRuntimeMode;
  model: string;
  attachments: ProjectRuntimeAttachment[];
  contextRefs: string[];
};

export type ProjectRuntimeTurnResult = {
  accepted: boolean;
  sessionId: string;
  turnId: string;
  native: boolean;
  warning?: string;
};

export type ProjectRuntimeCancelParams = {
  sessionId: string;
};

export type ProjectRuntimeCancelResult = {
  canceled: boolean;
};

export type ProjectRuntimePermissionDecision = "allow_once" | "deny";

export type ProjectRuntimePermissionResolution =
  | ProjectRuntimePermissionDecision
  | "canceled";

export type ProjectRuntimePermissionResponseParams = {
  sessionId: string;
  requestId: string;
  decision: ProjectRuntimePermissionDecision;
};

export type ProjectRuntimePermissionResponseResult = {
  accepted: boolean;
  decision?: ProjectRuntimePermissionDecision;
  error?: string;
};

export type ProjectRuntimeStatusParams = {
  projectId?: number;
};

export type ProjectRuntimeStatusResult = {
  available: boolean;
  cliReady: boolean;
  runtimeRoot: string;
  version: string | null;
  restoreCheck: {
    missingRelativeImports: number | null;
    output: string[];
  };
  activeSessions: number;
  traceLogPath?: string;
  runtimeRootCandidates?: string[];
  error?: string;
};

export type ProjectRuntimeSessionState =
  | "starting"
  | "running"
  | "requires_action"
  | "completed"
  | "failed"
  | "canceled";

export type ProjectRuntimeEventBase = {
  id: string;
  projectId: number;
  sessionId: string;
  turnId: string;
  timestamp: string;
};

export type ProjectRuntimeEvent =
  | (ProjectRuntimeEventBase & {
      type: "session_state";
      state: ProjectRuntimeSessionState;
      summary?: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "assistant_delta";
      text: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "assistant_message";
      text: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "reasoning";
      text: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "tool_use";
      toolUseId?: string;
      toolName: string;
      summary: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "tool_result";
      toolUseId?: string;
      toolName?: string;
      summary: string;
      isError?: boolean;
    })
  | (ProjectRuntimeEventBase & {
      type: "permission_request";
      requestId: string;
      toolName: string;
      summary: string;
      canRespond: boolean;
    })
  | (ProjectRuntimeEventBase & {
      type: "permission_response";
      requestId: string;
      toolName?: string;
      decision: ProjectRuntimePermissionResolution;
      accepted: boolean;
      error?: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "system";
      level: "info" | "warning" | "error";
      message: string;
    })
  | (ProjectRuntimeEventBase & {
      type: "result";
      isError: boolean;
      result: string;
      errors?: string[];
      durationMs?: number;
      exitCode?: number | null;
    });
