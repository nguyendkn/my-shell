import * as React from "react";
import {
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  FolderIcon,
  GitBranchIcon,
  ListTodoIcon,
  PanelRightCloseIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import { StatusBadge } from "../status-badges";
import type { ProjectDetail } from "../../data/project-detail";
import { ProjectContextPanel } from "./project-context-panel";
import { ProjectTimelinePanel } from "./project-timeline-panel";

const ProjectGitPanel = React.lazy(() =>
  import("./project-git-panel").then((module) => ({
    default: module.ProjectGitPanel,
  })),
);
const ProjectWikiPanel = React.lazy(() =>
  import("./project-wiki-panel").then((module) => ({
    default: module.ProjectWikiPanel,
  })),
);
const ProjectFilesPanel = React.lazy(() =>
  import("./project-files-panel").then((module) => ({
    default: module.ProjectFilesPanel,
  })),
);

export type ProjectSidePanelTab =
  | "wiki"
  | "files"
  | "context"
  | "timeline"
  | "git";

export const PROJECT_SIDE_PANEL_FEATURES: {
  value: ProjectSidePanelTab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: "wiki",
    label: "Wiki",
    Icon: BookOpenIcon,
  },
  {
    value: "files",
    label: "Files",
    Icon: FolderIcon,
  },
  {
    value: "context",
    label: "Context",
    Icon: UsersIcon,
  },
  {
    value: "timeline",
    label: "Timeline",
    Icon: ClockIcon,
  },
  {
    value: "git",
    label: "Git",
    Icon: GitBranchIcon,
  },
];

export function getProjectSidePanelFeaturePreview(
  detail: ProjectDetail,
  feature: ProjectSidePanelTab,
) {
  switch (feature) {
    case "wiki":
      return {
        description:
          "Source-backed project knowledge, pages, and health checks.",
        metrics: [
          { label: "Pages", value: detail.wiki.pageCount },
          { label: "Review", value: detail.wiki.reviewQueue },
          { label: "Cited", value: `${detail.wiki.citationCoverage}%` },
        ],
      };
    case "files":
      return {
        description: "Raw sources, wiki files, schemas, and agent visibility.",
        metrics: [
          { label: "Files", value: detail.files.files.length },
          { label: "Inbox", value: detail.files.inboxCount },
          { label: "Used", value: detail.files.storageUsed },
        ],
      };
    case "context":
      return {
        description:
          "Resources, collaborator ownership, and workspace context.",
        metrics: [
          { label: "Resources", value: detail.resources.length },
          { label: "Owner", value: detail.project.owner },
          { label: "Env", value: detail.environment },
        ],
      };
    case "timeline": {
      const current = detail.timeline.find((item) => item.state === "current");

      return {
        description: current?.label ?? "Project milestones and queued work.",
        metrics: [
          {
            label: "Done",
            value: detail.timeline.filter((item) => item.state === "done")
              .length,
          },
          {
            label: "Current",
            value: current?.time ?? "Now",
          },
          {
            label: "Queued",
            value: detail.timeline.filter((item) => item.state === "queued")
              .length,
          },
        ],
      };
    }
    case "git":
      return {
        description: "Working branch, changed files, and commit handoff.",
        metrics: [
          { label: "Changes", value: detail.git.changes.length },
          { label: "Ahead", value: detail.git.ahead },
          { label: "Behind", value: detail.git.behind },
        ],
      };
  }
}

type ProjectSidePanelProps = {
  detail: ProjectDetail;
  activeTab: ProjectSidePanelTab;
  onActiveTabChange: (tab: ProjectSidePanelTab) => void;
  onClose: () => void;
  mode?: "desktop" | "sheet";
};

export function ProjectSidePanel({
  detail,
  activeTab,
  onActiveTabChange,
  onClose,
  mode = "desktop",
}: ProjectSidePanelProps) {
  const { project } = detail;

  return (
    <aside
      className={cn(
        mode === "desktop"
          ? "hidden min-h-0 w-96 shrink-0 border-l bg-background xl:flex xl:flex-col"
          : "flex h-full min-h-0 w-full flex-col bg-background",
      )}
      data-testid="project-side-panel"
    >
      <div className="shrink-0 border-b bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{project.name}</h2>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Owner: {project.owner}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <StatusBadge status={project.status} />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              data-testid="project-side-panel-close"
            >
              <PanelRightCloseIcon />
              <span className="sr-only">Close project sidebar</span>
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-background/70 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileTextIcon className="size-3.5" />
              Documents
            </div>
            <div className="mt-1 text-lg font-semibold">
              {project.documents}
            </div>
          </div>
          <div className="rounded-md border bg-background/70 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ListTodoIcon className="size-3.5" />
              Tasks
            </div>
            <div className="mt-1 text-lg font-semibold">{project.tasks}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          onActiveTabChange(value as ProjectSidePanelTab)
        }
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 border-b px-4 py-3">
          <TabsList variant="line" className="w-full justify-start text-xs">
            {PROJECT_SIDE_PANEL_FEATURES.map((feature) => (
              <TabsTrigger
                key={feature.value}
                value={feature.value}
                className="text-xs"
              >
                <feature.Icon />
                {feature.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="wiki" className="min-h-0 overflow-auto">
          <React.Suspense
            fallback={
              <div className="p-4 text-sm text-muted-foreground">
                Loading wiki...
              </div>
            }
          >
            <ProjectWikiPanel detail={detail} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="files" className="min-h-0 overflow-auto">
          <React.Suspense
            fallback={
              <div className="p-4 text-sm text-muted-foreground">
                Loading files...
              </div>
            }
          >
            <ProjectFilesPanel detail={detail} />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="context" className="min-h-0 overflow-auto">
          <ProjectContextPanel detail={detail} />
        </TabsContent>

        <TabsContent value="timeline" className="min-h-0 overflow-auto">
          <ProjectTimelinePanel detail={detail} />
        </TabsContent>

        <TabsContent value="git" className="min-h-0 overflow-auto">
          <React.Suspense
            fallback={
              <div className="p-4 text-sm text-muted-foreground">
                Loading git changes...
              </div>
            }
          >
            <ProjectGitPanel detail={detail} />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
