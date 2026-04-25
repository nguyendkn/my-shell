import * as React from "react";
import { Minimize2Icon, TerminalSquareIcon, XIcon } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Terminal } from "@repo/ui/components/terminal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";

type ProjectTerminalSession = {
  id: string;
  name: string;
  cwd: string;
};

export type ProjectTerminalPanelProps = {
  detail: ProjectDetail;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
};

export type ProjectTerminalPanelHandle = {
  splitTerminal: () => void;
};

function getProjectRoot(detail: ProjectDetail) {
  return (
    detail.project.folderPath ??
    `projects/${String(detail.project.id).padStart(3, "0")}`
  );
}

function createTerminalSession(
  index: number,
  detail: ProjectDetail,
): ProjectTerminalSession {
  return {
    id: `project-${detail.project.id}-terminal-${index}`,
    name: `PowerShell ${index}`,
    cwd: getProjectRoot(detail),
  };
}

function TerminalPane({
  session,
  index,
  total,
  isActive,
  canClose,
  onActivate,
  onClose,
}: {
  session: ProjectTerminalSession;
  index: number;
  total: number;
  isActive: boolean;
  canClose: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  const didWriteBootMessage = React.useRef(false);

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
      <div className="min-h-0 flex-1 overflow-hidden bg-zinc-950 p-2">
        <Terminal
          rows={24}
          theme="monokai"
          className="h-full min-h-0 overflow-hidden rounded-md border-zinc-800"
          data-testid="project-terminal"
          aria-label={`${session.name} terminal ${index + 1} of ${total}`}
          onReady={(terminal) => {
            if (didWriteBootMessage.current) {
              return;
            }

            didWriteBootMessage.current = true;
            terminal.write(
              `FPTClaw terminal ${index + 1}\r\ncwd: ${session.cwd}\r\n> `,
            );
          }}
        />
      </div>
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
  const [terminalIndex, setTerminalIndex] = React.useState(1);
  const [sessions, setSessions] = React.useState<ProjectTerminalSession[]>(
    () => [createTerminalSession(1, detail)],
  );
  const [activeSessionId, setActiveSessionId] = React.useState(sessions[0]?.id);

  React.useEffect(() => {
    const firstSession = createTerminalSession(1, detail);

    setTerminalIndex(1);
    setSessions([firstSession]);
    setActiveSessionId(firstSession.id);
  }, [detail]);

  const splitTerminal = React.useCallback(() => {
    const nextIndex = terminalIndex + 1;
    const nextSession = createTerminalSession(nextIndex, detail);

    setTerminalIndex(nextIndex);
    setSessions((currentSessions) => [...currentSessions, nextSession]);
    setActiveSessionId(nextSession.id);
  }, [detail, terminalIndex]);

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

      if (activeSessionId === sessionId) {
        setActiveSessionId(nextSessions.at(-1)?.id);
      }

      return nextSessions;
    });
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
