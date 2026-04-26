import type { ReactNode } from "react";

import { cn } from "@repo/ui/lib/utils";
import type { ProjectPriority, ProjectStatus } from "../data/projects";

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  Active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300",
  Discovery:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300",
  Review:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
  Paused:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300",
};

const PRIORITY_CLASSES: Record<ProjectPriority, string> = {
  High: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300",
  Medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300",
  Low: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-300",
};

function Chip({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <span className="dot bg-current" />
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <Chip className={cn(STATUS_CLASSES[status], className)}>{status}</Chip>
  );
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ProjectPriority;
  className?: string;
}) {
  return (
    <Chip className={cn(PRIORITY_CLASSES[priority], className)}>
      {priority}
    </Chip>
  );
}

export function HealthBadge({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const healthClass =
    value >= 80
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300"
      : value >= 50
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300"
        : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300";

  return (
    <Chip className={cn(healthClass, className)}>{Math.round(value)}%</Chip>
  );
}
