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
    loadRuntimeSettings: (
      params: RuntimeSettingsLoadParams,
    ) => Promise<RuntimeSettingsLoadResult>;
    saveRuntimeSettings: (
      params: RuntimeSettingsSaveParams,
    ) => Promise<RuntimeSettingsSaveResult>;
  };
  addMessageListener: (
    message: "projectRuntimeEvent",
    listener: (event: ProjectRuntimeEvent) => void,
  ) => void;
  removeMessageListener: (
    message: "projectRuntimeEvent",
    listener: (event: ProjectRuntimeEvent) => void,
  ) => void;
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
