import type {
  SelectProjectFolderParams,
  SelectProjectFolderResult,
  ShellRPCSchema,
} from "../electrobun/rpc";

type ShellWebviewRPC = {
  request: {
    selectProjectFolder: (
      params: SelectProjectFolderParams,
    ) => Promise<SelectProjectFolderResult>;
  };
};

let shellRPCPromise: Promise<ShellWebviewRPC | null> | null = null;

function isElectrobunRuntime() {
  return typeof window !== "undefined" && Boolean(window.__electrobun);
}

async function getShellRPC() {
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
