import type {
  ProjectBrowserHarnessCancelParams,
  ProjectBrowserHarnessEvent,
  ProjectBrowserHarnessTaskParams,
} from "../electrobun/browser-harness-types";
import { getShellRPC, isElectrobunRuntime } from "./shell-rpc";

export function canUseNativeBrowserHarness() {
  return isElectrobunRuntime();
}

export async function startProjectBrowserHarnessTask(
  params: ProjectBrowserHarnessTaskParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      accepted: false,
      taskId: "",
      sessionId: "",
      error: "Native browser harness bridge is not available.",
    };
  }

  return rpc.request.startProjectBrowserHarnessTask(params);
}

export async function cancelProjectBrowserHarnessTask(
  params: ProjectBrowserHarnessCancelParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return { canceled: false };
  }

  return rpc.request.cancelProjectBrowserHarnessTask(params);
}

export async function subscribeProjectBrowserHarnessEvents(
  listener: (event: ProjectBrowserHarnessEvent) => void,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return () => {};
  }

  rpc.addMessageListener("projectBrowserHarnessEvent", listener);

  return () => rpc.removeMessageListener("projectBrowserHarnessEvent", listener);
}
