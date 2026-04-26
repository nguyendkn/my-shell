import { randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import type {
  ProjectTerminalEvent,
  ProjectTerminalInputParams,
  ProjectTerminalInputResult,
  ProjectTerminalStartParams,
  ProjectTerminalStartResult,
  ProjectTerminalStopParams,
  ProjectTerminalStopResult,
} from "./terminal-types";
import { traceRuntimeBridge } from "./runtime-paths";

type TerminalProcess = ReturnType<typeof Bun.spawn>;
type TerminalInput = {
  write?: (chunk: string | Uint8Array) => unknown;
  flush?: () => unknown;
  end?: () => unknown;
  close?: () => unknown;
};

type ProjectTerminalSession = {
  projectId: number;
  sessionId: string;
  name: string;
  cwd: string;
  process: TerminalProcess;
  stdin: TerminalInput | null;
  inputClosed: boolean;
};

type ProjectTerminalBridgeOptions = {
  emit: (event: ProjectTerminalEvent) => void;
};

function isDirectory(value: string) {
  try {
    return statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function resolveCwd(cwd?: string) {
  if (cwd?.trim() && isDirectory(cwd.trim())) {
    return cwd.trim();
  }

  return null;
}

function getWindowsPowerShellPath() {
  const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
  const bundled = path.join(
    systemRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );

  return existsSync(bundled) ? bundled : "powershell.exe";
}

function getShellArgs() {
  if (process.platform === "win32") {
    return [
      getWindowsPowerShellPath(),
      "-NoLogo",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
    ];
  }

  return [process.env.SHELL || "bash", "-l"];
}

function asTerminalInput(value: unknown): TerminalInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as TerminalInput;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return Boolean(value) && typeof (value as { then?: unknown }).then === "function";
}

async function settle(value: unknown) {
  if (isPromiseLike(value)) {
    await value;
  }
}

function createBaseEvent(session: ProjectTerminalSession) {
  return {
    id: randomUUID(),
    projectId: session.projectId,
    sessionId: session.sessionId,
    timestamp: new Date().toISOString(),
  };
}

function countLineBreaks(data: string) {
  return data.match(/\r\n|\r|\n/g)?.length ?? 0;
}

async function writeInput(session: ProjectTerminalSession, data: string) {
  if (!session.stdin || session.inputClosed) {
    return false;
  }

  try {
    if (typeof session.stdin.write === "function") {
      await settle(session.stdin.write(data));
      await settle(session.stdin.flush?.());
      return true;
    }
  } catch {
    session.inputClosed = true;
    return false;
  }

  return false;
}

async function closeInput(session: ProjectTerminalSession) {
  if (!session.stdin || session.inputClosed) {
    return;
  }

  session.inputClosed = true;

  try {
    if (typeof session.stdin.end === "function") {
      await settle(session.stdin.end());
      return;
    }

    if (typeof session.stdin.close === "function") {
      await settle(session.stdin.close());
    }
  } catch {
    // The child may already have exited.
  }
}

async function readTerminalStream(
  session: ProjectTerminalSession,
  stream: ReadableStream<Uint8Array> | null,
  emit: ProjectTerminalBridgeOptions["emit"],
) {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const data = decoder.decode(value, { stream: true });

    if (data) {
      emit({
        ...createBaseEvent(session),
        type: "data",
        data,
      });
    }
  }
}

export function createProjectTerminalBridge({
  emit,
}: ProjectTerminalBridgeOptions) {
  const sessions = new Map<string, ProjectTerminalSession>();

  function startTerminal(
    params: ProjectTerminalStartParams,
  ): ProjectTerminalStartResult {
    const cwd = resolveCwd(params.cwd);

    if (!cwd) {
      return {
        accepted: false,
        sessionId: params.sessionId,
        cwd: null,
        pid: null,
        error:
          "Project folder is unavailable. Link a real folder before opening a terminal.",
      };
    }

    const shellArgs = getShellArgs();

    traceRuntimeBridge("terminal.start", {
      projectId: params.projectId,
      sessionId: params.sessionId,
      cwd,
      shellArgs,
    });

    const child = Bun.spawn(shellArgs, {
      cwd,
      env: process.env,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      windowsHide: true,
    });
    const session: ProjectTerminalSession = {
      projectId: params.projectId,
      sessionId: params.sessionId,
      name: params.name,
      cwd,
      process: child,
      stdin: asTerminalInput((child as { stdin?: unknown }).stdin),
      inputClosed: false,
    };

    sessions.set(session.sessionId, session);
    emit({
      ...createBaseEvent(session),
      type: "state",
      state: "running",
      summary: `${path.basename(shellArgs[0] ?? "shell")} started`,
      pid: child.pid,
      cwd,
    });
    emit({
      ...createBaseEvent(session),
      type: "data",
      data: `\x1b[36m${params.name}\x1b[0m\r\ncwd: ${cwd}\r\n`,
    });

    void Promise.all([
      readTerminalStream(session, child.stdout, emit),
      readTerminalStream(session, child.stderr, emit),
      child.exited,
    ]).then(([, , exitCode]) => {
      sessions.delete(session.sessionId);
      void closeInput(session);
      traceRuntimeBridge("terminal.exit", {
        projectId: session.projectId,
        sessionId: session.sessionId,
        exitCode,
      });
      emit({
        ...createBaseEvent(session),
        type: "exit",
        exitCode,
        summary: `Terminal exited with code ${exitCode}`,
      });
    });

    return {
      accepted: true,
      sessionId: session.sessionId,
      cwd,
      pid: child.pid,
    };
  }

  async function writeTerminalInput({
    sessionId,
    data,
  }: ProjectTerminalInputParams): Promise<ProjectTerminalInputResult> {
    const session = sessions.get(sessionId);

    if (!session) {
      traceRuntimeBridge("terminal.input.missing", {
        sessionId,
        chars: data.length,
        lineBreaks: countLineBreaks(data),
      });

      return {
        accepted: false,
        error: "Terminal session is no longer active.",
      };
    }

    const accepted = await writeInput(session, data);

    traceRuntimeBridge("terminal.input", {
      projectId: session.projectId,
      sessionId,
      accepted,
      chars: data.length,
      lineBreaks: countLineBreaks(data),
    });

    return accepted
      ? { accepted: true }
      : { accepted: false, error: "Terminal input pipe is closed." };
  }

  function stopTerminal({
    sessionId,
  }: ProjectTerminalStopParams): ProjectTerminalStopResult {
    const session = sessions.get(sessionId);

    if (!session) {
      return { stopped: false };
    }

    traceRuntimeBridge("terminal.stop", {
      projectId: session.projectId,
      sessionId,
    });

    void closeInput(session);
    session.process.kill();

    return { stopped: true };
  }

  function stopAll() {
    for (const sessionId of sessions.keys()) {
      stopTerminal({ sessionId });
    }
  }

  return {
    startTerminal,
    stopAll,
    stopTerminal,
    writeTerminalInput,
  };
}
