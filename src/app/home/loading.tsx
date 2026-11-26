import { OverviewDashboardSkeleton } from "@/components/overview/overview-skeletons";

export default function HomeLoading() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="space-y-2 animate-pulse">
        <div className="h-3.5 w-48 rounded-md bg-surface-elevated" />
        <div className="h-9 w-72 rounded-lg bg-surface-elevated" />
        <div className="h-4 w-96 max-w-full rounded-md bg-surface-elevated" />
      </div>
      <OverviewDashboardSkeleton />
    </div>
  );
}
