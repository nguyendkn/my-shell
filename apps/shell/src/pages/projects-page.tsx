import * as React from "react";
import { ArrowUpRightIcon, FileTextIcon, ListTodoIcon } from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { projects, type Project } from "../data/projects";

const PAGE_SIZE = 40;
const ROW_HEIGHT = 116;
const OVERSCAN = 6;
const LOAD_AHEAD_PX = ROW_HEIGHT * 8;

function getPriorityClass(priority: Project["priority"]) {
  if (priority === "High") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getStatusVariant(status: Project["status"]) {
  return status === "Active" ? "default" : "outline";
}

function ProjectListItem({
  project,
  top,
}: {
  project: Project;
  top: number;
}) {
  return (
    <article
      role="listitem"
      className="absolute inset-x-0 rounded-xl border bg-card p-4 text-card-foreground shadow-xs transition-colors hover:bg-muted/40"
      style={{
        height: ROW_HEIGHT - 12,
        transform: `translateY(${top}px)`,
      }}
    >
      <div className="flex h-full min-w-0 items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {project.name}
            </h2>
            <Badge variant={getStatusVariant(project.status)}>
              {project.status}
            </Badge>
            <Badge variant="outline" className={getPriorityClass(project.priority)}>
              {project.priority}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
            {project.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Owner: {project.owner}</span>
            <span>Updated: {project.updatedAt}</span>
            <span className="inline-flex items-center gap-1">
              <FileTextIcon className="size-3.5" />
              {project.documents} docs
            </span>
            <span className="inline-flex items-center gap-1">
              <ListTodoIcon className="size-3.5" />
              {project.tasks} tasks
            </span>
          </div>
        </div>
        <div className="hidden w-40 shrink-0 flex-col gap-2 md:flex">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0">
          <ArrowUpRightIcon />
          <span className="sr-only">Open {project.name}</span>
        </Button>
      </div>
    </article>
  );
}

export function ProjectsPage() {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = React.useState(PAGE_SIZE);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(640);

  React.useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    setViewportHeight(scroller.clientHeight);
  }, []);

  const visibleProjects = projects.slice(0, loadedCount);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    visibleProjects.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const virtualProjects = visibleProjects.slice(startIndex, endIndex);
  const totalHeight = visibleProjects.length * ROW_HEIGHT;
  const hasMore = loadedCount < projects.length;

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;

    setScrollTop(scroller.scrollTop);
    setViewportHeight(scroller.clientHeight);

    if (
      hasMore &&
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
        LOAD_AHEAD_PX
    ) {
      setLoadedCount((count) => Math.min(count + PAGE_SIZE, projects.length));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Projects</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              All projects
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {visibleProjects.length.toLocaleString()} of{" "}
            {projects.length.toLocaleString()} projects
          </div>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Virtualized list rendering keeps the page responsive while infinite
          scroll loads more project rows as you approach the end.
        </p>
      </div>

      <div
        ref={scrollerRef}
        className="mx-4 min-h-0 flex-1 overflow-auto rounded-xl border bg-background p-3 lg:mx-6"
        onScroll={handleScroll}
      >
        <div
          aria-label="Projects"
          role="list"
          className="relative"
          style={{ height: totalHeight + (hasMore ? 72 : 44) }}
        >
          {virtualProjects.map((project, offset) => {
            const index = startIndex + offset;

            return (
              <ProjectListItem
                key={project.id}
                project={project}
                top={index * ROW_HEIGHT}
              />
            );
          })}
          <div
            className="absolute inset-x-0 flex h-11 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
            style={{ transform: `translateY(${totalHeight}px)` }}
          >
            {hasMore ? "Loading more projects..." : "End of project list"}
          </div>
        </div>
      </div>
    </div>
  );
}
