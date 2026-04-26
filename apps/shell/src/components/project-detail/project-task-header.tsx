import * as React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  CpuIcon,
  DatabaseIcon,
  FolderIcon,
  GitBranchIcon,
  TagIcon,
  UserIcon,
} from "lucide-react";

import { Progress } from "@repo/ui/components/progress";
import { PriorityBadge, StatusBadge } from "../status-badges";
import type { ProjectDetail } from "../../data/project-detail";

type ProjectTaskHeaderProps = {
  detail: ProjectDetail;
};

export function ProjectTaskHeader({ detail }: ProjectTaskHeaderProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { project } = detail;
  const contextPercent = Math.round(
    (detail.contextUsed / detail.contextLimit) * 100,
  );

  return (
    <section className="shrink-0 border-b bg-[var(--surface)]">
      <div>
        <button
          type="button"
          className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 px-3 text-left transition-colors hover:bg-muted/45 sm:px-4 lg:px-5"
          onClick={() => setIsExpanded((value) => !value)}
        >
          <span className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </span>
          <span className="shrink-0 text-sm font-medium">Task context</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            · {detail.activeTask}
          </span>
          <span className="hidden shrink-0 items-center gap-2 sm:flex">
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </span>
        </button>

        {isExpanded && (
          <div className="grid gap-x-5 gap-y-3 border-t px-3 py-3 text-xs sm:grid-cols-2 sm:px-4 md:grid-cols-4 lg:px-5">
            <TaskField icon={FolderIcon} label="Folder">
              <span className="font-mono">
                {project.folderPath ?? "No local folder linked"}
              </span>
            </TaskField>
            <TaskField icon={GitBranchIcon} label="Branch">
              <span className="font-mono">{detail.branch}</span>
            </TaskField>
            <TaskField icon={CpuIcon} label="Model">
              {detail.model}
            </TaskField>
            <TaskField icon={TagIcon} label="Mode">
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                {detail.mode}
              </span>
            </TaskField>
            <TaskField icon={UserIcon} label="Owner">
              {project.owner}
            </TaskField>
            <TaskField icon={ClockIcon} label="Updated">
              {new Date(project.updatedAt).toLocaleDateString()}
            </TaskField>
            <TaskField icon={DatabaseIcon} label="Context">
              <div className="flex min-w-0 items-center gap-2">
                <Progress value={contextPercent} className="h-1.5 w-20" />
                <span className="text-muted-foreground">{contextPercent}%</span>
              </div>
            </TaskField>
            <TaskField icon={FolderIcon} label="Workspace">
              {project.folderPath ? "Local folder linked" : "Folder required"}
            </TaskField>
          </div>
        )}
      </div>
    </section>
  );
}

function TaskField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="truncate text-foreground">{children}</div>
    </div>
  );
}
