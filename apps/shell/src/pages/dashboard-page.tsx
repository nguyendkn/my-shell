import { lazy, Suspense } from "react";

import { dashboardData } from "../data/dashboard-data";
import { SectionCards } from "../components/section-cards";

const ChartAreaInteractive = lazy(() =>
  import("../components/chart-area-interactive").then((module) => ({
    default: module.ChartAreaInteractive,
  })),
);

const DataTable = lazy(() =>
  import("../components/data-table").then((module) => ({
    default: module.DataTable,
  })),
);

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <Suspense
          fallback={
            <div className="h-[360px] rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Loading chart...
            </div>
          }
        >
          <ChartAreaInteractive />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <div className="mx-4 rounded-xl border bg-card p-4 text-sm text-muted-foreground lg:mx-6">
            Loading table...
          </div>
        }
      >
        <DataTable data={dashboardData} />
      </Suspense>
    </div>
  );
}
