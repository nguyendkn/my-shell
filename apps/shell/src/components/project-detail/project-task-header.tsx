import * as React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  FolderIcon,
  GitBranchIcon,
  HistoryIcon,
  RotateCcwIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";

type ProjectTaskHeaderProps = {
  detail: ProjectDetail;
};

function getEnvironmentClass(environment: ProjectDetail["environment"]) {
  if (environment === "Production") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (environment === "Staging") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function ProjectTaskHeader({ detail }: ProjectTaskHeaderProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { project } = detail;
  const contextPercent = Math.round(
    (detail.contextUsed / detail.contextLimit) * 100,
  );

  return (
    <section className="shrink-0 border-b bg-background px-3 py-2 sm:px-4 sm:py-3 lg:px-5">
      <div
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-xs",
          isExpanded ? "p-3" : "px-3 py-2",
        )}
      >
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-3 text-left"
          onClick={() => setIsExpanded((value) => !value)}
        >
          <span className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {detail.activeTask}
            </span>
            {!isExpanded && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {project.owner} · {detail.model} · {detail.mode}
              </span>
            )}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "max-w-24 shrink-0",
              getEnvironmentClass(detail.environment),
            )}
          >
            {detail.environment}
          </Badge>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            <p className="line-clamp-2 text-sm text-muted-foreground sm:line-clamp-none">
              {project.description}
            </p>
            {project.folderPath && (
              <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                <FolderIcon className="size-3.5 shrink-0" />
                <span className="truncate">{project.folderPath}</span>
              </div>
            )}
            <div className="grid gap-2 text-sm md:grid-cols-3">
              <div className="rounded-md border bg-background p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">Context</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="font-medium">
                    {detail.contextUsed}/{detail.contextLimit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {contextPercent}% context
                  </span>
                </div>
                <Progress className="mt-2 h-1.5" value={contextPercent} />
              </div>
              <div className="rounded-md border bg-background p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">Model</div>
                <div className="mt-1 truncate font-medium">{detail.model}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {detail.mode} mode
                </div>
              </div>
              <div className="rounded-md border bg-background p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">Branch</div>
                <div className="mt-1 flex min-w-0 items-center gap-1 font-medium">
                  <GitBranchIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{detail.branch}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Updated {project.updatedAt}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={project.status === "Active" ? "default" : "outline"}
                >
                  {project.status}
                </Badge>
                <Badge variant="outline">{project.priority}</Badge>
                <span className="text-xs text-muted-foreground">
                  {project.documents} docs · {project.tasks} tasks
                </span>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <CopyIcon />
                      <span className="sr-only">Copy task</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy task</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <HistoryIcon />
                      <span className="sr-only">Open history</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open history</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <RotateCcwIcon />
                      <span className="sr-only">Restore checkpoint</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Restore checkpoint</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
