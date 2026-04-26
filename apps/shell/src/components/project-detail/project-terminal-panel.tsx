import * as React from "react";
import {
  AlertTriangleIcon,
  Loader2Icon,
  Minimize2Icon,
  PlayIcon,
  TerminalSquareIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Terminal,
  type TerminalHandle,
} from "@repo/ui/components/terminal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";
import {
  canUseNativeProjectTerminal,
  startProjectTerminal,
  stopProjectTerminal,
  subscribeProjectTerminalEvents,
  writeProjectTerminalInput,
} from "../../lib/native-terminal";

type ProjectTerminalSession = {
  id: string;
  name: string;
  cwd: string | null;
  status: "starting" | "running" | "exited" | "failed";
  pid: number | null;
  exitCode?: number | null;
  error?: string;
  transcript?: string;
};

export type ProjectTerminalPanelProps = {
  detail: ProjectDetail;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export type ProjectTerminalPanelHandle = {
  splitTerminal: () => void;
};

function getProjectRoot(projectId: number, folderPath?: string | null) {
  return (
    folderPath ??
    `projects/${String(projectId).padStart(3, "0")}`
  );
}

function createTerminalSession(
  index: number,
  projectRoot: string,
): ProjectTerminalSession {
  return {
    id: crypto.randomUUID(),
    name: `PowerShell ${index}`,
    cwd: projectRoot,
    status: "starting",
    pid: null,
  };
}

function formatTerminalCommand(command: string) {
  const trimmed = command.trim();

  return trimmed ? `${trimmed}\r\n` : "";
}

function TerminalPane({
  session,
  index,
  total,
  isActive,
  canClose,
  onActivate,
  onClose,
  onReady,
  onInput,
  onCommand,
}: {
  session: ProjectTerminalSession;
  index: number;
  total: number;
  isActive: boolean;
  canClose: boolean;
  onActivate: () => void;
  onClose: () => void;
  onReady: (sessionId: string, terminal: TerminalHandle) => void;
  onInput: (sessionId: string, data: string) => void;
  onCommand: (sessionId: string, data: string) => void;
}) {
  const terminalRef = React.useRef<TerminalHandle>(null);
  const [command, setCommand] = React.useState("");

  function submitCommand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextCommand = formatTerminalCommand(command);

    if (!nextCommand) {
      return;
    }

    onCommand(session.id, nextCommand);
    setCommand("");
  }

  return (
    <section
      className={cn(
        "flex min-w-0 flex-1 flex-col overflow-hidden border-l first:border-l-0",
        isActive && "bg-muted/20",
      )}
      data-testid="project-terminal-pane"
      data-active={isActive ? "true" : "false"}
      style={{ flexBasis: 0 }}
      onMouseDown={onActivate}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-background px-3">
        <TerminalSquareIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{session.name}</h3>
            {session.status === "starting" ? (
              <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />
            ) : null}
            {session.status === "failed" ? (
              <AlertTriangleIcon className="size-3.5 text-destructive" />
            ) : null}
            {session.pid ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                pid {session.pid}
              </span>
            ) : null}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!canClose}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              data-testid="project-terminal-close"
            >
              <XIcon />
              <span className="sr-only">Close {session.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {canClose ? "Close terminal" : "Keep one terminal open"}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-zinc-950 p-2 pb-0">
        <pre
          className="sr-only"
          aria-live="polite"
          data-testid="project-terminal-transcript"
        >
          {session.transcript}
        </pre>
        <Terminal
          ref={terminalRef}
          rows={24}
          theme="monokai"
          className="h-full min-h-0 overflow-hidden rounded-md border-zinc-800"
          data-testid="project-terminal"
          aria-label={`${session.name} terminal ${index + 1} of ${total}`}
          onData={(data) => onInput(session.id, data)}
          onReady={() => {
            if (terminalRef.current) {
              onReady(session.id, terminalRef.current);
            }
          }}
        />
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t bg-background p-2"
        onSubmit={submitCommand}
      >
        <Input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          className="h-8 font-mono text-xs"
          placeholder="Command"
          disabled={session.status !== "running"}
          data-testid="project-terminal-command-input"
        />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={session.status !== "running" || !command.trim()}
          data-testid="project-terminal-command-run"
        >
          <PlayIcon />
          <span className="sr-only">Run command</span>
        </Button>
      </form>
    </section>
  );
}

export const ProjectTerminalPanel = React.forwardRef<
  ProjectTerminalPanelHandle,
  ProjectTerminalPanelProps
>(function ProjectTerminalPanel(
  { detail, isFullscreen = false, onFullscreenChange },
  ref,
) {
  const projectId = detail.project.id;
  const projectRoot = React.useMemo(
    () => getProjectRoot(projectId, detail.project.folderPath),
    [detail.project.folderPath, projectId],
  );
  const [terminalIndex, setTerminalIndex] = React.useState(1);
  const [sessions, setSessions] = React.useState<ProjectTerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string>();
  const sessionsRef = React.useRef<ProjectTerminalSession[]>([]);
  const terminalRefs = React.useRef(new Map<string, TerminalHandle>());
  const pendingOutput = React.useRef(new Map<string, string[]>());

  React.useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const writeToTerminal = React.useCallback((sessionId: string, data: string) => {
    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              transcript: `${session.transcript ?? ""}${data}`.slice(-8_000),
            }
          : session,
      ),
    );

    const terminal = terminalRefs.current.get(sessionId);

    if (terminal) {
      terminal.write(data);
      return;
    }

    const queued = pendingOutput.current.get(sessionId) ?? [];
    queued.push(data);
    pendingOutput.current.set(sessionId, queued);
  }, []);

  const updateSession = React.useCallback(
    (
      sessionId: string,
      patch: Partial<ProjectTerminalSession>,
    ) => {
      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === sessionId ? { ...session, ...patch } : session,
        ),
      );
    },
    [],
  );

  React.useEffect(() => {
    let isDisposed = false;

    setTerminalIndex(1);
    setSessions([]);
    setActiveSessionId(undefined);
    terminalRefs.current.clear();
    pendingOutput.current.clear();

    const firstSession = createTerminalSession(1, projectRoot);

    function openInitialSession() {
      setSessions([firstSession]);
      setActiveSessionId(firstSession.id);
      void startNativeSession(firstSession);
    }

    async function startNativeSession(session: ProjectTerminalSession) {
      if (!canUseNativeProjectTerminal()) {
        updateSession(session.id, {
          status: "failed",
          error: "Native terminal bridge is not available in web mode.",
        });
        writeToTerminal(
          session.id,
          "Native terminal bridge is not available in web mode.\r\n",
        );
        return;
      }

      const result = await startProjectTerminal({
        projectId,
        sessionId: session.id,
        name: session.name,
        cwd: session.cwd ?? undefined,
      });

      if (isDisposed) {
        return;
      }

      if (!result.accepted) {
        updateSession(session.id, {
          status: "failed",
          error: result.error,
        });
        writeToTerminal(session.id, `${result.error ?? "Terminal failed."}\r\n`);
      }
    }

    openInitialSession();

    return () => {
      isDisposed = true;
      for (const session of sessionsRef.current) {
        void stopProjectTerminal(session.id);
      }
    };
  }, [projectId, projectRoot, updateSession, writeToTerminal]);

  React.useEffect(() => {
    let dispose: (() => void) | undefined;
    let isDisposed = false;

    void subscribeProjectTerminalEvents((event) => {
      if (event.projectId !== projectId) {
        return;
      }

      if (event.type === "data") {
        writeToTerminal(event.sessionId, event.data);
        return;
      }

      if (event.type === "state") {
        updateSession(event.sessionId, {
          status: event.state,
          pid: event.pid ?? null,
          cwd: event.cwd ?? null,
        });
        return;
      }

      updateSession(event.sessionId, {
        status: "exited",
        pid: null,
        exitCode: event.exitCode,
      });
      writeToTerminal(event.sessionId, `\r\n${event.summary}\r\n`);
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
  }, [projectId, updateSession, writeToTerminal]);

  const openSession = React.useCallback(
    (session: ProjectTerminalSession) => {
      setSessions((currentSessions) => [...currentSessions, session]);
      setActiveSessionId(session.id);

      if (!canUseNativeProjectTerminal()) {
        updateSession(session.id, {
          status: "failed",
          error: "Native terminal bridge is not available in web mode.",
        });
        writeToTerminal(
          session.id,
          "Native terminal bridge is not available in web mode.\r\n",
        );
        return;
      }

      void startProjectTerminal({
        projectId,
        sessionId: session.id,
        name: session.name,
        cwd: session.cwd ?? undefined,
      }).then((result) => {
        if (!result.accepted) {
          updateSession(session.id, {
            status: "failed",
            error: result.error,
          });
          writeToTerminal(
            session.id,
            `${result.error ?? "Terminal failed."}\r\n`,
          );
        }
      });
    },
    [projectId, updateSession, writeToTerminal],
  );

  const splitTerminal = React.useCallback(() => {
    const nextIndex = terminalIndex + 1;
    const nextSession = createTerminalSession(nextIndex, projectRoot);

    setTerminalIndex(nextIndex);
    openSession(nextSession);
  }, [openSession, projectRoot, terminalIndex]);

  React.useImperativeHandle(
    ref,
    () => ({
      splitTerminal,
    }),
    [splitTerminal],
  );

  React.useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onFullscreenChange?.(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, onFullscreenChange]);

  function closeTerminal(sessionId: string) {
    setSessions((currentSessions) => {
      if (currentSessions.length <= 1) {
        return currentSessions;
      }

      const nextSessions = currentSessions.filter(
        (session) => session.id !== sessionId,
      );

      void stopProjectTerminal(sessionId);
      terminalRefs.current.delete(sessionId);
      pendingOutput.current.delete(sessionId);

      if (activeSessionId === sessionId) {
        setActiveSessionId(nextSessions.at(-1)?.id);
      }

      return nextSessions;
    });
  }

  function handleTerminalReady(sessionId: string, terminal: TerminalHandle) {
    terminalRefs.current.set(sessionId, terminal);
    const queued = pendingOutput.current.get(sessionId) ?? [];

    for (const data of queued) {
      terminal.write(data);
    }

    pendingOutput.current.delete(sessionId);
  }

  function handleTerminalInput(sessionId: string, data: string) {
    void writeProjectTerminalInput({ sessionId, data });
  }

  function handleTerminalCommand(sessionId: string, data: string) {
    writeToTerminal(sessionId, data);
    void writeProjectTerminalInput({ sessionId, data });
  }

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
        isFullscreen && "fixed inset-0 z-50",
      )}
      data-testid="project-terminal-panel"
      data-terminal-count={sessions.length}
      data-fullscreen={isFullscreen ? "true" : "false"}
    >
      {isFullscreen ? (
        <div
          className="flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3"
          data-testid="project-terminal-fullscreen-header"
        >
          <TerminalSquareIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium">Terminal</h2>
          </div>
          <BadgeLikeCount count={sessions.length} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFullscreenChange?.(false)}
            data-testid="project-terminal-exit-fullscreen"
          >
            <Minimize2Icon />
            Exit
          </Button>
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 overflow-hidden",
          isFullscreen ? "p-2" : "px-2 pb-4 pt-2",
        )}
        data-testid="project-terminal-split-view"
      >
        {sessions.map((session, index) => (
          <TerminalPane
            key={session.id}
            session={session}
            index={index}
            total={sessions.length}
            isActive={activeSessionId === session.id}
            canClose={sessions.length > 1}
            onActivate={() => setActiveSessionId(session.id)}
            onClose={() => closeTerminal(session.id)}
            onReady={handleTerminalReady}
            onInput={handleTerminalInput}
            onCommand={handleTerminalCommand}
          />
        ))}
      </div>
    </section>
  );
});

function BadgeLikeCount({ count }: { count: number }) {
  return (
    <div
      className="hidden shrink-0 rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground sm:block"
      data-testid="project-terminal-fullscreen-count"
    >
      {count} {count === 1 ? "terminal" : "terminals"}
    </div>
  );
}
