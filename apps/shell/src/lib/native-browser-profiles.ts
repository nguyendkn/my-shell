import type {
  CreateProjectBrowserProfileParams,
  ProjectBrowserProfileOperationParams,
  ProjectBrowserProfileParams,
} from "../electrobun/browser-profiles-types";
import { getShellRPC, isElectrobunRuntime } from "./shell-rpc";

export function canUseNativeBrowserProfiles() {
  return isElectrobunRuntime();
}

export async function loadProjectBrowserProfiles(
  params: ProjectBrowserProfileParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      available: false,
      storagePath: null,
      profiles: [],
      error: "Native browser profile bridge is not available.",
    };
  }

  return rpc.request.loadProjectBrowserProfiles(params);
}

export async function createProjectBrowserProfile(
  params: CreateProjectBrowserProfileParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      ok: false,
      storagePath: null,
      error: "Native browser profile bridge is not available.",
    };
  }

  return rpc.request.createProjectBrowserProfile(params);
}

export async function verifyProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      ok: false,
      storagePath: null,
      error: "Native browser profile bridge is not available.",
    };
  }

  return rpc.request.verifyProjectBrowserProfile(params);
}

export async function warmProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      ok: false,
      storagePath: null,
      error: "Native browser profile bridge is not available.",
    };
  }

  return rpc.request.warmProjectBrowserProfile(params);
}

export async function launchProjectBrowserProfile(
  params: ProjectBrowserProfileOperationParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      ok: false,
      launched: false,
      storagePath: null,
      error: "Native browser profile bridge is not available.",
    };
  }

  return rpc.request.launchProjectBrowserProfile(params);
}
