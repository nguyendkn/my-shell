import type {
  ProjectTerminalEvent,
  ProjectTerminalInputParams,
  ProjectTerminalStartParams,
} from "../electrobun/terminal-types";
import { getShellRPC, isElectrobunRuntime } from "./shell-rpc";

export function canUseNativeProjectTerminal() {
  return isElectrobunRuntime();
}

export async function startProjectTerminal(params: ProjectTerminalStartParams) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      accepted: false,
      sessionId: params.sessionId,
      cwd: null,
      pid: null,
      error: "Native terminal bridge is not available.",
    };
  }

  return rpc.request.startProjectTerminal(params);
}

export async function writeProjectTerminalInput(
  params: ProjectTerminalInputParams,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return {
      accepted: false,
      error: "Native terminal bridge is not available.",
    };
  }

  return rpc.request.writeProjectTerminalInput(params);
}

export async function stopProjectTerminal(sessionId: string) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return { stopped: false };
  }

  return rpc.request.stopProjectTerminal({ sessionId });
}

export async function subscribeProjectTerminalEvents(
  listener: (event: ProjectTerminalEvent) => void,
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    return () => {};
  }

  const wrappedListener = (event: unknown) => {
    listener(event as ProjectTerminalEvent);
  };

  rpc.addMessageListener("projectTerminalEvent", wrappedListener);

  return () =>
    rpc.removeMessageListener("projectTerminalEvent", wrappedListener);
}
