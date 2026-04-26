import type { ReactNode } from "react";

import { Separator } from "@repo/ui/components/separator";
import { SidebarTrigger } from "@repo/ui/components/sidebar";

type SiteHeaderProps = {
  title?: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function SiteHeader({
  title = "Documents",
  subtitle,
  leading,
  actions,
}: SiteHeaderProps) {
  return (
    <header className="z-20 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/85 backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex min-w-0 w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {leading}
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
