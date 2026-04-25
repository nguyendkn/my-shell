import type { RPCSchema } from "electrobun";
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
    };
  }>;
};
