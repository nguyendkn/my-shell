import * as React from "react";
import {
  ArrowUpRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  ListTodoIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@repo/ui/components/native-select";
import { projects as sampleProjects, type Project } from "../data/projects";
import { selectProjectFolder } from "../lib/native-projects";

const PAGE_SIZE = 40;
const ROW_HEIGHT_DESKTOP = 116;
const ROW_HEIGHT_COMPACT = 150;
const OVERSCAN = 6;
const LOAD_MORE_THRESHOLD = 0.75;
const PROJECT_STATUSES: Array<Project["status"] | "All"> = [
  "All",
  "Discovery",
  "Active",
  "Review",
  "Paused",
];
const PROJECT_PRIORITIES: Array<Project["priority"] | "All"> = [
  "All",
  "High",
  "Medium",
  "Low",
];

type ProjectSortKey = "updated" | "progress" | "name";

export type CreateProjectInput = {
  name: string;
  folderPath: string;
};

function getProjectNameFromPath(folderPath: string) {
  const normalizedPath = folderPath.trim().replace(/[\\/]+$/, "");
  const pathParts = normalizedPath.split(/[\\/]/).filter(Boolean);

  return pathParts.at(-1) ?? "";
}

function getPriorityClass(priority: Project["priority"]) {
  if (priority === "High") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400";
  }

  if (priority === "Medium") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400";
}

function getStatusVariant(status: Project["status"]) {
  return status === "Active" ? "default" : "outline";
}

function shouldLoadMore(scroller: HTMLDivElement) {
  const scrollHeight = scroller.scrollHeight;
  const scrollBottom = scroller.scrollTop + scroller.clientHeight;

  if (scrollHeight <= scroller.clientHeight) {
    return false;
  }

  return scrollBottom / scrollHeight >= LOAD_MORE_THRESHOLD;
}

function getProjectSearchText(project: Project) {
  return [
    project.name,
    project.description,
    project.owner,
    project.folderPath,
    project.status,
    project.priority,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function ProjectListItem({
  project,
  rowHeight,
  top,
  onOpen,
}: {
  project: Project;
  rowHeight: number;
  top: number;
  onOpen?: (project: Project) => void;
}) {
  function openProject() {
    onOpen?.(project);
  }

  return (
    <article
      role="listitem"
      data-testid="project-row"
      tabIndex={0}
      aria-label={`Open ${project.name}`}
      className="absolute inset-x-0 cursor-pointer overflow-hidden rounded-lg border bg-card p-3 text-card-foreground shadow-xs transition-colors duration-150 hover:bg-muted/50 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:rounded-xl sm:p-4"
      style={{
        height: rowHeight - 12,
        transform: `translateY(${top}px)`,
      }}
      onClick={openProject}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProject();
        }
      }}
    >
      <div className="flex h-full min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="w-full truncate text-sm font-semibold sm:w-auto sm:text-base">
              {project.name}
            </h2>
            <Badge variant={getStatusVariant(project.status)}>
              {project.status}
            </Badge>
            <Badge
              variant="outline"
              className={getPriorityClass(project.priority)}
            >
              {project.priority}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
            {project.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:mt-3 sm:gap-x-4">
            {project.folderPath ? (
              <span className="inline-flex min-w-0 max-w-72 items-center gap-1 max-sm:hidden">
                <FolderIcon className="size-3.5 shrink-0" />
                <span className="truncate">{project.folderPath}</span>
              </span>
            ) : (
              <span>Owner: {project.owner}</span>
            )}
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
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={(event) => {
            event.stopPropagation();
            openProject();
          }}
        >
          <ArrowUpRightIcon />
          <span className="sr-only">Open {project.name}</span>
        </Button>
      </div>
    </article>
  );
}

function ProjectCreateDialog({
  recentProjects,
  onCreateProject,
}: {
  recentProjects: Project[];
  onCreateProject?: (input: CreateProjectInput) => void;
}) {
  const pathInputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSelectingFolder, setIsSelectingFolder] = React.useState(false);
  const [isNameDirty, setIsNameDirty] = React.useState(false);
  const [name, setName] = React.useState("");
  const [folderPath, setFolderPath] = React.useState("");
  const trimmedFolderPath = folderPath.trim();
  const trimmedName = name.trim();
  const canCreate = trimmedFolderPath.length > 0;
  const recentFolders = React.useMemo(() => {
    const paths = new Set<string>();

    recentProjects.forEach((project) => {
      if (project.folderPath) {
        paths.add(project.folderPath);
      }
    });

    return Array.from(paths).slice(0, 4);
  }, [recentProjects]);

  function resetForm() {
    setName("");
    setFolderPath("");
    setIsNameDirty(false);
    setIsSelectingFolder(false);
  }

  function updateFolderPath(nextPath: string) {
    setFolderPath(nextPath);

    if (!isNameDirty) {
      setName(getProjectNameFromPath(nextPath));
    }
  }

  async function handleBrowseFolder() {
    setIsSelectingFolder(true);

    try {
      const selectedPath = await selectProjectFolder(trimmedFolderPath);

      if (selectedPath) {
        updateFolderPath(selectedPath);
      } else {
        pathInputRef.current?.focus();
      }
    } catch {
      pathInputRef.current?.focus();
    } finally {
      setIsSelectingFolder(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCreate) {
      pathInputRef.current?.focus();
      return;
    }

    onCreateProject?.({
      name:
        trimmedName ||
        getProjectNameFromPath(trimmedFolderPath) ||
        "Untitled Project",
      folderPath: trimmedFolderPath,
    });
    setIsOpen(false);
    resetForm();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen);

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button data-testid="project-create-open">
          <FolderPlusIcon />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription className="sr-only">
            Select a local folder path for the new project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderOpenIcon className="size-4 text-muted-foreground" />
                Open folder
              </div>
              <div className="mt-3 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="project-create-folder">Folder path</Label>
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Input
                      ref={pathInputRef}
                      id="project-create-folder"
                      value={folderPath}
                      placeholder="D:\Projects\MyProject"
                      onChange={(event) => updateFolderPath(event.target.value)}
                      data-testid="project-create-path"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:w-auto"
                      onClick={handleBrowseFolder}
                      disabled={isSelectingFolder}
                      data-testid="project-create-browse"
                    >
                      {isSelectingFolder ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <FolderOpenIcon />
                      )}
                      Browse
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-create-name">Name</Label>
                  <Input
                    id="project-create-name"
                    value={name}
                    placeholder="MyProject"
                    onChange={(event) => {
                      setIsNameDirty(true);
                      setName(event.target.value);
                    }}
                    data-testid="project-create-name"
                  />
                </div>
              </div>
            </div>

            {recentFolders.length > 0 && (
              <div className="grid gap-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Recent folders
                </div>
                <div className="grid gap-1">
                  {recentFolders.map((path) => (
                    <Button
                      key={path}
                      type="button"
                      variant="ghost"
                      className="h-auto justify-start px-2 py-1.5 text-left"
                      onClick={() => updateFolderPath(path)}
                    >
                      <FolderIcon className="size-3.5" />
                      <span className="min-w-0 truncate text-xs">{path}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canCreate}
              data-testid="project-create-submit"
            >
              <ArrowUpRightIcon />
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProjectsPageProps = {
  projects?: Project[];
  onNavigate?: (path: string) => void;
  onCreateProject?: (input: CreateProjectInput) => void;
};

export function ProjectsPage({
  projects = sampleProjects,
  onNavigate,
  onCreateProject,
}: ProjectsPageProps) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [loadedCount, setLoadedCount] = React.useState(PAGE_SIZE);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(640);
  const [viewportWidth, setViewportWidth] = React.useState(768);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] =
    React.useState<Project["status"] | "All">("All");
  const [priorityFilter, setPriorityFilter] =
    React.useState<Project["priority"] | "All">("All");
  const [sortKey, setSortKey] = React.useState<ProjectSortKey>("updated");
  const filteredProjects = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesQuery =
          !normalizedQuery ||
          getProjectSearchText(project).includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "All" || project.status === statusFilter;
        const matchesPriority =
          priorityFilter === "All" || project.priority === priorityFilter;

        return matchesQuery && matchesStatus && matchesPriority;
      })
      .sort((firstProject, secondProject) => {
        if (sortKey === "name") {
          return firstProject.name.localeCompare(secondProject.name);
        }

        if (sortKey === "progress") {
          return secondProject.progress - firstProject.progress;
        }

        return secondProject.updatedAt.localeCompare(firstProject.updatedAt);
      });
  }, [priorityFilter, projects, query, sortKey, statusFilter]);

  const loadMoreProjects = React.useCallback(() => {
    setLoadedCount((count) =>
      Math.min(count + PAGE_SIZE, filteredProjects.length),
    );
  }, [filteredProjects.length]);

  React.useEffect(() => {
    setLoadedCount((count) =>
      Math.min(
        Math.max(count, Math.min(PAGE_SIZE, filteredProjects.length)),
        filteredProjects.length,
      ),
    );
  }, [filteredProjects.length]);

  React.useEffect(() => {
    setScrollTop(0);
    setLoadedCount(Math.min(PAGE_SIZE, filteredProjects.length));

    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = 0;
    }
  }, [filteredProjects.length, priorityFilter, query, sortKey, statusFilter]);

  React.useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const updateViewport = () => {
      setViewportHeight(scroller.clientHeight);
      setViewportWidth(scroller.clientWidth);
    };

    updateViewport();

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(scroller);

    return () => resizeObserver.disconnect();
  }, []);

  const rowHeight =
    viewportWidth < 640 ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_DESKTOP;
  const hasMore = loadedCount < filteredProjects.length;
  const visibleProjects = filteredProjects.slice(0, loadedCount);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const endIndex = Math.min(
    visibleProjects.length,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + OVERSCAN,
  );
  const virtualProjects = visibleProjects.slice(startIndex, endIndex);
  const totalHeight = visibleProjects.length * rowHeight;

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;

    setScrollTop(scroller.scrollTop);
    setViewportHeight(scroller.clientHeight);
    setViewportWidth(scroller.clientWidth);

    if (hasMore && shouldLoadMore(scroller)) {
      loadMoreProjects();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden py-3 md:gap-6 md:py-6">
      <div className="mx-4 flex shrink-0 flex-col gap-3 lg:mx-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium">Projects</div>
            <div className="text-xs text-muted-foreground">
              {filteredProjects.length.toLocaleString()} of{" "}
              {projects.length.toLocaleString()} workspaces
            </div>
          </div>
          <ProjectCreateDialog
            recentProjects={projects}
            onCreateProject={onCreateProject}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative min-w-0">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search projects, owners, folders..."
              className="pl-8"
              data-testid="projects-search"
            />
          </div>
          <NativeSelect
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as Project["status"] | "All")
            }
            size="sm"
            className="w-full sm:w-32"
            aria-label="Filter by status"
            data-testid="projects-status-filter"
          >
            {PROJECT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value as Project["priority"] | "All",
              )
            }
            size="sm"
            className="w-full sm:w-32"
            aria-label="Filter by priority"
            data-testid="projects-priority-filter"
          >
            {PROJECT_PRIORITIES.map((priority) => (
              <NativeSelectOption key={priority} value={priority}>
                {priority === "All" ? "All priorities" : priority}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            value={sortKey}
            onChange={(event) =>
              setSortKey(event.target.value as ProjectSortKey)
            }
            size="sm"
            className="w-full sm:w-36"
            aria-label="Sort projects"
            data-testid="projects-sort"
          >
            <NativeSelectOption value="updated">Updated</NativeSelectOption>
            <NativeSelectOption value="progress">Progress</NativeSelectOption>
            <NativeSelectOption value="name">Name</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
      <div
        ref={scrollerRef}
        data-testid="projects-scroller"
        className="mx-4 h-0 min-h-0 flex-1 overflow-auto rounded-lg border bg-background p-2 sm:rounded-xl sm:p-3 lg:mx-6"
        onScroll={handleScroll}
      >
        <div
          aria-label="Projects"
          role="list"
          data-testid="projects-list"
          data-loaded-count={visibleProjects.length}
          data-rendered-count={virtualProjects.length}
          className="relative"
          style={{
            height:
              filteredProjects.length === 0
                ? 176
                : totalHeight + (hasMore ? 72 : 44),
          }}
        >
          {filteredProjects.length === 0 ? (
            <div className="flex h-44 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
              No projects match the current filters. Try adjusting your search or filters.
            </div>
          ) : (
            virtualProjects.map((project, offset) => {
              const index = startIndex + offset;

              return (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  rowHeight={rowHeight}
                  top={index * rowHeight}
                  onOpen={(project) => onNavigate?.(`/projects/${project.id}`)}
                />
              );
            })
          )}
          {filteredProjects.length > 0 && (
            <div
              className="absolute inset-x-0 flex h-11 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
              style={{ transform: `translateY(${totalHeight}px)` }}
            >
              {hasMore ? "Loading more projects..." : "End of project list"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
