"use client";

import * as React from "react";

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/sidebar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@repo/ui/components/resizable";
import {
  LayoutDashboardIcon,
  ChartBarIcon,
  FolderIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  TerminalIcon,
} from "lucide-react";

const SIDEBAR_MIN_WIDTH = 224;
const SIDEBAR_MAX_WIDTH = 420;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useViewportWidth() {
  const [viewportWidth, setViewportWidth] = React.useState(0);

  React.useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  return viewportWidth;
}

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: <ChartBarIcon />,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: <FolderIcon />,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: <DatabaseIcon />,
    },
    {
      name: "Reports",
      url: "#",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: <FileIcon />,
    },
  ],
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  currentPath?: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onNavigate?: (path: string) => void;
  onWidthChange?: (width: number) => void;
};

type PanelResizeSize = Parameters<
  NonNullable<React.ComponentProps<typeof ResizablePanel>["onResize"]>
>[0];

export function AppSidebar({
  currentPath = "/projects",
  width = 288,
  minWidth = SIDEBAR_MIN_WIDTH,
  maxWidth = SIDEBAR_MAX_WIDTH,
  onNavigate,
  onWidthChange,
  ...props
}: AppSidebarProps) {
  const { isMobile, state } = useSidebar();
  const viewportWidth = useViewportWidth();
  const sidebarWidth = clamp(width, minWidth, maxWidth);
  const canResize =
    Boolean(onWidthChange) &&
    !isMobile &&
    state === "expanded" &&
    viewportWidth >= 768;
  const contentWidth = Math.max(viewportWidth - sidebarWidth, 0);

  const handleResize = React.useCallback(
    (size: PanelResizeSize) => {
      if (!viewportWidth) {
        return;
      }

      onWidthChange?.(clamp(Math.round(size.inPixels), minWidth, maxWidth));
    },
    [maxWidth, minWidth, onWidthChange, viewportWidth],
  );

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <a href="#">
                  <TerminalIcon className="size-5!" />
                  <span className="text-base font-semibold">SHELL HERE</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain
            items={data.navMain.map((item) => ({
              ...item,
              isActive: currentPath === item.url,
              onSelect: onNavigate,
            }))}
          />
          <NavDocuments items={data.documents} />
          <NavSecondary items={data.navSecondary} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      {canResize ? (
        <ResizablePanelGroup
          orientation="horizontal"
          className="pointer-events-none fixed inset-y-0 left-0 z-30 h-svh w-screen"
        >
          <ResizablePanel
            id="app-sidebar-resize-panel"
            minSize={minWidth}
            maxSize={maxWidth}
            defaultSize={sidebarWidth}
            groupResizeBehavior="preserve-pixel-size"
            onResize={handleResize}
          />
          <ResizableHandle
            aria-label="Resize sidebar"
            withHandle
            className="pointer-events-auto w-2 bg-transparent after:w-3 hover:bg-sidebar-border focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          />
          <ResizablePanel
            id="app-content-resize-panel"
            minSize={0}
            defaultSize={contentWidth}
          />
        </ResizablePanelGroup>
      ) : null}
    </>
  );
}
