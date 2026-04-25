import type { RPCSchema } from "electrobun";

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
    };
    messages: EmptyMessages;
  }>;
  webview: RPCSchema<{
    requests: EmptyRequests;
    messages: EmptyMessages;
  }>;
};
