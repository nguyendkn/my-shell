import {
  CheckCircle2Icon,
  CircleIcon,
  Loader2Icon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@repo/ui/lib/utils";
import type { ProjectDetail } from "../../data/project-detail";

const TIMELINE_ICON: Record<
  ProjectDetail["timeline"][number]["state"],
  LucideIcon
> = {
  done: CheckCircle2Icon,
  current: Loader2Icon,
  queued: CircleIcon,
};

export function ProjectTimelinePanel({ detail }: { detail: ProjectDetail }) {
  return (
    <ol className="space-y-0 p-3">
      {detail.timeline.map((item, index) => {
        const Icon = TIMELINE_ICON[item.state];

        return (
          <li key={item.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-5 items-center justify-center",
                  item.state === "done" && "text-emerald-600",
                  item.state === "current" && "text-primary",
                  item.state === "queued" && "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    item.state === "current" && "animate-spin",
                  )}
                />
              </span>
              {index < detail.timeline.length - 1 ? (
                <div className="my-1 w-px flex-1 bg-border" />
              ) : null}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 pb-4",
                item.state === "queued" && "text-muted-foreground",
              )}
            >
              <div className="truncate text-sm font-medium">{item.label}</div>
              <div className="text-[11px] text-muted-foreground">
                {item.time}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
