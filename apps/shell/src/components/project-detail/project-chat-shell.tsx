import * as React from "react";
import { isBrowserHarnessPrompt } from "@repo/browser";
import { BotIcon } from "lucide-react";

import type {
  ProjectChatMessageAction,
  ProjectChatMessage as ProjectChatMessageData,
  ProjectDetail,
} from "../../data/project-detail";
import type {
  ProjectBrowserHarnessEvent,
  ProjectBrowserHarnessSessionState,
} from "../../electrobun/browser-harness-types";
import {
  cancelProjectBrowserHarnessTask,
  canUseNativeBrowserHarness,
  startProjectBrowserHarnessTask,
  subscribeProjectBrowserHarnessEvents,
} from "../../lib/native-browser-harness";
import type {
  ProjectRuntimeEvent,
  ProjectRuntimePermissionDecision,
  ProjectRuntimePermissionResolution,
  ProjectRuntimeSessionState,
} from "../../electrobun/runtime-types";
import {
  cancelProjectRuntimeTurn,
  canUseNativeProjectRuntime,
  getProjectRuntimeStatus,
  respondProjectRuntimePermission,
  startProjectRuntimeTurn,
  subscribeProjectRuntimeEvents,
} from "../../lib/native-runtime";
import {
  ProjectChatComposer,
  type ProjectChatComposerSubmit,
} from "./project-chat-composer";
import { ProjectChatMessage } from "./project-chat-message";
import { ProjectTaskHeader } from "./project-task-header";

type ProjectChatShellProps = {
  detail: ProjectDetail;
};

type RuntimeUiState = {
  activeSessionId: string | null;
  state: ProjectRuntimeSessionState | "idle";
  summary: string;
  isRunning: boolean;
};

type BrowserHarnessUiState = {
  activeTaskId: string | null;
  state: ProjectBrowserHarnessSessionState | "idle";
  summary: string;
  isRunning: boolean;
};

const RUNTIME_PERMISSION_ALLOW_ACTION = "runtime-permission-allow-once";
const RUNTIME_PERMISSION_DENY_ACTION = "runtime-permission-deny";

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessageStatus(
  state: ProjectRuntimeSessionState,
): ProjectChatMessageData["status"] {
  if (state === "failed") {
    return "failed";
  }

  if (state === "canceled") {
    return "canceled";
  }

  if (state === "completed") {
    return "complete";
  }

  if (state === "requires_action") {
    return "pending";
  }

  return "running";
}

function getBrowserHarnessMessageStatus(
  state: ProjectBrowserHarnessSessionState,
): ProjectChatMessageData["status"] {
  if (state === "failed") {
    return "failed";
  }

  if (state === "canceled") {
    return "canceled";
  }

  if (state === "completed") {
    return "complete";
  }

  return "running";
}

function getPermissionActions(
  state: "ready" | "sending" = "ready",
  decision?: ProjectRuntimePermissionDecision,
): ProjectChatMessageAction[] {
  return [
    {
      id: RUNTIME_PERMISSION_ALLOW_ACTION,
      label: state === "sending" && decision === "allow_once" ? "Allowing" : "Allow once",
      variant: "default",
      disabled: state === "sending",
      pending: state === "sending" && decision === "allow_once",
      title: "Allow this runtime tool call one time",
    },
    {
      id: RUNTIME_PERMISSION_DENY_ACTION,
      label: state === "sending" && decision === "deny" ? "Denying" : "Deny",
      variant: "destructive",
      disabled: state === "sending",
      pending: state === "sending" && decision === "deny",
      title: "Deny this runtime tool call",
    },
  ];
}

function getActionId(action: ProjectChatMessageAction) {
  return typeof action === "string" ? action : action.id;
}

function formatPermissionDecision(decision: ProjectRuntimePermissionResolution) {
  if (decision === "allow_once") {
    return "allowed once";
  }

  if (decision === "deny") {
    return "denied";
  }

  return "closed by runtime";
}

function extractContextRefs(body: string) {
  const refs = new Set<string>();
  const pattern = /@("[^"]+"|[^\s]+)/g;

  for (const match of body.matchAll(pattern)) {
    const value = match[1]?.replace(/^"|"$/g, "").trim();

    if (value) {
      refs.add(value);
    }
  }

  return Array.from(refs);
}

function upsertMessage(
  messages: ProjectChatMessageData[],
  nextMessage: ProjectChatMessageData,
  merge?: (message: ProjectChatMessageData) => ProjectChatMessageData,
) {
  const index = messages.findIndex((message) => message.id === nextMessage.id);

  if (index === -1) {
    return [...messages, nextMessage];
  }

  const copy = [...messages];
  copy[index] = merge ? merge(copy[index]!) : nextMessage;

  return copy;
}

function appendRuntimeMessage(
  messages: ProjectChatMessageData[],
  message: ProjectChatMessageData,
) {
  if (messages.some((item) => item.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

function applyRuntimeEvent(
  messages: ProjectChatMessageData[],
  event: ProjectRuntimeEvent,
) {
  const time = formatMessageTime(new Date(event.timestamp));
  const base = {
    runtimeSessionId: event.sessionId,
    runtimeTurnId: event.turnId,
    time,
  };

  switch (event.type) {
    case "session_state":
      return upsertMessage(messages, {
        ...base,
        id: `runtime-state-${event.turnId}`,
        role: "system",
        kind: "tool",
        title: "Runtime session",
        body: event.summary ?? event.state,
        status: getMessageStatus(event.state),
      });
    case "system":
      return appendRuntimeMessage(messages, {
        ...base,
        id: `runtime-system-${event.id}`,
        role: "system",
        kind: event.level === "error" ? "question" : "tool",
        title: event.level === "error" ? "Runtime error" : "Runtime",
        body: event.message,
        status: event.level === "error" ? "failed" : "complete",
      });
    case "assistant_delta":
      return upsertMessage(
        messages,
        {
          ...base,
          id: `runtime-assistant-${event.turnId}`,
          role: "assistant",
          kind: "text",
          title: "FPTClaw Runtime",
          body: event.text,
          status: "running",
        },
        (message) => ({
          ...message,
          body: `${message.body}${event.text}`,
          status: "running",
          time,
        }),
      );
    case "assistant_message":
      return upsertMessage(
        messages,
        {
          ...base,
          id: `runtime-assistant-${event.turnId}`,
          role: "assistant",
          kind: "text",
          title: "FPTClaw Runtime",
          body: event.text,
          status: "complete",
        },
        (message) => ({
          ...message,
          body:
            message.body.length >= event.text.length
              ? message.body
              : event.text,
          status: "complete",
          time,
        }),
      );
    case "reasoning":
      return upsertMessage(
        messages,
        {
          ...base,
          id: `runtime-reasoning-${event.turnId}`,
          role: "assistant",
          kind: "reasoning",
          title: "Thinking",
          body: event.text,
          status: "running",
        },
        (message) => ({
          ...message,
          body: `${message.body}${event.text}`,
          status: "running",
          time,
        }),
      );
    case "tool_use":
      return upsertMessage(messages, {
        ...base,
        id: `runtime-tool-${event.toolUseId ?? event.id}`,
        role: "system",
        kind: "tool",
        title: event.toolName,
        body: event.summary,
        status: "running",
      });
    case "tool_result":
      return upsertMessage(messages, {
        ...base,
        id: `runtime-tool-${event.toolUseId ?? event.id}`,
        role: "system",
        kind: "tool",
        title: event.toolName ?? "Tool result",
        body: event.summary,
        status: event.isError ? "failed" : "complete",
      });
    case "permission_request":
      return appendRuntimeMessage(messages, {
        ...base,
        id: `runtime-permission-${event.requestId}`,
        role: "assistant",
        kind: "question",
        title: "Permission request",
        body: `${event.toolName}: ${event.summary}`,
        status: "pending",
        actions: event.canRespond ? getPermissionActions() : undefined,
        runtimePermissionRequestId: event.requestId,
        runtimePermissionToolName: event.toolName,
      });
    case "permission_response":
      return upsertMessage(
        messages,
        {
          ...base,
          id: `runtime-permission-${event.requestId}`,
          role: "assistant",
          kind: "question",
          title: "Permission request",
          body: event.error
            ? `Permission response failed: ${event.error}`
            : `Permission ${formatPermissionDecision(event.decision)}.`,
          status: event.accepted ? "complete" : "failed",
          runtimePermissionRequestId: event.requestId,
          runtimePermissionToolName: event.toolName,
        },
        (message) => ({
          ...message,
          body: event.error
            ? `${message.body}\n\nPermission response failed: ${event.error}`
            : `${message.body}\n\nPermission ${formatPermissionDecision(event.decision)}.`,
          status: event.accepted ? "complete" : "failed",
          actions: undefined,
          time,
        }),
      );
    case "result": {
      if (!event.isError && event.result) {
        return upsertMessage(
          messages,
          {
            ...base,
            id: `runtime-assistant-${event.turnId}`,
            role: "assistant",
            kind: "text",
            title: "FPTClaw Runtime",
            body: event.result,
            status: "complete",
          },
          (message) => ({
            ...message,
            body:
              message.body.length >= event.result.length
                ? message.body
                : event.result,
            status: "complete",
            time,
          }),
        );
      }

      return appendRuntimeMessage(messages, {
        ...base,
        id: `runtime-result-${event.id}`,
        role: "system",
        kind: event.isError ? "question" : "checkpoint",
        title: event.isError ? "Runtime stopped" : "Runtime complete",
        body:
          event.errors?.join("\n") ||
          event.result ||
          (event.isError ? "Runtime exited before returning a result." : "Done"),
        status: event.isError ? "failed" : "complete",
      });
    }
  }
}

function formatBrowserHarnessPlan(event: Extract<ProjectBrowserHarnessEvent, { type: "lead_plan" }>) {
  const { plan } = event;

  return [
    `Goal: ${plan.goal}`,
    `Start point: ${plan.startPoint}`,
    `Endpoint: ${plan.endpoint}`,
    `Mode: ${plan.mode}`,
    `Team: ${plan.workers.length} browser agents, 1 Hermes lead`,
    ...plan.workers.map(
      (worker) =>
        `- ${worker.agentName}: ${worker.profileName} (${worker.providerId})`,
    ),
  ].join("\n");
}

function formatProcessTitleCheck(
  event: Extract<ProjectBrowserHarnessEvent, { type: "process_title" }>,
) {
  return [
    `Profile: ${event.profileName}`,
    `PID: ${event.pid ?? "n/a"}`,
    `Provider: ${event.provider}`,
    `Mode: ${event.mode}`,
    `Expected process title: ${event.expectedProcessTitle}`,
    `Window title: ${event.observedWindowTitle || "headless/no window"}`,
    `Command line title marker verified: ${event.commandLineHasTitle ? "yes" : "no"}`,
  ].join("\n");
}

function applyBrowserHarnessEvent(
  messages: ProjectChatMessageData[],
  event: ProjectBrowserHarnessEvent,
) {
  const time = formatMessageTime(new Date(event.timestamp));
  const base = {
    browserHarnessTaskId: event.taskId,
    browserHarnessSessionId: event.sessionId,
    time,
  };

  switch (event.type) {
    case "session_state":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-state-${event.taskId}`,
        role: "system",
        kind: "tool",
        title: "Hermes browser harness",
        body: event.summary,
        status: getBrowserHarnessMessageStatus(event.state),
      });
    case "lead_plan":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-plan-${event.taskId}`,
        role: "assistant",
        kind: "checkpoint",
        title: "Hermes lead",
        body: formatBrowserHarnessPlan(event),
        status: "complete",
      });
    case "worker_state":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-worker-${event.taskId}-${event.agentId}`,
        role: "system",
        kind: "tool",
        title: event.agentName,
        body: event.pid
          ? `${event.summary}\nPID: ${event.pid}`
          : event.summary,
        status:
          event.state === "failed"
            ? "failed"
            : event.state === "reported"
              ? "complete"
              : "running",
      });
    case "process_title":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-title-${event.taskId}-${event.agentId}`,
        role: "system",
        kind: event.ok ? "checkpoint" : "question",
        title: "Browser process title",
        body: formatProcessTitleCheck(event),
        status: event.ok ? "complete" : "failed",
      });
    case "worker_report":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-report-${event.taskId}-${event.report.agentId}`,
        role: "assistant",
        kind: "tool",
        title: `${event.report.profileName} report`,
        body: event.report.summary,
        status: event.report.ok ? "complete" : "failed",
      });
    case "lead_validation":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-validation-${event.taskId}`,
        role: "assistant",
        kind: event.ok ? "checkpoint" : "question",
        title: "Lead validation",
        body: event.summary,
        status: event.ok ? "complete" : "failed",
      });
    case "result":
      return upsertMessage(messages, {
        ...base,
        id: `browser-harness-result-${event.taskId}`,
        role: "system",
        kind: event.ok ? "checkpoint" : "question",
        title: event.ok ? "Browser harness complete" : "Browser harness failed",
        body: event.errors?.length
          ? `${event.summary}\n${event.errors.join("\n")}`
          : event.summary,
        status: event.ok ? "complete" : "failed",
      });
  }
}

export function ProjectChatShell({ detail }: ProjectChatShellProps) {
  const [messages, setMessages] = React.useState(detail.messages);
  const [mode, setMode] = React.useState(detail.mode);
  const [runtimeState, setRuntimeState] = React.useState<RuntimeUiState>({
    activeSessionId: null,
    state: "idle",
    summary: canUseNativeProjectRuntime() ? "Checking runtime" : "",
    isRunning: false,
  });
  const [browserHarnessState, setBrowserHarnessState] =
    React.useState<BrowserHarnessUiState>({
      activeTaskId: null,
      state: "idle",
      summary: "",
      isRunning: false,
    });
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const activeSessionRef = React.useRef<string | null>(null);
  const activeBrowserTaskRef = React.useRef<string | null>(null);
  const pendingStopRef = React.useRef(false);
  const pendingBrowserStopRef = React.useRef(false);
  const shouldFollowOutputRef = React.useRef(true);

  React.useEffect(() => {
    setMessages(detail.messages);
    setMode(detail.mode);
    activeSessionRef.current = null;
    activeBrowserTaskRef.current = null;
    pendingStopRef.current = false;
    pendingBrowserStopRef.current = false;
    setRuntimeState({
      activeSessionId: null,
      state: "idle",
      summary: canUseNativeProjectRuntime() ? "Checking runtime" : "",
      isRunning: false,
    });
    setBrowserHarnessState({
      activeTaskId: null,
      state: "idle",
      summary: "",
      isRunning: false,
    });
  }, [detail]);

  React.useEffect(() => {
    let isMounted = true;

    if (!canUseNativeProjectRuntime()) {
      return;
    }

    void getProjectRuntimeStatus(detail.project.id).then((status) => {
      if (!isMounted || !status) {
        return;
      }

      const summary = status.cliReady
        ? `Runtime ${status.version ?? ""} ready`.trim()
        : `Runtime restore pending: ${
            status.error ?? status.version ?? "package check failed"
          }`;

      setRuntimeState((currentState) =>
        currentState.isRunning
          ? currentState
          : {
              ...currentState,
              summary,
            },
      );
    });

    return () => {
      isMounted = false;
    };
  }, [detail.project.id]);

  React.useEffect(() => {
    let dispose: (() => void) | undefined;
    let isDisposed = false;

    void subscribeProjectRuntimeEvents((event) => {
      if (event.projectId !== detail.project.id) {
        return;
      }

      if (event.type === "session_state") {
        const isRunning =
          event.state === "starting" ||
          event.state === "running" ||
          event.state === "requires_action";

        if (!isRunning && activeSessionRef.current === event.sessionId) {
          activeSessionRef.current = null;
        }

        setRuntimeState({
          activeSessionId: isRunning ? event.sessionId : null,
          state: event.state,
          summary: event.summary ?? event.state,
          isRunning,
        });
      }

      setMessages((currentMessages) =>
        applyRuntimeEvent(currentMessages, event),
      );
    }).then((unsubscribe) => {
      if (isDisposed) {
        unsubscribe();
        return;
      }

      dispose = unsubscribe;
    });

    return () => {
      isDisposed = true;
      dispose?.();
    };
  }, [detail.project.id]);

  React.useEffect(() => {
    let dispose: (() => void) | undefined;
    let isDisposed = false;

    if (!canUseNativeBrowserHarness()) {
      return;
    }

    void subscribeProjectBrowserHarnessEvents((event) => {
      if (event.projectId !== detail.project.id) {
        return;
      }

      if (event.type === "session_state") {
        const isRunning =
          event.state === "starting" ||
          event.state === "planning" ||
          event.state === "running" ||
          event.state === "validating";

        if (!isRunning && activeBrowserTaskRef.current === event.taskId) {
          activeBrowserTaskRef.current = null;
        }

        setBrowserHarnessState({
          activeTaskId: isRunning ? event.taskId : null,
          state: event.state,
          summary: event.summary,
          isRunning,
        });
      }

      setMessages((currentMessages) =>
        applyBrowserHarnessEvent(currentMessages, event),
      );
    }).then((unsubscribe) => {
      if (isDisposed) {
        unsubscribe();
        return;
      }

      dispose = unsubscribe;
    });

    return () => {
      isDisposed = true;
      dispose?.();
    };
  }, [detail.project.id]);

  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || !shouldFollowOutputRef.current) {
      return;
    }

    scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  async function handleSend({ body, attachments }: ProjectChatComposerSubmit) {
    const now = new Date();
    const nextMessage: ProjectChatMessageData = {
      id: `draft-${detail.project.id}-${now.getTime()}`,
      role: "user",
      kind: "text",
      title: "You",
      body: body || "Attached files",
      time: formatMessageTime(now),
      files:
        attachments.length > 0
          ? attachments.map((attachment) => attachment.path)
          : undefined,
    };

    setMessages((currentMessages) => [...currentMessages, nextMessage]);

    if (
      canUseNativeBrowserHarness() &&
      isBrowserHarnessPrompt(nextMessage.body)
    ) {
      setBrowserHarnessState({
        activeTaskId: null,
        state: "starting",
        summary: "Starting Hermes browser harness",
        isRunning: true,
      });
      pendingBrowserStopRef.current = false;

      try {
        const result = await startProjectBrowserHarnessTask({
          projectId: detail.project.id,
          projectName: detail.project.name,
          cwd: detail.project.folderPath,
          prompt: nextMessage.body,
        });

        if (!result.accepted || !result.taskId) {
          const message =
            result.error ?? "Native browser harness did not accept the task.";

          setBrowserHarnessState({
            activeTaskId: null,
            state: "failed",
            summary: message,
            isRunning: false,
          });
          setMessages((currentMessages) => [
            ...currentMessages,
            {
              id: `browser-harness-start-error-${detail.project.id}-${Date.now()}`,
              role: "system",
              kind: "question",
              title: "Browser harness error",
              body: message,
              time: formatMessageTime(),
              status: "failed",
            },
          ]);
          return;
        }

        activeBrowserTaskRef.current = result.taskId;
        setBrowserHarnessState((currentState) => ({
          ...currentState,
          activeTaskId: result.taskId,
        }));

        if (pendingBrowserStopRef.current) {
          await cancelProjectBrowserHarnessTask({ taskId: result.taskId });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to start browser harness.";

        setBrowserHarnessState({
          activeTaskId: null,
          state: "failed",
          summary: message,
          isRunning: false,
        });
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `browser-harness-start-error-${detail.project.id}-${Date.now()}`,
            role: "system",
            kind: "question",
            title: "Browser harness error",
            body: message,
            time: formatMessageTime(),
            status: "failed",
          },
        ]);
      }

      return;
    }

    if (!canUseNativeProjectRuntime()) {
      return;
    }

    setRuntimeState({
      activeSessionId: null,
      state: "starting",
      summary: "Starting runtime",
      isRunning: true,
    });
    pendingStopRef.current = false;

    try {
      const result = await startProjectRuntimeTurn({
        projectId: detail.project.id,
        projectName: detail.project.name,
        cwd: detail.project.folderPath,
        prompt: nextMessage.body,
        mode,
        model: detail.model,
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          name: attachment.name,
          path: attachment.path,
          kind: attachment.kind,
        })),
        contextRefs: extractContextRefs(body),
      });

      if (!result) {
        setRuntimeState({
          activeSessionId: null,
          state: "idle",
          summary: "",
          isRunning: false,
        });
        return;
      }

      activeSessionRef.current = result.sessionId;
      setRuntimeState((currentState) => ({
        ...currentState,
        activeSessionId: result.sessionId,
      }));

      if (pendingStopRef.current) {
        await cancelProjectRuntimeTurn({ sessionId: result.sessionId });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start runtime.";

      setRuntimeState({
        activeSessionId: null,
        state: "failed",
        summary: message,
        isRunning: false,
      });
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `runtime-start-error-${detail.project.id}-${Date.now()}`,
          role: "system",
          kind: "question",
          title: "Runtime error",
          body: message,
          time: formatMessageTime(),
          status: "failed",
        },
      ]);
    }
  }

  async function handleMessageAction(
    message: ProjectChatMessageData,
    action: ProjectChatMessageAction,
  ) {
    const actionId = getActionId(action);

    if (
      actionId !== RUNTIME_PERMISSION_ALLOW_ACTION &&
      actionId !== RUNTIME_PERMISSION_DENY_ACTION
    ) {
      return;
    }

    const requestId = message.runtimePermissionRequestId;
    const sessionId = message.runtimeSessionId;
    const decision: ProjectRuntimePermissionDecision =
      actionId === RUNTIME_PERMISSION_ALLOW_ACTION ? "allow_once" : "deny";

    if (!requestId || !sessionId) {
      setMessages((currentMessages) =>
        upsertMessage(currentMessages, {
          ...message,
          body: `${message.body}\n\nPermission response failed: missing runtime request metadata.`,
          status: "failed",
          actions: getPermissionActions(),
          time: formatMessageTime(),
        }),
      );
      return;
    }

    setMessages((currentMessages) =>
      upsertMessage(currentMessages, {
        ...message,
        status: "pending",
        actions: getPermissionActions("sending", decision),
        time: formatMessageTime(),
      }),
    );

    const response = await respondProjectRuntimePermission({
      sessionId,
      requestId,
      decision,
    }).catch((error: unknown) => ({
      accepted: false,
      decision,
      error:
        error instanceof Error
          ? error.message
          : "Runtime permission response failed.",
    }));

    if (!response.accepted) {
      setMessages((currentMessages) =>
        upsertMessage(currentMessages, {
          ...message,
          body: `${message.body}\n\nPermission response failed: ${
            response.error ?? "runtime rejected the response"
          }`,
          status: "failed",
          actions: getPermissionActions(),
          time: formatMessageTime(),
        }),
      );
    }
  }

  async function handleStopRuntime() {
    const activeBrowserTaskId =
      activeBrowserTaskRef.current ?? browserHarnessState.activeTaskId;

    if (activeBrowserTaskId) {
      pendingBrowserStopRef.current = false;
      setBrowserHarnessState((currentState) => ({
        ...currentState,
        summary: "Stopping browser harness",
        isRunning: true,
      }));
      await cancelProjectBrowserHarnessTask({ taskId: activeBrowserTaskId });
      return;
    }

    if (browserHarnessState.isRunning) {
      pendingBrowserStopRef.current = true;
      setBrowserHarnessState((currentState) => ({
        ...currentState,
        summary: "Stopping browser harness",
        isRunning: true,
      }));
      return;
    }

    const sessionId = activeSessionRef.current ?? runtimeState.activeSessionId;

    if (!sessionId) {
      pendingStopRef.current = true;
      setRuntimeState((currentState) => ({
        ...currentState,
        summary: "Stopping runtime",
        isRunning: true,
      }));
      return;
    }

    pendingStopRef.current = false;
    setRuntimeState((currentState) => ({
      ...currentState,
      summary: "Stopping runtime",
      isRunning: true,
    }));
    await cancelProjectRuntimeTurn({ sessionId });
  }

  function handleScroll() {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const distanceFromBottom =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

    shouldFollowOutputRef.current = distanceFromBottom < 80;
  }

  const isAgentRunning = runtimeState.isRunning || browserHarnessState.isRunning;
  const agentSummary =
    browserHarnessState.isRunning || browserHarnessState.summary
      ? browserHarnessState.summary
      : runtimeState.summary;

  return (
    <section
      className="grid h-full min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr_auto] overflow-hidden bg-background"
      data-testid="project-chat-shell"
    >
      <ProjectTaskHeader detail={{ ...detail, mode }} />
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="min-h-0 overflow-auto px-4 py-4 lg:px-5"
        data-testid="project-chat-scroller"
      >
        <div
          className="mx-auto flex max-w-4xl flex-col gap-3"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div
              className="flex min-h-[min(28rem,60vh)] items-center justify-center px-3 py-10 text-center"
              data-testid="project-chat-empty"
            >
              <div className="max-w-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl border bg-primary/10 text-primary shadow-xs">
                  <BotIcon className="size-6" />
                </span>
                <h2 className="mt-4 text-base font-semibold">Runtime chat</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Send a message to start working with the AI agent on this project.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ProjectChatMessage
                key={message.id}
                message={message}
                onAction={handleMessageAction}
              />
            ))
          )}
        </div>
      </div>
      <ProjectChatComposer
        detail={detail}
        mode={mode}
        model={detail.model}
        isRunning={isAgentRunning}
        runtimeSummary={agentSummary}
        onModeChange={setMode}
        onSend={handleSend}
        onStop={handleStopRuntime}
      />
    </section>
  );
}
