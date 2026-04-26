import { ThemeProvider } from "next-themes";
import {
  ArrowLeftIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { SiteHeader } from "./components/site-header";
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import type { CreateProjectInput } from "./pages/projects-page";
import { projects as sampleProjects, type Project } from "./data/projects";

const DashboardPage = lazy(() => import("./pages/dashboard-page"));
const AppSidebar = lazy(() =>
  import("./components/app-sidebar").then((module) => ({
    default: module.AppSidebar,
  })),
);
const Toaster = lazy(() =>
  import("@repo/ui/components/sonner").then((module) => ({
    default: module.Toaster,
  })),
);
const ProjectsPage = lazy(() =>
  import("./pages/projects-page").then((module) => ({
    default: module.ProjectsPage,
  })),
);
const SettingsPage = lazy(() => import("./pages/settings-page"));
const ProjectDetailPage = lazy(() =>
  import("./pages/project-detail-page").then((module) => ({
    default: module.ProjectDetailPage,
  })),
);
const PROJECT_DETAIL_ROUTE = /^\/projects\/(\d+)$/;
const CUSTOM_PROJECTS_STORAGE_KEY = "fptclaw.custom-projects.v1";
const PROJECT_SIDE_PANEL_MEDIA = "(min-width: 1280px)";

function shouldOpenProjectSidePanelByDefault() {
  return window.matchMedia(PROJECT_SIDE_PANEL_MEDIA).matches;
}

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="p-4 text-sm text-muted-foreground lg:p-6">{label}</div>
  );
}

function getProjectNameFromPath(folderPath: string) {
  const normalizedPath = folderPath.trim().replace(/[\\/]+$/, "");
  const pathParts = normalizedPath.split(/[\\/]/).filter(Boolean);

  return pathParts.at(-1) ?? "Untitled Project";
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") {
    return false;
  }

  const project = value as Partial<Project>;

  return (
    typeof project.id === "number" &&
    typeof project.name === "string" &&
    typeof project.description === "string" &&
    typeof project.owner === "string" &&
    typeof project.folderPath === "string" &&
    typeof project.progress === "number" &&
    typeof project.documents === "number" &&
    typeof project.tasks === "number" &&
    typeof project.updatedAt === "string"
  );
}

function readCustomProjects() {
  try {
    const storedProjects = window.localStorage.getItem(
      CUSTOM_PROJECTS_STORAGE_KEY,
    );

    if (!storedProjects) {
      return [];
    }

    const parsedProjects: unknown = JSON.parse(storedProjects);

    if (!Array.isArray(parsedProjects)) {
      return [];
    }

    return parsedProjects.filter(isProject);
  } catch {
    return [];
  }
}

function createProjectFromFolder(
  input: CreateProjectInput,
  existingProjects: Project[],
): Project {
  const folderPath = input.folderPath.trim();
  const nextId =
    existingProjects.reduce(
      (maxId, project) => Math.max(maxId, project.id),
      0,
    ) + 1;
  const name = input.name.trim() || getProjectNameFromPath(folderPath);

  return {
    id: nextId,
    name,
    folderPath,
    description: "Local project workspace opened from a selected folder.",
    owner: "Local workspace",
    status: "Active",
    priority: "Medium",
    progress: 0,
    documents: 0,
    tasks: 0,
    updatedAt: formatLocalDate(new Date()),
  };
}

function getRoutePath() {
  if (window.location.pathname === "/") {
    return "/projects";
  }

  return window.location.pathname;
}

function useAppRoute() {
  const [currentPath, setCurrentPath] = useState(getRoutePath);

  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", "/projects");
    }

    const handlePopState = () => setCurrentPath(getRoutePath());

    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }

    setCurrentPath(path);
  }

  return { currentPath, navigate };
}

function getProjectIdFromPath(path: string) {
  const match = PROJECT_DETAIL_ROUTE.exec(path);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function App() {
  const { currentPath, navigate } = useAppRoute();
  const [customProjects, setCustomProjects] =
    useState<Project[]>(readCustomProjects);
  const projects = useMemo(
    () => [...customProjects, ...sampleProjects],
    [customProjects],
  );
  const projectId = getProjectIdFromPath(currentPath);
  const isProjectDetail = projectId !== null;
  const currentProject = isProjectDetail
    ? projects.find((project) => project.id === projectId)
    : undefined;
  const [isAppSidebarOpen, setIsAppSidebarOpen] = useState(!isProjectDetail);
  const [isProjectSidePanelOpen, setIsProjectSidePanelOpen] = useState(
    shouldOpenProjectSidePanelByDefault,
  );
  const headerTitle =
    currentPath === "/dashboard"
      ? "Dashboard"
      : currentPath === "/settings"
        ? "Settings"
        : isProjectDetail
          ? (currentProject?.name ?? "Project not found")
          : "Projects";
  const headerSubtitle =
    currentPath === "/dashboard"
      ? "Operational overview"
      : currentPath === "/settings"
        ? "Claude-compatible runtime settings"
        : isProjectDetail
          ? (currentProject?.folderPath ?? "Project workspace")
          : `${projects.length.toLocaleString()} workspaces`;

  useEffect(() => {
    setIsAppSidebarOpen(!isProjectDetail);
  }, [isProjectDetail]);

  useEffect(() => {
    if (isProjectDetail) {
      setIsProjectSidePanelOpen(shouldOpenProjectSidePanelByDefault());
    }
  }, [isProjectDetail, projectId]);

  useEffect(() => {
    window.localStorage.setItem(
      CUSTOM_PROJECTS_STORAGE_KEY,
      JSON.stringify(customProjects),
    );
  }, [customProjects]);

  function handleCreateProject(input: CreateProjectInput) {
    const project = createProjectFromFolder(input, projects);

    setCustomProjects((currentProjects) => [project, ...currentProjects]);
    navigate(`/projects/${project.id}`);
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <>
          <SidebarProvider
            open={isAppSidebarOpen}
            onOpenChange={setIsAppSidebarOpen}
            className="h-full min-h-0 overflow-hidden"
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as CSSProperties
            }
          >
            <Suspense fallback={null}>
              <AppSidebar
                currentPath={currentPath}
                variant="inset"
                onNavigate={navigate}
              />
            </Suspense>
            <SidebarInset
              className={
                isProjectDetail
                  ? "h-full min-h-0 overflow-hidden md:m-0! md:rounded-none! md:shadow-none!"
                  : "h-full min-h-0 overflow-hidden"
              }
            >
              <SiteHeader
                title={headerTitle}
                subtitle={headerSubtitle}
                leading={
                  isProjectDetail ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate("/projects")}
                      data-testid="project-detail-back"
                    >
                      <ArrowLeftIcon />
                      <span className="sr-only">Back to projects</span>
                    </Button>
                  ) : undefined
                }
                actions={
                  isProjectDetail ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-pressed={isProjectSidePanelOpen}
                      onClick={() => setIsProjectSidePanelOpen((open) => !open)}
                      data-testid="project-side-panel-toggle"
                    >
                      {isProjectSidePanelOpen ? (
                        <PanelRightCloseIcon />
                      ) : (
                        <PanelRightOpenIcon />
                      )}
                      <span className="sr-only">Toggle project sidebar</span>
                    </Button>
                  ) : undefined
                }
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="@container/main flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                  {currentPath === "/dashboard" ? (
                    <Suspense
                      fallback={<RouteFallback label="Loading dashboard..." />}
                    >
                      <DashboardPage />
                    </Suspense>
                  ) : currentPath === "/settings" ? (
                    <Suspense
                      fallback={<RouteFallback label="Loading settings..." />}
                    >
                      <SettingsPage />
                    </Suspense>
                  ) : isProjectDetail ? (
                    <Suspense
                      fallback={<RouteFallback label="Loading project..." />}
                    >
                      <ProjectDetailPage
                        projectId={projectId}
                        projects={projects}
                        onBack={() => navigate("/projects")}
                        isSidePanelOpen={isProjectSidePanelOpen}
                        onSidePanelOpenChange={setIsProjectSidePanelOpen}
                      />
                    </Suspense>
                  ) : (
                    <Suspense
                      fallback={<RouteFallback label="Loading projects..." />}
                    >
                      <ProjectsPage
                        projects={projects}
                        onNavigate={navigate}
                        onCreateProject={handleCreateProject}
                      />
                    </Suspense>
                  )}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
          <Suspense fallback={null}>
            <Toaster />
          </Suspense>
        </>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
