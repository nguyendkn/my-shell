import type {
  CreateProjectBrowserProfileParams,
  LaunchProjectBrowserProfileResult,
  LoadProjectBrowserProfilesResult,
  ProjectBrowserProfileOperationParams,
  ProjectBrowserProfileParams,
  ProjectBrowserProfileResult,
} from "../electrobun/browser-profiles-types";
import type {
  ProjectRuntimeCancelParams,
  ProjectRuntimeCancelResult,
  ProjectRuntimeEvent,
  ProjectRuntimePermissionResponseParams,
  ProjectRuntimePermissionResponseResult,
  ProjectRuntimeStatusParams,
  ProjectRuntimeStatusResult,
  ProjectRuntimeTurnParams,
  ProjectRuntimeTurnResult,
} from "../electrobun/runtime-types";
import type {
  ProjectTerminalEvent,
  ProjectTerminalInputParams,
  ProjectTerminalInputResult,
  ProjectTerminalStartParams,
  ProjectTerminalStartResult,
  ProjectTerminalStopParams,
  ProjectTerminalStopResult,
} from "../electrobun/terminal-types";
import type {
  SelectProjectFolderParams,
  SelectProjectFolderResult,
  ShellRPCSchema,
} from "../electrobun/rpc";
import type {
  RuntimeSettingsLoadParams,
  RuntimeSettingsLoadResult,
  RuntimeSettingsSaveParams,
  RuntimeSettingsSaveResult,
} from "../electrobun/settings-types";

export type ShellWebviewRPC = {
  request: {
    selectProjectFolder: (
      params: SelectProjectFolderParams,
    ) => Promise<SelectProjectFolderResult>;
    startProjectRuntimeTurn: (
      params: ProjectRuntimeTurnParams,
    ) => Promise<ProjectRuntimeTurnResult>;
    cancelProjectRuntimeTurn: (
      params: ProjectRuntimeCancelParams,
    ) => Promise<ProjectRuntimeCancelResult>;
    respondProjectRuntimePermission: (
      params: ProjectRuntimePermissionResponseParams,
    ) => Promise<ProjectRuntimePermissionResponseResult>;
    getProjectRuntimeStatus: (
      params: ProjectRuntimeStatusParams,
    ) => Promise<ProjectRuntimeStatusResult>;
    startProjectTerminal: (
      params: ProjectTerminalStartParams,
    ) => Promise<ProjectTerminalStartResult>;
    writeProjectTerminalInput: (
      params: ProjectTerminalInputParams,
    ) => Promise<ProjectTerminalInputResult>;
    stopProjectTerminal: (
      params: ProjectTerminalStopParams,
    ) => Promise<ProjectTerminalStopResult>;
    loadProjectBrowserProfiles: (
      params: ProjectBrowserProfileParams,
    ) => Promise<LoadProjectBrowserProfilesResult>;
    createProjectBrowserProfile: (
      params: CreateProjectBrowserProfileParams,
    ) => Promise<ProjectBrowserProfileResult>;
    verifyProjectBrowserProfile: (
      params: ProjectBrowserProfileOperationParams,
    ) => Promise<ProjectBrowserProfileResult>;
    warmProjectBrowserProfile: (
      params: ProjectBrowserProfileOperationParams,
    ) => Promise<ProjectBrowserProfileResult>;
    launchProjectBrowserProfile: (
      params: ProjectBrowserProfileOperationParams,
    ) => Promise<LaunchProjectBrowserProfileResult>;
    loadRuntimeSettings: (
      params: RuntimeSettingsLoadParams,
    ) => Promise<RuntimeSettingsLoadResult>;
    saveRuntimeSettings: (
      params: RuntimeSettingsSaveParams,
    ) => Promise<RuntimeSettingsSaveResult>;
  };
  addMessageListener: {
    (
      message: "projectRuntimeEvent",
      listener: (event: ProjectRuntimeEvent) => void,
    ): void;
    (
      message: "projectTerminalEvent",
      listener: (event: ProjectTerminalEvent) => void,
    ): void;
  };
  removeMessageListener: {
    (
      message: "projectRuntimeEvent",
      listener: (event: ProjectRuntimeEvent) => void,
    ): void;
    (
      message: "projectTerminalEvent",
      listener: (event: ProjectTerminalEvent) => void,
    ): void;
  };
};

let shellRPCPromise: Promise<ShellWebviewRPC | null> | null = null;

export function isElectrobunRuntime() {
  return typeof window !== "undefined" && Boolean(window.__electrobun);
}

export async function getShellRPC() {
  if (!isElectrobunRuntime()) {
    return null;
  }

  shellRPCPromise ??= import("electrobun/view").then(({ Electroview }) => {
    const rpc = Electroview.defineRPC<ShellRPCSchema>({
      maxRequestTime: Infinity,
      handlers: {
        requests: {},
        messages: {},
      },
    });

    new Electroview({ rpc });

    return rpc as ShellWebviewRPC;
  });

  return shellRPCPromise;
}
