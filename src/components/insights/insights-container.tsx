"use client";

import { TrendingUp, Award } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { DivisionProgress } from "@/components/insights/canon-coverage-section";
import type { UserAchievementsData } from "@/actions/achievements";
import { InsightsKpiCards } from "@/components/insights/insights-kpi-cards";
import { CanonCoverageSection } from "@/components/insights/canon-coverage-section";
import { AchievementsView } from "@/components/achievements/achievements-view";

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
      <div className="flex items-center gap-1.5 rounded-[18px] border border-border bg-surface p-1 w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("coverage")}
          className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === "coverage"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <TrendingUp className="size-4" />
          <span>Scripture Coverage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === "achievements"
              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
              : "bg-transparent text-foreground-secondary hover:text-foreground hover:bg-surface-elevated"
          }`}
        >
          <Award className="size-4" />
          <span>Badges & Achievements</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold tabular-nums ${
              activeTab === "achievements"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-surface-elevated text-foreground-dim"
            }`}
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
