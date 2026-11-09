export function OverviewChartSkeleton() {
  return (
    <div className="ui-card flex h-full flex-col justify-between p-4.5 sm:p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle shrink-0">
        <div className="h-4 w-28 rounded-md bg-surface-elevated" />
        <div className="h-3 w-16 rounded-md bg-surface-elevated" />
      </div>
      <div className="my-auto flex flex-1 items-center justify-center py-4">
        <div className="h-32 w-full rounded-xl bg-surface-elevated/70" />
      </div>
      <div className="mt-2 border-t border-border-subtle pt-2 shrink-0">
        <div className="h-3 w-36 rounded-md bg-surface-elevated" />
      </div>
    </div>
  );
}

export function OverviewDashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3.5 min-h-0">
      <div className="grid grid-cols-12 gap-3.5 flex-[1.2] min-h-0">
        <div className="col-span-12 xl:col-span-3 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
        <div className="col-span-12 xl:col-span-6 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
        <div className="col-span-12 xl:col-span-3 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3.5 flex-1 min-h-0">
        <div className="col-span-12 xl:col-span-4 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
        <div className="col-span-12 xl:col-span-4 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
        <div className="col-span-12 xl:col-span-4 h-full min-h-0">
          <OverviewChartSkeleton />
        </div>
      </div>
    </div>
  );
}
