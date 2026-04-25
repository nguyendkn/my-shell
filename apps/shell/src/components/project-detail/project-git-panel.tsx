import * as React from "react";
import {
  CheckIcon,
  FileDiffIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  MinusIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Separator } from "@repo/ui/components/separator";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type {
  ProjectDetail,
  ProjectGitChange,
} from "../../data/project-detail";

type ProjectGitPanelProps = {
  detail: ProjectDetail;
};

const ProjectCodeViewer = React.lazy(() =>
  import("./project-code-viewer").then((module) => ({
    default: module.ProjectCodeViewer,
  })),
);

function getStatusLabel(status: ProjectGitChange["status"]) {
  if (status === "added") {
    return "A";
  }

  if (status === "deleted") {
    return "D";
  }

  return "M";
}

function getStatusClass(status: ProjectGitChange["status"]) {
  if (status === "added") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "deleted") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function buildCommitMessage(detail: ProjectDetail) {
  const summaries = detail.git.changes
    .slice(0, 3)
    .map((change) => `- ${change.summary}`)
    .join("\n");

  return `Update ${detail.project.name} handoff\n\n${summaries}`;
}

export function ProjectGitPanel({ detail }: ProjectGitPanelProps) {
  const [selectedChangeId, setSelectedChangeId] = React.useState(
    detail.git.changes[0]?.id ?? "",
  );
  const [commitMessage, setCommitMessage] = React.useState(
    detail.git.commitMessage,
  );

  React.useEffect(() => {
    setSelectedChangeId(detail.git.changes[0]?.id ?? "");
    setCommitMessage(detail.git.commitMessage);
  }, [detail]);

  const selectedChange =
    detail.git.changes.find((change) => change.id === selectedChangeId) ??
    detail.git.changes[0];
  const totalAdditions = detail.git.changes.reduce(
    (total, change) => total + change.additions,
    0,
  );
  const totalDeletions = detail.git.changes.reduce(
    (total, change) => total + change.deletions,
    0,
  );

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4">
      <section className="rounded-md border bg-card p-3 text-card-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <GitBranchIcon className="size-4 text-muted-foreground" />
              <span className="truncate">{detail.branch}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Base {detail.git.baseBranch} · {detail.git.ahead} ahead ·{" "}
              {detail.git.behind} behind
            </p>
          </div>
          <Badge variant="outline">{detail.git.changes.length} changes</Badge>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <PlusIcon className="size-3" />
            {totalAdditions}
          </span>
          <span className="inline-flex items-center gap-1 text-rose-700">
            <MinusIcon className="size-3" />
            {totalDeletions}
          </span>
        </div>
      </section>

      <section className="min-h-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase text-muted-foreground">
            Git Changes
          </h3>
          <Button type="button" variant="outline" size="xs">
            <CheckIcon />
            Stage all
          </Button>
        </div>
        <div className="space-y-1.5">
          {detail.git.changes.map((change) => (
            <button
              key={change.id}
              type="button"
              className={cn(
                "flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors hover:bg-muted",
                selectedChange?.id === change.id && "border-ring bg-muted",
              )}
              onClick={() => setSelectedChangeId(change.id)}
              data-testid="project-git-change"
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border text-[0.65rem] font-semibold",
                  getStatusClass(change.status),
                )}
              >
                {getStatusLabel(change.status)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {change.path}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                  {change.summary}
                </span>
              </span>
              <span className="mt-0.5 shrink-0 text-xs tabular-nums">
                <span className="text-emerald-700">+{change.additions}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="text-rose-700">-{change.deletions}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {selectedChange && (
        <section className="min-h-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <FileDiffIcon className="size-3.5" />
              <span className="truncate">Diff Changes</span>
            </h3>
            <Badge variant="outline">
              {selectedChange.path.split(".").pop()}
            </Badge>
          </div>
          <div className="h-72 overflow-hidden rounded-md border">
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Loading diff viewer...
                </div>
              }
            >
              <ProjectCodeViewer
                filePath={selectedChange.path}
                value={selectedChange.diff}
              />
            </React.Suspense>
          </div>
        </section>
      )}

      <Separator />

      <section className="shrink-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <GitCommitHorizontalIcon className="size-3.5" />
            Commit Message
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() => setCommitMessage(buildCommitMessage(detail))}
                data-testid="project-git-ai-message"
              >
                <SparklesIcon />
                <span className="sr-only">Generate commit message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate commit message</TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          value={commitMessage}
          onChange={(event) => setCommitMessage(event.target.value)}
          className="min-h-24 resize-none text-sm"
          data-testid="project-git-commit-message"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm">
            Amend
          </Button>
          <Button type="button" size="sm">
            Commit
          </Button>
        </div>
      </section>
    </div>
  );
}
