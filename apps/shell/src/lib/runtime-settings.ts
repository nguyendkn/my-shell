import type {
  RuntimeSettingsLoadParams,
  RuntimeSettingsSaveParams,
} from "../electrobun/settings-types";
import { getShellRPC } from "./shell-rpc";

export async function loadRuntimeSettings(
  params: RuntimeSettingsLoadParams = {},
) {
  const rpc = await getShellRPC();

  if (!rpc) {
    throw new Error("Runtime settings are available in desktop mode.");
  }

  return rpc.request.loadRuntimeSettings(params);
}

export async function saveRuntimeSettings(params: RuntimeSettingsSaveParams) {
  const rpc = await getShellRPC();

  if (!rpc) {
    throw new Error("Runtime settings are available in desktop mode.");
  }

  return rpc.request.saveRuntimeSettings(params);
}
