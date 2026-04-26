import type {
  BrowserHarnessMode,
  BrowserHarnessTeamPlan,
  BrowserHarnessWorkerReport,
} from "@repo/browser";

export type ProjectBrowserHarnessTaskParams = {
  projectId: number;
  projectName: string;
  cwd?: string;
  prompt: string;
  mode?: BrowserHarnessMode;
  profileCount?: number;
  profileIds?: string[];
};

export type ProjectBrowserHarnessTaskResult = {
  accepted: boolean;
  taskId: string;
  sessionId: string;
  plan?: BrowserHarnessTeamPlan;
  error?: string;
};

export type ProjectBrowserHarnessCancelParams = {
  taskId: string;
};

export type ProjectBrowserHarnessCancelResult = {
  canceled: boolean;
};

export type ProjectBrowserHarnessSessionState =
  | "starting"
  | "planning"
  | "running"
  | "validating"
  | "completed"
  | "failed"
  | "canceled";

export type ProjectBrowserHarnessEventBase = {
  id: string;
  projectId: number;
  taskId: string;
  sessionId: string;
  timestamp: string;
};

export type ProjectBrowserHarnessEvent =
  | (ProjectBrowserHarnessEventBase & {
      type: "session_state";
      state: ProjectBrowserHarnessSessionState;
      summary: string;
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "lead_plan";
      plan: BrowserHarnessTeamPlan;
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "worker_state";
      agentId: string;
      agentName: string;
      profileId: string;
      profileName: string;
      state: "queued" | "launching" | "running" | "reported" | "failed";
      summary: string;
      pid?: number | null;
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "process_title";
      agentId: string;
      profileId: string;
      profileName: string;
      pid: number | null;
      expectedProcessTitle: string;
      observedWindowTitle?: string | null;
      commandLineHasTitle: boolean;
      ok: boolean;
      provider: string;
      mode: BrowserHarnessMode;
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "worker_report";
      report: BrowserHarnessWorkerReport;
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "lead_validation";
      ok: boolean;
      summary: string;
      reports: BrowserHarnessWorkerReport[];
    })
  | (ProjectBrowserHarnessEventBase & {
      type: "result";
      ok: boolean;
      summary: string;
      durationMs: number;
      errors?: string[];
    });
