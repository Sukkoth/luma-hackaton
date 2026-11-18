"use client";

import { TrendingUp, Award } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { DivisionProgress } from "@/components/insights/canon-coverage-section";
import type { UserAchievementsData } from "@/actions/achievements";
import { InsightsKpiCards } from "@/components/insights/insights-kpi-cards";
import { CanonCoverageSection } from "@/components/insights/canon-coverage-section";
import { AchievementsView } from "@/components/achievements/achievements-view";
import { cn } from "@/lib/utils";

export type InsightsTab = "coverage" | "achievements";

export type InsightsContainerProps = {
  initialTab?: InsightsTab;
  canonName: string;
  divisions: ReadonlyArray<DivisionProgress>;
  streak?: StreakData;
  totalReadChapters: number;
  totalChaptersAcrossCanon: number;
  canonPercentage: number;
  activeTrackerName: string;
  achievementsData: UserAchievementsData;
};

export function InsightsContainer({
  initialTab = "coverage",
  canonName,
  divisions,
  streak,
  totalReadChapters,
  totalChaptersAcrossCanon,
  canonPercentage,
  activeTrackerName,
  achievementsData,
}: InsightsContainerProps) {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsStringLiteral(["coverage", "achievements"] as const).withDefault(
      initialTab
    )
  );

  return (
    <div className="w-full space-y-6">
      {/* Top Segmented Tab Switcher */}
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-1 w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("coverage")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer",
            activeTab === "coverage"
              ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <TrendingUp className="size-4" />
          <span>Scripture Coverage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer",
            activeTab === "achievements"
              ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Award className="size-4" />
          <span>Badges & Milestones</span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
              activeTab === "achievements"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {achievementsData.stats.unlocked}/{achievementsData.stats.total}
          </span>
        </button>
      </div>

      {/* Tab 1: Scripture Coverage & Analytics */}
      {activeTab === "coverage" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <InsightsKpiCards
            streak={streak}
            totalReadChapters={totalReadChapters}
            totalChaptersAcrossCanon={totalChaptersAcrossCanon}
            canonPercentage={canonPercentage}
            activeTrackerName={activeTrackerName}
          />
          <CanonCoverageSection canonName={canonName} divisions={divisions} />
        </div>
      )}

      {/* Tab 2: Badges & Achievements */}
      {activeTab === "achievements" && (
        <div className="animate-in fade-in-50 duration-200">
          <AchievementsView
            achievements={achievementsData.achievements}
            stats={achievementsData.stats}
          />
        </div>
      )}
    </div>
  );
}
