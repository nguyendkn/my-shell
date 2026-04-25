import type {
  ProjectRuntimeCancelParams,
  ProjectRuntimeEvent,
  ProjectRuntimePermissionResponseParams,
  ProjectRuntimePermissionResponseResult,
  ProjectRuntimeStatusResult,
  ProjectRuntimeTurnParams,
  ProjectRuntimeTurnResult,
} from "../electrobun/runtime-types";
import { getShellRPC, isElectrobunRuntime } from "./shell-rpc";

export function canUseNativeProjectRuntime() {
  return isElectrobunRuntime();
}

export async function getProjectRuntimeStatus(
  projectId?: number,
): Promise<ProjectRuntimeStatusResult | null> {
  const rpc = await getShellRPC();

  if (!rpc) {
    return null;
  }

  return rpc.request.getProjectRuntimeStatus({ projectId });
}

export async function startProjectRuntimeTurn(
  params: ProjectRuntimeTurnParams,
): Promise<ProjectRuntimeTurnResult | null> {
  const rpc = await getShellRPC();

  if (!rpc) {
    return null;
  }

  return rpc.request.startProjectRuntimeTurn(params);
}

export async function cancelProjectRuntimeTurn(
  params: ProjectRuntimeCancelParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return { canceled: false };
  }

  return rpc.request.cancelProjectRuntimeTurn(params);
}

export async function respondProjectRuntimePermission(
  params: ProjectRuntimePermissionResponseParams,
): Promise<ProjectRuntimePermissionResponseResult> {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      accepted: false,
      decision: params.decision,
      error: "Native runtime bridge is not available.",
    };
  }

  return rpc.request.respondProjectRuntimePermission(params);
}

export async function subscribeProjectRuntimeEvents(
  listener: (event: ProjectRuntimeEvent) => void,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return () => {};
  }

  rpc.addMessageListener("projectRuntimeEvent", listener);

  return () => rpc.removeMessageListener("projectRuntimeEvent", listener);
}
