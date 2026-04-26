export type BrowserHarnessMode = "headed" | "headless";

export type BrowserProfileProviderId = "camoufox" | "chrome-cdp";

export type BrowserProfileDescriptor = {
  id: string;
  name: string;
  providerId: BrowserProfileProviderId;
  profilePath: string;
};

export type BrowserHarnessGoal = {
  prompt: string;
  goal: string;
  startPoint: string;
  endpoint: string;
  mode: BrowserHarnessMode;
  requestedProfileCount: number;
  requestedProfileRefs: string[];
};

export type BrowserHarnessWorkerPlan = {
  agentId: string;
  agentName: string;
  role: "worker";
  profileId: string;
  profileName: string;
  providerId: BrowserProfileProviderId;
  profilePath: string;
  mode: BrowserHarnessMode;
  goal: string;
  startPoint: string;
  endpoint: string;
  expectedProcessTitle: string;
};

export type BrowserHarnessTeamPlan = {
  taskId: string;
  leadAgentId: string;
  leadName: string;
  mode: BrowserHarnessMode;
  goal: string;
  startPoint: string;
  endpoint: string;
  workers: BrowserHarnessWorkerPlan[];
};

export type BrowserHarnessWorkerReport = {
  agentId: string;
  profileId: string;
  profileName: string;
  pid: number | null;
  ok: boolean;
  processTitleVerified: boolean;
  expectedProcessTitle: string;
  observedWindowTitle?: string | null;
  summary: string;
};
