import { getShellRPC } from "./shell-rpc";

export async function selectProjectFolder(
  currentPath?: string,
): Promise<string | null> {
  const rpc = await getShellRPC();

  if (!rpc) {
    return null;
  }

  const result = await rpc.request.selectProjectFolder({ currentPath });

  return result.path;
}
