import { ThemeProvider } from "next-themes";

import { Toaster } from "@repo/ui/components/sonner";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { dashboardData } from "./data/dashboard-data";
import { DataTable } from "./components/data-table";
import { ChartAreaInteractive } from "./components/chart-area-interactive";
import { SectionCards } from "./components/section-cards";
import { SiteHeader } from "./components/site-header";
import { AppSidebar } from "./components/app-sidebar";
import type { CSSProperties } from "react";

function App() {
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
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
              } as CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <SectionCards />
                    <div className="px-4 lg:px-6">
                      <ChartAreaInteractive />
                    </div>
                    <DataTable data={dashboardData} />
                  </div>
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
