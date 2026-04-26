import { NetworkIcon, UserIcon } from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Separator } from "@repo/ui/components/separator";
import type { ProjectDetail } from "../../data/project-detail";

export function ProjectContextPanel({ detail }: { detail: ProjectDetail }) {
  const { project } = detail;

  return (
    <div className="space-y-4 p-3">
      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Resources
        </h3>
        <ul className="divide-y rounded-md border bg-background">
          {detail.resources.map((resource) => (
            <li
              key={resource.name}
              className="flex min-w-0 items-center gap-2 px-2.5 py-2 text-xs"
            >
              <NetworkIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{resource.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {resource.type} · {resource.updatedAt}
                </div>
              </div>
              <Badge variant="outline">{resource.type}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Collaborators
        </h3>
        <div className="flex min-w-0 items-center gap-2 rounded-md border bg-background px-2.5 py-2 text-xs">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)]">
            <UserIcon className="size-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{project.owner}</div>
            <div className="text-[11px] text-muted-foreground">
              Lead reviewer
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Runtime Context
        </h3>
        <div className="grid gap-2 text-xs">
          <ContextRow label="Environment" value={detail.environment} />
          <ContextRow label="Mode" value={detail.mode} />
          <ContextRow label="Model" value={detail.model} />
          <ContextRow label="Branch" value={detail.branch} isMono />
        </div>
      </section>
    </div>
  );
}

function ContextRow({
  label,
  value,
  isMono = false,
}: {
  label: string;
  value: string;
  isMono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border bg-background px-2.5 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          isMono
            ? "min-w-0 truncate text-right font-mono"
            : "min-w-0 truncate text-right font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
