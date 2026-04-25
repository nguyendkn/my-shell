import type { ReactNode } from "react";

import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";

type SiteHeaderProps = {
  title?: string;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function SiteHeader({
  title = "Documents",
  leading,
  actions,
}: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {leading}
        <h1 className="min-w-0 truncate text-base font-medium">{title}</h1>
        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
