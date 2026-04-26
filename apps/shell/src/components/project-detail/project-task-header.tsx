import * as React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";

type ProjectTaskHeaderProps = {
  detail: ProjectDetail;
};

export function ProjectTaskHeader({ detail }: ProjectTaskHeaderProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { project } = detail;

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
              {project.name}
            </span>
            {!isExpanded && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {project.folderPath ?? "No local folder linked"} · {detail.mode}
              </span>
            )}
          </span>
          <Badge variant={project.status === "Active" ? "default" : "outline"}>
            {project.status}
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
                <div className="text-xs text-muted-foreground">Workspace</div>
                <div className="mt-1 truncate font-medium">
                  {project.folderPath ? "Local folder linked" : "Folder required"}
                </div>
              </div>
              <div className="rounded-md border bg-background p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">Agent mode</div>
                <div className="mt-1 truncate font-medium">{detail.mode}</div>
              </div>
              <div className="rounded-md border bg-background p-2.5 sm:p-3">
                <div className="text-xs text-muted-foreground">Updated</div>
                <div className="mt-1 truncate font-medium">
                  {project.updatedAt}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {project.owner}
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
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
