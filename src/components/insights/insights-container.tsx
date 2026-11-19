"use client";

import { TrendingUp, Award } from "lucide-react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { DivisionProgress } from "@/components/insights/canon-coverage-section";
import type { UserAchievementsData } from "@/actions/achievements";
import { InsightsKpiCards } from "@/components/insights/insights-kpi-cards";
import { CanonCoverageSection } from "@/components/insights/canon-coverage-section";
import { AchievementsView } from "@/components/achievements/achievements-view";
import { TabsBar, type TabItem } from "@/components/ui/tabs-bar";

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

  const tabs: ReadonlyArray<TabItem<InsightsTab>> = [
    {
      id: "coverage",
      label: "Scripture Coverage",
      icon: <TrendingUp className="size-4" />,
    },
    {
      id: "achievements",
      label: "Badges & Milestones",
      icon: <Award className="size-4" />,
      badge: `${achievementsData.stats.unlocked}/${achievementsData.stats.total}`,
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Top Segmented Tab Switcher */}
      <TabsBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={({ tab }) => void setActiveTab(tab)}
      />

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
