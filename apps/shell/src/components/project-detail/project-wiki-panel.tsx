import * as React from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ClockIcon,
  DatabaseIcon,
  FileTextIcon,
  LinkIcon,
  SearchIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import { Separator } from "@repo/ui/components/separator";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/utils";
import type {
  ProjectDetail,
  ProjectWikiHealthItem,
  ProjectWikiLayer,
  ProjectWikiOperation,
  ProjectWikiPage,
} from "../../data/project-detail";

type ProjectWikiPanelProps = {
  detail: ProjectDetail;
};

function LayerIcon({ layer }: { layer: ProjectWikiLayer }) {
  if (layer.state === "immutable") {
    return <DatabaseIcon className="size-4" />;
  }

  if (layer.state === "governed") {
    return <Settings2Icon className="size-4" />;
  }

  return <BookOpenIcon className="size-4" />;
}

function OperationIcon({ operation }: { operation: ProjectWikiOperation }) {
  if (operation.id.includes("ingest")) {
    return <SparklesIcon className="size-3.5" />;
  }

  if (operation.id.includes("query")) {
    return <SearchIcon className="size-3.5" />;
  }

  if (operation.id.includes("lint")) {
    return <ActivityIcon className="size-3.5" />;
  }

  return <FileTextIcon className="size-3.5" />;
}

function getStatusClass(status: ProjectWikiPage["status"]) {
  if (status === "current") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "needs-review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "stale") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function getHealthClass(severity: ProjectWikiHealthItem["severity"]) {
  if (severity === "good") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (severity === "danger") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function HealthIcon({ item }: { item: ProjectWikiHealthItem }) {
  if (item.severity === "good") {
    return <CheckCircle2Icon className="size-3.5" />;
  }

  if (item.severity === "danger") {
    return <AlertTriangleIcon className="size-3.5" />;
  }

  return <ClockIcon className="size-3.5" />;
}

export function ProjectWikiPanel({ detail }: ProjectWikiPanelProps) {
  const [isReviewGateOn, setIsReviewGateOn] = React.useState(true);
  const { wiki } = detail;

  React.useEffect(() => {
    setIsReviewGateOn(true);
  }, [detail.project.id]);

  return (
    <div
      className="flex min-h-0 flex-col gap-4 p-4"
      data-testid="project-wiki-panel"
    >
      <section className="rounded-md border bg-card p-3 text-card-foreground">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <BookOpenIcon className="size-4 text-muted-foreground" />
              <span className="truncate">Project wiki</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {wiki.sourceCount} sources · {wiki.pageCount} pages ·{" "}
              {wiki.reviewQueue} review items
            </p>
          </div>
          <Badge variant="outline">{wiki.citationCoverage}% cited</Badge>
        </div>
        <Progress className="mt-3 h-1.5" value={wiki.citationCoverage} />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border bg-background p-2">
            <div className="text-muted-foreground">Raw sources</div>
            <div className="mt-1 text-base font-semibold">
              {wiki.sourceCount}
            </div>
          </div>
          <div className="rounded-md border bg-background p-2">
            <div className="text-muted-foreground">Wiki pages</div>
            <div className="mt-1 text-base font-semibold">{wiki.pageCount}</div>
          </div>
        </div>
      </section>

      <section className="rounded-md border p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xs font-medium uppercase text-muted-foreground">
              Review gate
            </h3>
            <p className="mt-1 truncate text-sm font-medium">
              Human approval before wiki writes
            </p>
          </div>
          <Switch
            checked={isReviewGateOn}
            onCheckedChange={setIsReviewGateOn}
          />
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase text-muted-foreground">
          Layers
        </h3>
        <div className="mt-2 space-y-2">
          {wiki.layers.map((layer) => (
            <div key={layer.id} className="rounded-md border p-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <LayerIcon layer={layer} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{layer.name}</p>
                    <Badge variant="outline">{layer.itemCount}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {layer.role}
                  </p>
                  <code className="mt-2 block truncate rounded-sm bg-muted px-1.5 py-1 text-[0.7rem] text-muted-foreground">
                    {layer.directory}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-medium uppercase text-muted-foreground">
            Operations
          </h3>
          <Button type="button" variant="outline" size="xs">
            <ActivityIcon />
            Run lint
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {wiki.operations.map((operation) => (
            <button
              key={operation.id}
              type="button"
              className="rounded-md border p-2 text-left transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  <OperationIcon operation={operation} />
                  <span className="truncate">{operation.label}</span>
                </span>
                <span
                  className={cn(
                    "size-2 rounded-full",
                    operation.status === "ready" && "bg-emerald-500",
                    operation.status === "running" && "bg-sky-500",
                    operation.status === "queued" && "bg-amber-500",
                  )}
                />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {operation.target}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {operation.lastRun}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase text-muted-foreground">
          Wiki pages
        </h3>
        <div className="mt-2 space-y-2">
          {wiki.pages.map((page) => (
            <article key={page.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{page.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {page.path}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusClass(page.status)}
                >
                  {page.status}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {page.summary}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{page.type}</Badge>
                <Badge variant="secondary">{page.subtype}</Badge>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <LinkIcon className="size-3" />
                  {page.backlinks}
                </span>
                <span className="text-xs text-muted-foreground">
                  {page.citations} citations
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-xs font-medium uppercase text-muted-foreground">
          Index and log
        </h3>
        <div className="mt-2 space-y-2">
          {wiki.specialFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {file.name === "AGENTS.md" ? (
                  <ShieldCheckIcon className="size-4" />
                ) : (
                  <FileTextIcon className="size-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {file.updatedAt}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {file.purpose}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-medium uppercase text-muted-foreground">
          Health
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {wiki.health.map((item) => (
            <div key={item.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-md border",
                    getHealthClass(item.severity),
                  )}
                >
                  <HealthIcon item={item} />
                </span>
                <Badge variant="outline">{item.action}</Badge>
              </div>
              <p className="mt-2 text-lg font-semibold">{item.count}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
