"use client";

import { useState, useMemo } from "react";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
import { Award, CheckCircle2, Lock, Sparkles } from "lucide-react";
import type {
  UserAchievementItem,
  UserAchievementsStats,
} from "@/actions/achievements";
import type { AchievementCategory } from "@/data/achievements";
import { AchievementCard } from "./achievement-card";
import { ShareMilestoneModal } from "./share-milestone-modal";

export type StatusFilter = "All" | "Unlocked" | "Locked";

const CATEGORIES: ReadonlyArray<AchievementCategory> = [
  "Daily Streaks",
  "Bible Volumes",
  "Old Testament",
  "Wisdom & Poetry",
  "New Testament",
  "Deuterocanon & Heritage",
  "Reading Plans",
  "Trackers",
];

export type AchievementsViewProps = {
  achievements: ReadonlyArray<UserAchievementItem>;
  stats: UserAchievementsStats;
};

export function AchievementsView({
  achievements,
  stats,
}: AchievementsViewProps) {
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
      // 1. Status Filter
      if (statusFilter === "Unlocked" && !ach.isUnlocked) return false;
      if (statusFilter === "Locked" && ach.isUnlocked) return false;

      // 2. Category Filter
      if (categoryFilter !== "All" && ach.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [achievements, statusFilter, categoryFilter]);

  return (
    <section className="space-y-6">
      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="ui-card p-4 rounded-[20px]">
          <div className="flex items-center gap-2 text-foreground-dim mb-1">
            <Award className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Total Badges
            </span>
          </div>
          <span className="text-[26px] font-bold tracking-tight text-foreground tabular-nums">
            {stats.total}
          </span>
        </div>

        <div className="ui-card p-4 rounded-[20px]">
          <div className="flex items-center gap-2 text-foreground-dim mb-1">
            <CheckCircle2 className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Unlocked
            </span>
          </div>
          <span className="text-[26px] font-bold tracking-tight text-foreground tabular-nums">
            {stats.unlocked}
          </span>
        </div>

        <div className="ui-card p-4 rounded-[20px]">
          <div className="flex items-center gap-2 text-foreground-dim mb-1">
            <Lock className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              In Progress
            </span>
          </div>
          <span className="text-[26px] font-bold tracking-tight text-foreground tabular-nums">
            {stats.locked}
          </span>
        </div>

        <div className="ui-card p-4 rounded-[20px]">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Sparkles className="size-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Completion
            </span>
          </div>
          <span className="text-[26px] font-bold tracking-tight text-foreground tabular-nums">
            {stats.percentage}%
          </span>
        </div>
      </div>

      {/* Main Filter & Navigation Block */}
      <div className="ui-card p-5 sm:p-6 rounded-[22px] space-y-4">
        {/* Status Filter Segmented Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
              Badges & Achievements
            </h2>
            <p className="text-[12.5px] text-foreground-secondary">
              Unlock milestones as you read and build consistency across canons.
            </p>
          </div>

          <div
            data-testid="achievement-status-filter"
            className="flex items-center gap-1 rounded-[16px] border border-border bg-surface-elevated p-1 self-start sm:self-auto"
          >
            {(
              [
                { id: "All" as const, label: `All (${stats.total})` },
                {
                  id: "Unlocked" as const,
                  label: `Unlocked (${stats.unlocked})`,
                },
                {
                  id: "Locked" as const,
                  label: `In Progress (${stats.locked})`,
                },
              ] as const
            ).map((status) => {
              const isSelected = statusFilter === status.id;
              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => setStatusFilter(status.id)}
                  className={`flex items-center rounded-[12px] px-3 py-1.5 text-[11.5px] font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-transparent text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {status.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter("All")}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all cursor-pointer ${
              categoryFilter === "All"
                ? "bg-foreground text-background shadow-2xs font-semibold"
                : "border border-border bg-surface-elevated text-foreground-secondary hover:text-foreground hover:border-border-strong"
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => {
            const isCatSelected = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  isCatSelected
                    ? "bg-foreground text-background shadow-2xs font-semibold"
                    : "border border-border bg-surface-elevated text-foreground-secondary hover:text-foreground hover:border-border-strong"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Achievements Grid */}
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pt-2">
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onSelectAction={({ achievement: selected }) =>
                  setSelectedAchievement(selected)
                }
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-foreground-dim mb-3">
              <Award className="size-6" />
            </div>
            <h3 className="text-[16px] font-medium text-foreground">
              No achievements found
            </h3>
            <p className="mt-1 text-[12px] text-foreground-dim max-w-sm mx-auto">
              {statusFilter === "Unlocked"
                ? "You haven't unlocked any badges in this category yet. Start reading to unlock your first!"
                : "No achievements match your selected filter criteria."}
            </p>
          </div>
        )}
      </div>

      {/* Share Milestone Modal */}
      <ShareMilestoneModal
        achievement={selectedAchievement}
        isOpen={Boolean(selectedAchievement)}
        onCloseAction={() => setSelectedAchievement(null)}
      />
    </section>
  );
}
