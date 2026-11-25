"use client";

import { useState, useMemo } from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import { Award, CheckCircle2, Lock, Flame } from "lucide-react";
import type {
  UserAchievementItem,
  UserAchievementsStats,
} from "@/actions/achievements";
import type { AchievementCategory } from "@/data/achievements";
import { AchievementCard } from "./achievement-card";
import { ShareMilestoneModal } from "./share-milestone-modal";
import { TabsBar } from "@/components/ui/tabs-bar";
import { FilterPills } from "@/components/ui/filter-pills";

export type StatusFilter = "All" | "Unlocked" | "Locked";

const CATEGORIES: ReadonlyArray<AchievementCategory> = [
  "Daily Streaks",
  "Fellowships",
  "Bible Volumes",
  "Old Testament",
  "Wisdom & Poetry",
  "New Testament",
  "Deuterocanon & Heritage",
  "Reading Plans",
  "Trackers",
];

export type AchievementsViewProps = {
  achievements?: ReadonlyArray<UserAchievementItem>;
  unlockedList?: ReadonlyArray<UserAchievementItem>;
  stats: UserAchievementsStats;
  categories?: ReadonlyArray<unknown>;
};

export function AchievementsView({
  achievements: passedAchievements,
  unlockedList,
  stats,
}: AchievementsViewProps) {
  const achievements = useMemo(
    () => passedAchievements || unlockedList || [],
    [passedAchievements, unlockedList]
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsStringLiteral(["All", "Unlocked", "Locked"] as const).withDefault(
      "All"
    )
  );
  const [categoryFilter, setCategoryFilter] = useQueryState(
    "category",
    parseAsString.withDefault("All")
  );
  const [selectedAchievement, setSelectedAchievement] =
    useState<UserAchievementItem | null>(null);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      if (statusFilter === "Unlocked" && !ach.isUnlocked) return false;
      if (statusFilter === "Locked" && ach.isUnlocked) return false;
      if (categoryFilter !== "All" && ach.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [achievements, statusFilter, categoryFilter]);

  return (
    <section className="space-y-6">
      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="ui-card p-4.5 rounded-2xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Award className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Total Badges
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.total}
          </span>
        </div>

        <div className="ui-card p-4.5 rounded-2xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-foreground">
              Unlocked
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.unlocked}
          </span>
        </div>

        <div className="ui-card p-4.5 rounded-2xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Lock className="size-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              In Progress
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.locked}
          </span>
        </div>

        <div className="ui-card p-4.5 rounded-2xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
            <Flame className="size-4 text-primary fill-primary" />
            <span className="text-xs font-semibold text-foreground">
              Completion Rate
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {stats.percentage}%
          </span>
        </div>
      </div>

      {/* Main Filter & Navigation Block */}
      <div className="ui-card p-5 sm:p-6 rounded-2xl space-y-4">
        {/* Status Filter Segmented Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Milestone Gallery
            </h2>
            <p className="text-xs text-muted-foreground">
              Earn distinctive badges as you read and build consistency across
              canons.
            </p>
          </div>

          <TabsBar
            containerTestId="achievement-status-filter"
            tabs={[
              { id: "All" as const, label: `All (${stats.total})` },
              {
                id: "Unlocked" as const,
                label: `Unlocked (${stats.unlocked})`,
              },
              { id: "Locked" as const, label: `Locked (${stats.locked})` },
            ]}
            activeTab={statusFilter}
            onTabChange={({ tab }) => setStatusFilter(tab)}
            className="self-start sm:self-auto"
          />
        </div>

        {/* Category Pills Strip */}
        <FilterPills
          items={[
            { id: "All", label: "All Categories" },
            ...CATEGORIES.map((cat) => ({ id: cat, label: cat })),
          ]}
          activeFilter={categoryFilter}
          onFilterChange={({ filter }) => setCategoryFilter(filter)}
        />

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2">
          {filteredAchievements.map((item) => (
            <AchievementCard
              key={item.id}
              item={item}
              onSelect={() => setSelectedAchievement(item)}
            />
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">No milestones found in this category.</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedAchievement && (
        <ShareMilestoneModal
          achievement={selectedAchievement}
          isOpen={!!selectedAchievement}
          onCloseAction={() => setSelectedAchievement(null)}
        />
      )}
    </section>
  );
}
