export type ProjectBrowserProviderId = "camoufox" | "chrome-cdp";

export type ProjectBrowserProfileStatus =
  | "ready"
  | "warming"
  | "running"
  | "needs-setup";

export type ProjectBrowserProfile = {
  id: string;
  name: string;
  providerId: ProjectBrowserProviderId;
  status: ProjectBrowserProfileStatus;
  profilePath: string;
  proxyLane: string;
  locale: string;
  timezone: string;
  os: "windows" | "macos" | "linux";
  headless: "headed" | "headless" | "virtual";
  persistentContext: boolean;
  harnessMode: "playwright" | "cdp";
  endpoint: string;
  lastUsed: string;
  health: number;
  cookieJar: string;
  targetDomains: string[];
  tags: string[];
  notes: string;
};

export type ProjectBrowserProfileParams = {
  projectId: number;
  projectName: string;
  cwd?: string;
};

export type LoadProjectBrowserProfilesResult = {
  available: boolean;
  storagePath: string | null;
  profiles: ProjectBrowserProfile[];
  error?: string;
};

export type CreateProjectBrowserProfileParams = ProjectBrowserProfileParams & {
  providerId: ProjectBrowserProviderId;
  name?: string;
};

export type ProjectBrowserProfileResult = {
  ok: boolean;
  storagePath: string | null;
  profile?: ProjectBrowserProfile;
  message?: string;
  error?: string;
};

export type ProjectBrowserProfileOperationParams = ProjectBrowserProfileParams & {
  profile: ProjectBrowserProfile;
};

export type LaunchProjectBrowserProfileResult = ProjectBrowserProfileResult & {
  launched: boolean;
  command?: string[];
};
