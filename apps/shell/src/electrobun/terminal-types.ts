export type ProjectTerminalState =
  | "starting"
  | "running"
  | "exited"
  | "failed";

export type ProjectTerminalStartParams = {
  projectId: number;
  sessionId: string;
  cwd?: string;
  name: string;
};

export type ProjectTerminalStartResult = {
  accepted: boolean;
  sessionId: string;
  cwd: string | null;
  pid: number | null;
  error?: string;
};

export type ProjectTerminalInputParams = {
  sessionId: string;
  data: string;
};

export type ProjectTerminalInputResult = {
  accepted: boolean;
  error?: string;
};

export type ProjectTerminalStopParams = {
  sessionId: string;
};

export type ProjectTerminalStopResult = {
  stopped: boolean;
};

type ProjectTerminalEventBase = {
  id: string;
  projectId: number;
  sessionId: string;
  timestamp: string;
};

export type ProjectTerminalEvent =
  | (ProjectTerminalEventBase & {
      type: "data";
      data: string;
    })
  | (ProjectTerminalEventBase & {
      type: "state";
      state: ProjectTerminalState;
      summary: string;
      pid?: number;
      cwd?: string;
    })
  | (ProjectTerminalEventBase & {
      type: "exit";
      exitCode: number | null;
      summary: string;
    });
