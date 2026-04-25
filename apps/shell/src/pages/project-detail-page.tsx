import * as React from "react";
import {
  ArrowLeftIcon,
  BotIcon,
  FingerprintIcon,
  Maximize2Icon,
  PlusIcon,
  SplitSquareHorizontalIcon,
  TerminalSquareIcon,
} from "lucide-react";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { Sheet, SheetContent } from "@repo/ui/components/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/tooltip";
import {
  getProjectSidePanelFeaturePreview,
  PROJECT_SIDE_PANEL_FEATURES,
  ProjectSidePanel,
  type ProjectSidePanelTab,
} from "../components/project-detail/project-side-panel";
import { getProjectDetail } from "../data/project-detail";
import type { ProjectDetail } from "../data/project-detail";
import type { Project } from "../data/projects";
import type {
  ProjectTerminalPanelHandle,
  ProjectTerminalPanelProps,
} from "../components/project-detail/project-terminal-panel";
import type {
  ProjectBrowserProfilesPanelHandle,
  ProjectBrowserProfilesPanelProps,
} from "../components/project-detail/project-browser-profiles-panel";

type ProjectDetailPageProps = {
  projectId: number;
  projects: Project[];
  onBack: () => void;
  isSidePanelOpen: boolean;
  onSidePanelOpenChange: (open: boolean) => void;
};

type ProjectWorkspaceTab = "coding-agent" | "terminal" | "browser-profiles";
const PROJECT_SIDE_PANEL_SHEET_MEDIA = "(max-width: 1279px)";

const ProjectTerminalPanel = React.lazy(() =>
  import("../components/project-detail/project-terminal-panel").then(
    (module) => ({
      default: module.ProjectTerminalPanel,
    }),
  ),
) as React.LazyExoticComponent<
  React.ForwardRefExoticComponent<
    ProjectTerminalPanelProps & React.RefAttributes<ProjectTerminalPanelHandle>
  >
>;
const ProjectChatShell = React.lazy(() =>
  import("../components/project-detail/project-chat-shell").then((module) => ({
    default: module.ProjectChatShell,
  })),
);
const ProjectBrowserProfilesPanel = React.lazy(() =>
  import("../components/project-detail/project-browser-profiles-panel").then(
    (module) => ({
      default: module.ProjectBrowserProfilesPanel,
    }),
  ),
) as React.LazyExoticComponent<
  React.ForwardRefExoticComponent<
    ProjectBrowserProfilesPanelProps &
      React.RefAttributes<ProjectBrowserProfilesPanelHandle>
  >
>;

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(
    () => window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

function ProjectSidePanelRailItem({
  detail,
  feature,
  isActive,
  onOpen,
}: {
  detail: ProjectDetail;
  feature: (typeof PROJECT_SIDE_PANEL_FEATURES)[number];
  isActive: boolean;
  onOpen: (tab: ProjectSidePanelTab) => void;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const preview = getProjectSidePanelFeaturePreview(detail, feature.value);

  return (
    <Popover open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isActive ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label={`Open ${feature.label} panel`}
          data-testid={`project-side-panel-rail-${feature.value}`}
          onClick={() => {
            setIsPreviewOpen(false);
            onOpen(feature.value);
          }}
          onFocus={() => setIsPreviewOpen(true)}
          onBlur={() => setIsPreviewOpen(false)}
          onPointerEnter={() => setIsPreviewOpen(true)}
          onPointerLeave={() => setIsPreviewOpen(false)}
          onMouseEnter={() => setIsPreviewOpen(true)}
          onMouseLeave={() => setIsPreviewOpen(false)}
        >
          <feature.Icon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="center"
        className="w-64"
        data-testid={`project-side-panel-rail-popover-${feature.value}`}
        onPointerEnter={() => setIsPreviewOpen(true)}
        onPointerLeave={() => setIsPreviewOpen(false)}
        onMouseEnter={() => setIsPreviewOpen(true)}
        onMouseLeave={() => setIsPreviewOpen(false)}
      >
        <PopoverHeader>
          <PopoverTitle>{feature.label}</PopoverTitle>
          <PopoverDescription>{preview.description}</PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-1.5">
          {preview.metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-1.5 text-xs"
            >
              <span className="text-muted-foreground">{metric.label}</span>
              <Badge variant="outline" className="max-w-32 truncate">
                {metric.value}
              </Badge>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProjectSidePanelRail({
  activeTab,
  detail,
  onOpen,
}: {
  activeTab: ProjectSidePanelTab;
  detail: ProjectDetail;
  onOpen: (tab: ProjectSidePanelTab) => void;
}) {
  return (
    <aside
      className="hidden w-11 shrink-0 border-l bg-background xl:flex xl:flex-col xl:items-center xl:py-2"
      data-testid="project-side-panel-rail"
    >
      <div className="flex flex-col items-center gap-1">
        {PROJECT_SIDE_PANEL_FEATURES.map((feature) => (
          <ProjectSidePanelRailItem
            key={feature.value}
            detail={detail}
            feature={feature}
            isActive={activeTab === feature.value}
            onOpen={onOpen}
          />
        ))}
      </div>
    </aside>
  );
}

export function ProjectDetailPage({
  projectId,
  projects,
  onBack,
  isSidePanelOpen,
  onSidePanelOpenChange,
}: ProjectDetailPageProps) {
  const detail = React.useMemo(
    () => getProjectDetail(projectId, projects),
    [projectId, projects],
  );
  const [activeSidePanelTab, setActiveSidePanelTab] =
    React.useState<ProjectSidePanelTab>("wiki");
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    React.useState<ProjectWorkspaceTab>("coding-agent");
  const [isTerminalFullscreen, setIsTerminalFullscreen] =
    React.useState(false);
  const terminalPanelRef = React.useRef<ProjectTerminalPanelHandle>(null);
  const browserProfilesPanelRef =
    React.useRef<ProjectBrowserProfilesPanelHandle>(null);
  const usesSheetSidePanel = useMediaQuery(PROJECT_SIDE_PANEL_SHEET_MEDIA);

  React.useEffect(() => {
    setIsTerminalFullscreen(false);
  }, [projectId]);

  function handleWorkspaceTabChange(value: string) {
    const nextTab = value as ProjectWorkspaceTab;

    setActiveWorkspaceTab(nextTab);

    if (nextTab !== "terminal") {
      setIsTerminalFullscreen(false);
    }

    if (nextTab === "terminal" || nextTab === "browser-profiles") {
      onSidePanelOpenChange(false);
    }
  }

  function handleSplitTerminal() {
    terminalPanelRef.current?.splitTerminal();
  }

  function handleCreateBrowserProfile() {
    browserProfilesPanelRef.current?.createProfile();
  }

  if (!detail) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div>
          <h2 className="text-lg font-semibold">Project not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Project ID {projectId} is not available in this workspace.
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeftIcon />
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeWorkspaceTab}
          onValueChange={handleWorkspaceTabChange}
          className="min-h-0 min-w-0 flex-1 gap-0 overflow-hidden"
        >
          <div className="flex h-10 min-w-0 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 sm:px-4 lg:px-5">
            <TabsList variant="line" className="min-w-0 justify-start">
              <TabsTrigger
                value="coding-agent"
                className="min-w-0"
                data-testid="project-workspace-tab-coding-agent"
              >
                <BotIcon />
                <span className="hidden sm:inline">FPTClaw Agent</span>
                <span className="sm:hidden">Agent</span>
              </TabsTrigger>
              <TabsTrigger
                value="terminal"
                className="min-w-0"
                data-testid="project-workspace-tab-terminal"
              >
                <TerminalSquareIcon />
                Terminal
              </TabsTrigger>
              <TabsTrigger
                value="browser-profiles"
                className="min-w-0"
                data-testid="project-workspace-tab-browser-profiles"
              >
                <FingerprintIcon />
                <span className="hidden sm:inline">Browser Profiles</span>
                <span className="sm:hidden">Browsers</span>
              </TabsTrigger>
            </TabsList>
            {activeWorkspaceTab === "terminal" ? (
              <div
                className="ml-auto flex shrink-0 items-center gap-1"
                data-testid="project-terminal-toolbar"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTerminalFullscreen(true)}
                      data-testid="project-terminal-fullscreen"
                    >
                      <Maximize2Icon />
                      <span className="hidden sm:inline">Full screen</span>
                      <span className="sm:hidden">Full</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Focus terminal splits full screen</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSplitTerminal}
                      data-testid="project-terminal-split"
                    >
                      <SplitSquareHorizontalIcon />
                      Split
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Split terminal horizontally</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSplitTerminal}
                      data-testid="project-terminal-add"
                    >
                      <PlusIcon />
                      <span className="sr-only">New terminal</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New terminal</TooltipContent>
                </Tooltip>
              </div>
            ) : null}
            {activeWorkspaceTab === "browser-profiles" ? (
              <div
                className="ml-auto flex shrink-0 items-center gap-1"
                data-testid="project-browser-toolbar"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateBrowserProfile}
                      data-testid="project-browser-profile-create"
                    >
                      <PlusIcon />
                      New profile
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create Camoufox browser profile
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : null}
          </div>
          <TabsContent
            forceMount
            value="coding-agent"
            className="min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <React.Suspense
              fallback={
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
                  Loading coding agent...
                </div>
              }
            >
              <ProjectChatShell detail={detail} />
            </React.Suspense>
          </TabsContent>
          <TabsContent
            forceMount
            value="terminal"
            className="min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <React.Suspense
              fallback={
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
                  Loading terminal...
                </div>
              }
            >
              <ProjectTerminalPanel
                ref={terminalPanelRef}
                detail={detail}
                isFullscreen={isTerminalFullscreen}
                onFullscreenChange={setIsTerminalFullscreen}
              />
            </React.Suspense>
          </TabsContent>
          <TabsContent
            forceMount
            value="browser-profiles"
            className="min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <React.Suspense
              fallback={
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
                  Loading browser profiles...
                </div>
              }
            >
              <ProjectBrowserProfilesPanel
                ref={browserProfilesPanelRef}
                detail={detail}
              />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </main>
      {isSidePanelOpen && !usesSheetSidePanel ? (
        <ProjectSidePanel
          detail={detail}
          activeTab={activeSidePanelTab}
          onActiveTabChange={setActiveSidePanelTab}
          onClose={() => onSidePanelOpenChange(false)}
        />
      ) : null}
      {usesSheetSidePanel ? (
        <Sheet open={isSidePanelOpen} onOpenChange={onSidePanelOpenChange}>
          <SheetContent
            side="right"
            showCloseButton={false}
            className="w-[calc(100vw-1rem)] gap-0 p-0 sm:max-w-md"
            data-testid="project-side-panel-sheet"
          >
            <ProjectSidePanel
              mode="sheet"
              detail={detail}
              activeTab={activeSidePanelTab}
              onActiveTabChange={setActiveSidePanelTab}
              onClose={() => onSidePanelOpenChange(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}
      {!isSidePanelOpen && !usesSheetSidePanel ? (
        <ProjectSidePanelRail
          activeTab={activeSidePanelTab}
          detail={detail}
          onOpen={(tab) => {
            setActiveSidePanelTab(tab);
            onSidePanelOpenChange(true);
          }}
        />
      ) : null}
    </div>
  );
}
