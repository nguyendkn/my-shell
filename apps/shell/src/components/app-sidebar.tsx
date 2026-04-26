"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { NavDocuments } from "./nav-documents";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";
import {
  BotIcon,
  LayoutDashboardIcon,
  FolderIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react";

const data = {
  user: {
    name: "Operator",
    email: "operator@fptclaw",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: <FolderIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
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
  onNavigate?: (path: string) => void;
};

export function AppSidebar({
  currentPath = "/projects",
  onNavigate,
  ...props
}: AppSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";

  return (
    <Sidebar collapsible="offcanvas" data-testid="app-sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto data-[slot=sidebar-menu-button]:p-2!"
            >
              <a href="#">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <BotIcon className="size-4!" />
                </span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-sm font-semibold tracking-tight">
                    FPTClaw Agent
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    Operator console
                  </span>
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.map((item) => ({
            ...item,
            isActive:
              currentPath === item.url ||
              (item.url === "/projects" &&
                currentPath.startsWith("/projects/")),
            onSelect: onNavigate,
          }))}
        />
        <NavDocuments items={data.documents} />
        <NavSecondary
          items={data.navSecondary.map((item) => ({
            ...item,
            isActive: currentPath === item.url,
            onSelect: item.url === "#" ? undefined : onNavigate,
          }))}
          className="mt-auto"
        />
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  tooltip="Toggle theme"
                  onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
                >
                  {isDarkTheme ? <SunIcon /> : <MoonIcon />}
                  <span>{isDarkTheme ? "Light theme" : "Dark theme"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
