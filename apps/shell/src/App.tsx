import { ThemeProvider } from "next-themes";

import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { SiteHeader } from "./components/site-header";
import { AppSidebar } from "./components/app-sidebar";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { ProjectsPage } from "./pages/projects-page";

const DEFAULT_SIDEBAR_WIDTH = 288;
const DashboardPage = lazy(() => import("./pages/dashboard-page"));

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

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const { currentPath, navigate } = useAppRoute();
  const headerTitle = currentPath === "/dashboard" ? "Dashboard" : "Projects";

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <>
          <SidebarProvider
            style={
              {
                "--sidebar-width": `${sidebarWidth}px`,
                "--header-height": "calc(var(--spacing) * 12)",
              } as CSSProperties
            }
          >
            <AppSidebar
              currentPath={currentPath}
              variant="inset"
              width={sidebarWidth}
              onNavigate={navigate}
              onWidthChange={setSidebarWidth}
            />
            <SidebarInset>
              <SiteHeader title={headerTitle} />
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
                  {currentPath === "/dashboard" ? (
                    <Suspense
                      fallback={
                        <div className="p-4 text-sm text-muted-foreground lg:p-6">
                          Loading dashboard...
                        </div>
                      }
                    >
                      <DashboardPage />
                    </Suspense>
                  ) : (
                    <ProjectsPage />
                  )}
                </div>
              </div>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
