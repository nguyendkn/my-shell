import type { RPCSchema } from "electrobun";
import type {
  ProjectBrowserHarnessCancelParams,
  ProjectBrowserHarnessCancelResult,
  ProjectBrowserHarnessEvent,
  ProjectBrowserHarnessTaskParams,
  ProjectBrowserHarnessTaskResult,
} from "./browser-harness-types";
import type {
  CreateProjectBrowserProfileParams,
  LaunchProjectBrowserProfileResult,
  LoadProjectBrowserProfilesResult,
  ProjectBrowserProfileOperationParams,
  ProjectBrowserProfileParams,
  ProjectBrowserProfileResult,
} from "./browser-profiles-types";
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
} from "./runtime-types";
import type {
  ProjectTerminalEvent,
  ProjectTerminalInputParams,
  ProjectTerminalInputResult,
  ProjectTerminalStartParams,
  ProjectTerminalStartResult,
  ProjectTerminalStopParams,
  ProjectTerminalStopResult,
} from "./terminal-types";
import type {
  RuntimeSettingsLoadParams,
  RuntimeSettingsLoadResult,
  RuntimeSettingsSaveParams,
  RuntimeSettingsSaveResult,
} from "./settings-types";

type EmptyRequests = Record<never, { params: unknown; response: unknown }>;
type EmptyMessages = Record<never, unknown>;

export type SelectProjectFolderParams = {
  currentPath?: string;
};

export type SelectProjectFolderResult = {
  path: string | null;
};

export type ShellRPCSchema = {
  bun: RPCSchema<{
    requests: {
      selectProjectFolder: {
        params: SelectProjectFolderParams;
        response: SelectProjectFolderResult;
      };
      startProjectRuntimeTurn: {
        params: ProjectRuntimeTurnParams;
        response: ProjectRuntimeTurnResult;
      };
      cancelProjectRuntimeTurn: {
        params: ProjectRuntimeCancelParams;
        response: ProjectRuntimeCancelResult;
      };
      respondProjectRuntimePermission: {
        params: ProjectRuntimePermissionResponseParams;
        response: ProjectRuntimePermissionResponseResult;
      };
      getProjectRuntimeStatus: {
        params: ProjectRuntimeStatusParams;
        response: ProjectRuntimeStatusResult;
      };
      startProjectTerminal: {
        params: ProjectTerminalStartParams;
        response: ProjectTerminalStartResult;
      };
      writeProjectTerminalInput: {
        params: ProjectTerminalInputParams;
        response: ProjectTerminalInputResult;
      };
      stopProjectTerminal: {
        params: ProjectTerminalStopParams;
        response: ProjectTerminalStopResult;
      };
      loadProjectBrowserProfiles: {
        params: ProjectBrowserProfileParams;
        response: LoadProjectBrowserProfilesResult;
      };
      createProjectBrowserProfile: {
        params: CreateProjectBrowserProfileParams;
        response: ProjectBrowserProfileResult;
      };
      verifyProjectBrowserProfile: {
        params: ProjectBrowserProfileOperationParams;
        response: ProjectBrowserProfileResult;
      };
      warmProjectBrowserProfile: {
        params: ProjectBrowserProfileOperationParams;
        response: ProjectBrowserProfileResult;
      };
      launchProjectBrowserProfile: {
        params: ProjectBrowserProfileOperationParams;
        response: LaunchProjectBrowserProfileResult;
      };
      startProjectBrowserHarnessTask: {
        params: ProjectBrowserHarnessTaskParams;
        response: ProjectBrowserHarnessTaskResult;
      };
      cancelProjectBrowserHarnessTask: {
        params: ProjectBrowserHarnessCancelParams;
        response: ProjectBrowserHarnessCancelResult;
      };
      loadRuntimeSettings: {
        params: RuntimeSettingsLoadParams;
        response: RuntimeSettingsLoadResult;
      };
      saveRuntimeSettings: {
        params: RuntimeSettingsSaveParams;
        response: RuntimeSettingsSaveResult;
      };
    };
    messages: EmptyMessages;
  }>;
  webview: RPCSchema<{
    requests: EmptyRequests;
    messages: {
      projectRuntimeEvent: ProjectRuntimeEvent;
      projectTerminalEvent: ProjectTerminalEvent;
      projectBrowserHarnessEvent: ProjectBrowserHarnessEvent;
    };
  }>;
};
