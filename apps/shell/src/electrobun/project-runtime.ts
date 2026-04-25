import { existsSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type {
  ProjectRuntimeEvent,
  ProjectRuntimePermissionDecision,
  ProjectRuntimePermissionResponseParams,
  ProjectRuntimePermissionResponseResult,
  ProjectRuntimeStatusResult,
  ProjectRuntimeTurnParams,
  ProjectRuntimeTurnResult,
} from "./runtime-types";
import {
  resolveRuntimeRoot,
  traceRuntimeBridge,
} from "./runtime-paths";

type RuntimeProcess = ReturnType<typeof Bun.spawn>;
type RuntimeInput = {
  write?: (chunk: string | Uint8Array) => unknown;
  flush?: () => unknown;
  end?: () => unknown;
  close?: () => unknown;
  getWriter?: () => {
    write: (chunk: Uint8Array) => unknown;
    close?: () => unknown;
    releaseLock?: () => void;
  };
};

type PendingPermission = {
  requestId: string;
  toolName: string;
  toolUseId?: string;
  input: Record<string, unknown>;
};

type RuntimeSession = {
  params: ProjectRuntimeTurnParams;
  sessionId: string;
  turnId: string;
  startedAt: number;
  process: RuntimeProcess | null;
  stdin: RuntimeInput | null;
  inputClosed: boolean;
  lastStderr: string[];
  toolUseNames: Map<string, string>;
  pendingPermissions: Map<string, PendingPermission>;
  emittedResult: boolean;
  canceled: boolean;
};

type ProjectRuntimeBridgeOptions = {
  emit: (event: ProjectRuntimeEvent) => void;
};

const MAX_STDERR_LINES = 12;
const COMMAND_TIMEOUT_MS = 8_000;

function createBaseEvent(session: RuntimeSession) {
  return {
    id: randomUUID(),
    projectId: session.params.projectId,
    sessionId: session.sessionId,
    turnId: session.turnId,
    timestamp: new Date().toISOString(),
  };
}

function trimLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return Boolean(value) && typeof (value as { then?: unknown }).then === "function";
}

async function settle(value: unknown) {
  if (isPromiseLike(value)) {
    await value;
  }
}

function asRuntimeInput(value: unknown): RuntimeInput | null {
  if (!isRecord(value)) {
    return null;
  }

  return value as RuntimeInput;
}

function createUserInputMessage(prompt: string) {
  return {
    type: "user",
    uuid: randomUUID(),
    session_id: "",
    timestamp: new Date().toISOString(),
    message: {
      role: "user",
      content: prompt,
    },
    parent_tool_use_id: null,
  };
}

function createPermissionControlResponse(
  permission: PendingPermission,
  decision: ProjectRuntimePermissionDecision,
) {
  const response =
    decision === "allow_once"
      ? {
          behavior: "allow",
          updatedInput: permission.input,
          toolUseID: permission.toolUseId,
          decisionClassification: "user_temporary",
        }
      : {
          behavior: "deny",
          message: "Denied by user.",
          interrupt: true,
          toolUseID: permission.toolUseId,
          decisionClassification: "user_reject",
        };

  return {
    type: "control_response",
    response: {
      subtype: "success",
      request_id: permission.requestId,
      response,
    },
  };
}

async function writeRuntimeInput(
  session: RuntimeSession,
  message: Record<string, unknown>,
) {
  if (!session.stdin || session.inputClosed) {
    return false;
  }

  const line = `${JSON.stringify(message)}\n`;

  try {
    if (typeof session.stdin.write === "function") {
      await settle(session.stdin.write(line));
      await settle(session.stdin.flush?.());
      return true;
    }

    if (typeof session.stdin.getWriter === "function") {
      const writer = session.stdin.getWriter();

      try {
        await settle(writer.write(new TextEncoder().encode(line)));
      } finally {
        writer.releaseLock?.();
      }

      return true;
    }
  } catch {
    session.inputClosed = true;
    return false;
  }

  return false;
}

async function closeRuntimeInput(session: RuntimeSession) {
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
      return;
    }

    if (typeof session.stdin.getWriter === "function") {
      const writer = session.stdin.getWriter();

      try {
        await settle(writer.close?.());
      } finally {
        writer.releaseLock?.();
      }
    }
  } catch {
    // The child may already have exited or closed stdin.
  }
}

async function readStreamText(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return "";
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      return text;
    }

    text += decoder.decode(value, { stream: true });
  }
}

async function runRuntimeCommand(args: string[], cwd: string) {
  traceRuntimeBridge("runtime.command.start", {
    cwd,
    args,
  });
  const child = Bun.spawn(args, {
    cwd,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    windowsHide: true,
  });
  const timeout = setTimeout(() => child.kill(), COMMAND_TIMEOUT_MS);

  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      readStreamText(child.stdout),
      readStreamText(child.stderr),
      child.exited,
    ]);

    traceRuntimeBridge("runtime.command.exit", {
      cwd,
      args,
      exitCode,
      stdout: trimLines(stdout).slice(-6),
      stderr: trimLines(stderr).slice(-6),
    });

    return { stdout, stderr, exitCode };
  } finally {
    clearTimeout(timeout);
  }
}

function parseMissingRelativeImports(lines: string[]) {
  const line = lines.find((item) => item.startsWith("missing_relative_imports="));

  if (!line) {
    return null;
  }

  const count = Number(line.split("=").at(1));

  return Number.isFinite(count) ? count : null;
}

function isDirectory(value: string) {
  try {
    return statSync(value).isDirectory();
  } catch {
    return false;
  }
}

function resolveWorkingDirectory(params: ProjectRuntimeTurnParams) {
  const cwd = params.cwd?.trim();

  if (cwd && isDirectory(cwd)) {
    return { cwd };
  }

  if (cwd) {
    return {
      cwd: null,
      error: `Project folder does not exist or is not a directory: ${cwd}`,
    };
  }

  return {
    cwd: null,
    error:
      "Project folder is not linked yet. Select or create a project folder before running the native runtime.",
  };
}

function resolveRuntimeModel(model: string) {
  const normalized = model.trim();
  const projectAgentModels: Record<string, string> = {
    "FPTClaw Agent / Builder": "sonnet",
    "FPTClaw Agent / Planner": "sonnet",
    "FPTClaw Agent / Reviewer": "opus",
  };

  if (projectAgentModels[normalized]) {
    return projectAgentModels[normalized];
  }

  if (/^(claude-[a-z0-9.-]+|opus|sonnet|haiku)$/i.test(normalized)) {
    return normalized;
  }

  return null;
}

function buildRuntimePrompt(params: ProjectRuntimeTurnParams) {
  const prompt = params.prompt.trim();
  const metadata: string[] = [
    `Project: ${params.projectName} (#${params.projectId})`,
    `Mode: ${params.mode}`,
    `Project model: ${params.model}`,
  ];

  if (params.contextRefs.length > 0) {
    metadata.push(`Context refs: ${params.contextRefs.join(", ")}`);
  }

  if (params.attachments.length > 0) {
    metadata.push(
      "Attachments:",
      ...params.attachments.map(
        (attachment) => `- ${attachment.name} (${attachment.kind}): ${attachment.path}`,
      ),
    );
  }

  return `${prompt}\n\n<project_context>\n${metadata.join("\n")}\n</project_context>`;
}

function previewInput(input: unknown) {
  if (!input || typeof input !== "object") {
    return "";
  }

  const parts: string[] = [];

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string" && value.trim()) {
      parts.push(`${key}: ${value.slice(0, 80)}`);
    }

    if (parts.length >= 2) {
      break;
    }
  }

  return parts.join(" · ");
}

function extractTextFromContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }

      const item = block as Record<string, unknown>;

      if (item.type === "text" && typeof item.text === "string") {
        return item.text;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractToolResultSummary(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }

      const item = block as Record<string, unknown>;

      if (item.type === "text" && typeof item.text === "string") {
        return item.text;
      }

      if (item.type === "image") {
        return "Image result";
      }

      return "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseRuntimeJsonLine(line: string) {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function handleRuntimeLine(
  session: RuntimeSession,
  line: string,
  emit: ProjectRuntimeBridgeOptions["emit"],
) {
  const parsed = parseRuntimeJsonLine(line);

  if (!parsed) {
    return;
  }

  if (parsed.type === "system" && parsed.subtype === "init") {
    const tools = Array.isArray(parsed.tools) ? parsed.tools.length : 0;
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "running",
      summary: tools > 0 ? `${tools} runtime tools ready` : "Runtime initialized",
    });
    return;
  }

  if (parsed.type === "stream_event") {
    const event = parsed.event as Record<string, unknown> | undefined;
    const delta = event?.delta as Record<string, unknown> | undefined;

    if (delta?.type === "text_delta" && typeof delta.text === "string") {
      emit({
        ...createBaseEvent(session),
        type: "assistant_delta",
        text: delta.text,
      });
    }

    if (
      delta?.type === "thinking_delta" &&
      typeof delta.thinking === "string"
    ) {
      emit({
        ...createBaseEvent(session),
        type: "reasoning",
        text: delta.thinking,
      });
    }

    return;
  }

  if (parsed.type === "assistant") {
    const message = parsed.message as Record<string, unknown> | undefined;
    const content = message?.content;

    if (Array.isArray(content)) {
      for (const block of content) {
        if (!block || typeof block !== "object") {
          continue;
        }

        const item = block as Record<string, unknown>;

        if (item.type === "tool_use") {
          const toolName = typeof item.name === "string" ? item.name : "Tool";
          const toolUseId = typeof item.id === "string" ? item.id : undefined;
          const summary = previewInput(item.input) || toolName;

          if (toolUseId) {
            session.toolUseNames.set(toolUseId, toolName);
          }

          emit({
            ...createBaseEvent(session),
            type: "tool_use",
            toolUseId,
            toolName,
            summary,
          });
        }
      }
    }

    const text = extractTextFromContent(content);

    if (text) {
      emit({
        ...createBaseEvent(session),
        type: "assistant_message",
        text,
      });
    }

    return;
  }

  if (parsed.type === "user") {
    const message = parsed.message as Record<string, unknown> | undefined;
    const content = message?.content;

    if (Array.isArray(content)) {
      for (const block of content) {
        if (!block || typeof block !== "object") {
          continue;
        }

        const item = block as Record<string, unknown>;

        if (item.type !== "tool_result") {
          continue;
        }

        const toolUseId =
          typeof item.tool_use_id === "string" ? item.tool_use_id : undefined;
        const summary =
          extractToolResultSummary(item.content) ||
          (item.is_error === true ? "Tool failed." : "Tool completed.");

        emit({
          ...createBaseEvent(session),
          type: "tool_result",
          toolUseId,
          toolName: toolUseId ? session.toolUseNames.get(toolUseId) : undefined,
          summary,
          isError: item.is_error === true,
        });
      }
    }

    return;
  }

  if (parsed.type === "control_cancel_request") {
    const requestId =
      typeof parsed.request_id === "string" ? parsed.request_id : undefined;

    if (requestId && session.pendingPermissions.has(requestId)) {
      const permission = session.pendingPermissions.get(requestId);
      session.pendingPermissions.delete(requestId);
      emit({
        ...createBaseEvent(session),
        type: "permission_response",
        requestId,
        toolName: permission?.toolName,
        decision: "canceled",
        accepted: true,
      });
    }

    return;
  }

  if (parsed.type === "control_request") {
    const request = parsed.request as Record<string, unknown> | undefined;
    const subtype = typeof request?.subtype === "string" ? request.subtype : "";
    const requestId =
      typeof parsed.request_id === "string" ? parsed.request_id : randomUUID();
    traceRuntimeBridge("runtime.turn.control_request", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      requestId,
      subtype,
      toolName: typeof request?.tool_name === "string" ? request.tool_name : undefined,
    });

    if (subtype !== "can_use_tool") {
      void writeRuntimeInput(session, {
        type: "control_response",
        response: {
          subtype: "error",
          request_id: requestId,
          error: `Unsupported control request: ${subtype || "unknown"}`,
        },
      });
      emit({
        ...createBaseEvent(session),
        type: "system",
        level: "warning",
        message: `Runtime requested unsupported control action: ${
          subtype || "unknown"
        }`,
      });
      return;
    }

    const toolName =
      typeof request?.tool_name === "string" ? request.tool_name : "Tool";
    const toolUseId =
      typeof request?.tool_use_id === "string" ? request.tool_use_id : undefined;
    const input = toRecord(request?.input);

    session.pendingPermissions.set(requestId, {
      requestId,
      toolName,
      toolUseId,
      input,
    });

    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "requires_action",
      summary: `${toolName} needs approval`,
    });
    emit({
      ...createBaseEvent(session),
      type: "permission_request",
      requestId,
      toolName,
      summary: previewInput(input) || `${toolName} needs approval`,
      canRespond: Boolean(session.stdin && !session.inputClosed),
    });
    return;
  }

  if (parsed.type === "result") {
    session.emittedResult = true;
    traceRuntimeBridge("runtime.turn.result", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      isError: parsed.is_error === true,
      durationMs:
        typeof parsed.duration_ms === "number" ? parsed.duration_ms : undefined,
      errorCount: Array.isArray(parsed.errors) ? parsed.errors.length : 0,
    });
    for (const permission of session.pendingPermissions.values()) {
      emit({
        ...createBaseEvent(session),
        type: "permission_response",
        requestId: permission.requestId,
        toolName: permission.toolName,
        decision: "canceled",
        accepted: true,
      });
    }
    session.pendingPermissions.clear();
    void closeRuntimeInput(session);
    emit({
      ...createBaseEvent(session),
      type: "result",
      isError: parsed.is_error === true,
      result: typeof parsed.result === "string" ? parsed.result : "",
      errors: Array.isArray(parsed.errors)
        ? parsed.errors.filter((error): error is string => typeof error === "string")
        : undefined,
      durationMs:
        typeof parsed.duration_ms === "number" ? parsed.duration_ms : undefined,
    });
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: parsed.is_error === true ? "failed" : "completed",
      summary: parsed.is_error === true ? "Runtime failed" : "Runtime completed",
    });
  }
}

async function readRuntimeLines(
  session: RuntimeSession,
  stream: ReadableStream<Uint8Array> | null,
  emit: ProjectRuntimeBridgeOptions["emit"],
) {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      handleRuntimeLine(session, line, emit);
    }
  }

  if (buffer.trim()) {
    handleRuntimeLine(session, buffer, emit);
  }
}

async function readRuntimeStderr(
  session: RuntimeSession,
  stream: ReadableStream<Uint8Array> | null,
) {
  if (!stream) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      traceRuntimeBridge("runtime.turn.stderr", {
        sessionId: session.sessionId,
        turnId: session.turnId,
        line: trimmed,
      });

      if (session.lastStderr.length >= MAX_STDERR_LINES) {
        session.lastStderr.shift();
      }

      session.lastStderr.push(trimmed);
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.trim();
    traceRuntimeBridge("runtime.turn.stderr", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      line: trimmed,
    });
    session.lastStderr.push(trimmed);
  }
}

export function createProjectRuntimeBridge({
  emit,
}: ProjectRuntimeBridgeOptions) {
  const sessions = new Map<string, RuntimeSession>();

  async function getStatus(): Promise<ProjectRuntimeStatusResult> {
    const runtimeResolution = resolveRuntimeRoot();
    const { runtimeRoot, runtimeEntry } = runtimeResolution;

    traceRuntimeBridge("runtime.status.resolve", runtimeResolution);

    if (!existsSync(runtimeEntry)) {
      return {
        available: false,
        cliReady: false,
        runtimeRoot,
        version: null,
        restoreCheck: {
          missingRelativeImports: null,
          output: [],
        },
        activeSessions: sessions.size,
        traceLogPath: runtimeResolution.traceLogPath,
        runtimeRootCandidates: runtimeResolution.candidates,
        error: `Runtime package entrypoint was not found at ${runtimeEntry}.`,
      };
    }

    const [versionCheck, restoreCheck, helpCheck] = await Promise.all([
      runRuntimeCommand(["bun", runtimeEntry, "--version"], runtimeRoot),
      runRuntimeCommand(["bun", path.join(runtimeRoot, "src", "dev-entry.ts"), "--version"], runtimeRoot),
      runRuntimeCommand(["bun", runtimeEntry, "--help"], runtimeRoot),
    ]);
    const restoreOutput = trimLines(`${restoreCheck.stdout}\n${restoreCheck.stderr}`);
    const helpOutput = trimLines(`${helpCheck.stdout}\n${helpCheck.stderr}`);
    const version = trimLines(versionCheck.stdout).at(0) ?? null;

    return {
      available: versionCheck.exitCode === 0,
      cliReady: helpCheck.exitCode === 0,
      runtimeRoot,
      version,
      restoreCheck: {
        missingRelativeImports: parseMissingRelativeImports(restoreOutput),
        output: restoreOutput,
      },
      activeSessions: sessions.size,
      traceLogPath: runtimeResolution.traceLogPath,
      runtimeRootCandidates: runtimeResolution.candidates,
      error: helpCheck.exitCode === 0 ? undefined : helpOutput.at(0),
    };
  }

  function startTurn(params: ProjectRuntimeTurnParams): ProjectRuntimeTurnResult {
    const sessionId = randomUUID();
    const turnId = randomUUID();
    const session: RuntimeSession = {
      params,
      sessionId,
      turnId,
      startedAt: Date.now(),
      process: null,
      stdin: null,
      inputClosed: false,
      lastStderr: [],
      toolUseNames: new Map(),
      pendingPermissions: new Map(),
      emittedResult: false,
      canceled: false,
    };

    traceRuntimeBridge("runtime.turn.accepted", {
      sessionId,
      turnId,
      projectId: params.projectId,
      projectName: params.projectName,
      cwd: params.cwd,
      mode: params.mode,
      model: params.model,
      promptLength: params.prompt.length,
      attachments: params.attachments.map((attachment) => ({
        name: attachment.name,
        kind: attachment.kind,
        path: attachment.path,
      })),
      contextRefs: params.contextRefs,
    });

    sessions.set(sessionId, session);
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "starting",
      summary: "Starting runtime",
    });

    void runTurn(session).finally(() => {
      sessions.delete(sessionId);
    });

    return {
      accepted: true,
      sessionId,
      turnId,
      native: true,
    };
  }

  async function runTurn(session: RuntimeSession) {
    const runtimeResolution = resolveRuntimeRoot();
    const { runtimeRoot, runtimeEntry } = runtimeResolution;

    traceRuntimeBridge("runtime.turn.resolve", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      projectId: session.params.projectId,
      runtimeResolution,
    });

    if (!existsSync(runtimeEntry)) {
      const error = `Runtime package entrypoint was not found at ${runtimeEntry}. Trace log: ${runtimeResolution.traceLogPath}`;
      emit({
        ...createBaseEvent(session),
        type: "system",
        level: "error",
        message: error,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "failed",
        summary: "Runtime unavailable",
      });
      traceRuntimeBridge("runtime.turn.entrypoint_missing", {
        sessionId: session.sessionId,
        turnId: session.turnId,
        runtimeResolution,
      });
      return;
    }

    const versionCheck = await runRuntimeCommand(
      ["bun", runtimeEntry, "--version"],
      runtimeRoot,
    );
    const runtimeVersion = trimLines(versionCheck.stdout).at(0) ?? "unknown";
    const resolvedCwd = resolveWorkingDirectory(session.params);
    const permissionMode = session.params.mode === "Plan" ? "plan" : "default";
    const prompt = buildRuntimePrompt(session.params);
    const runtimeModel = resolveRuntimeModel(session.params.model);

    if (!resolvedCwd.cwd) {
      const error =
        resolvedCwd.error ??
        "Project folder is unavailable for the native runtime.";
      traceRuntimeBridge("runtime.turn.project_folder_unavailable", {
        sessionId: session.sessionId,
        turnId: session.turnId,
        requestedCwd: session.params.cwd,
        error,
      });

      emit({
        ...createBaseEvent(session),
        type: "system",
        level: "error",
        message: error,
      });
      emit({
        ...createBaseEvent(session),
        type: "result",
        isError: true,
        result: error,
        errors: [error],
        durationMs: Date.now() - session.startedAt,
        exitCode: null,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "failed",
        summary: "Project folder unavailable",
      });
      return;
    }

    if (session.canceled) {
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "canceled",
        summary: "Runtime canceled",
      });
      return;
    }

    emit({
      ...createBaseEvent(session),
      type: "system",
      level: "info",
      message: `Runtime package ${runtimeVersion} starting in ${resolvedCwd.cwd}`,
    });

    const runtimeArgs = [
      "bun",
      runtimeEntry,
      "--print",
      "--input-format",
      "stream-json",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
      "--permission-prompt-tool",
      "stdio",
      "--permission-mode",
      permissionMode,
    ];

    if (runtimeModel) {
      runtimeArgs.push("--model", runtimeModel);
    }

    traceRuntimeBridge("runtime.turn.spawn", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      runtimeRoot,
      runtimeEntry,
      cwd: resolvedCwd.cwd,
      args: runtimeArgs,
      permissionMode,
      runtimeModel,
      promptLength: prompt.length,
    });

    const child = Bun.spawn(
      runtimeArgs,
      {
        cwd: resolvedCwd.cwd,
        env: process.env,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        windowsHide: true,
      },
    );

    session.process = child;
    session.stdin = asRuntimeInput((child as { stdin?: unknown }).stdin);
    traceRuntimeBridge("runtime.turn.spawned", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      pid: child.pid,
      hasStdin: Boolean(session.stdin),
    });

    const wrotePrompt = await writeRuntimeInput(
      session,
      createUserInputMessage(prompt),
    );

    if (!wrotePrompt) {
      const error = "Runtime input pipe is not available.";
      traceRuntimeBridge("runtime.turn.input_unavailable", {
        sessionId: session.sessionId,
        turnId: session.turnId,
        pid: child.pid,
      });
      child.kill();
      emit({
        ...createBaseEvent(session),
        type: "system",
        level: "error",
        message: error,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "failed",
        summary: error,
      });
      return;
    }

    const [exitCode] = await Promise.all([
      child.exited,
      readRuntimeLines(session, child.stdout, emit),
      readRuntimeStderr(session, child.stderr),
    ]).finally(() => closeRuntimeInput(session));

    traceRuntimeBridge("runtime.turn.exit", {
      sessionId: session.sessionId,
      turnId: session.turnId,
      exitCode,
      canceled: session.canceled,
      emittedResult: session.emittedResult,
      lastStderr: session.lastStderr,
    });

    if (session.canceled) {
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: "canceled",
        summary: "Runtime canceled",
      });
      return;
    }

    if (!session.emittedResult) {
      const errorText =
        session.lastStderr.join("\n") ||
        (exitCode === 0 ? "" : `Runtime exited with code ${exitCode}`);

      emit({
        ...createBaseEvent(session),
        type: "result",
        isError: exitCode !== 0,
        result: exitCode === 0 ? "" : errorText,
        errors: errorText ? [errorText] : undefined,
        durationMs: Date.now() - session.startedAt,
        exitCode,
      });
      emit({
        ...createBaseEvent(session),
        type: "session_state",
        state: exitCode === 0 ? "completed" : "failed",
        summary: exitCode === 0 ? "Runtime completed" : "Runtime failed",
      });
    }
  }

  function cancelTurn({ sessionId }: { sessionId: string }) {
    const session = sessions.get(sessionId);

    if (!session) {
      return { canceled: false };
    }

    session.canceled = true;
    void closeRuntimeInput(session);
    session.process?.kill();

    return { canceled: true };
  }

  async function respondPermission({
    sessionId,
    requestId,
    decision,
  }: ProjectRuntimePermissionResponseParams): Promise<ProjectRuntimePermissionResponseResult> {
    const session = sessions.get(sessionId);

    if (!session) {
      return {
        accepted: false,
        decision,
        error: "Runtime session is no longer active.",
      };
    }

    const permission = session.pendingPermissions.get(requestId);

    if (!permission) {
      return {
        accepted: false,
        decision,
        error: "Permission request is no longer pending.",
      };
    }

    if (session.canceled) {
      return {
        accepted: false,
        decision,
        error: "Runtime session is already canceled.",
      };
    }

    const sent = await writeRuntimeInput(
      session,
      createPermissionControlResponse(permission, decision),
    );

    if (!sent) {
      const error = "Runtime input pipe is closed.";
      traceRuntimeBridge("runtime.permission_response.failed", {
        sessionId,
        turnId: session.turnId,
        requestId,
        decision,
        error,
      });

      emit({
        ...createBaseEvent(session),
        type: "permission_response",
        requestId,
        toolName: permission.toolName,
        decision,
        accepted: false,
        error,
      });

      return {
        accepted: false,
        decision,
        error,
      };
    }

    session.pendingPermissions.delete(requestId);
    traceRuntimeBridge("runtime.permission_response.sent", {
      sessionId,
      turnId: session.turnId,
      requestId,
      decision,
      toolName: permission.toolName,
    });

    emit({
      ...createBaseEvent(session),
      type: "permission_response",
      requestId,
      toolName: permission.toolName,
      decision,
      accepted: true,
    });
    emit({
      ...createBaseEvent(session),
      type: "session_state",
      state: "running",
      summary: decision === "deny" ? "Permission denied" : "Permission allowed",
    });

    return {
      accepted: true,
      decision,
    };
  }

  return {
    cancelTurn,
    getStatus,
    respondPermission,
    startTurn,
  };
}
