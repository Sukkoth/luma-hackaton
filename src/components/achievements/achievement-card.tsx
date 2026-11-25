"use client";

import { Lock, LockOpen, Share2 } from "lucide-react";
import type { UserAchievementItem } from "@/actions/achievements";
import { AchievementIcon } from "./achievement-icon";
import { cn } from "@/lib/utils";

export type AchievementCardProps = {
  item?: UserAchievementItem;
  achievement?: UserAchievementItem;
  onSelectAction?: (params: { achievement: UserAchievementItem }) => void;
  onSelect?: () => void;
};

export function AchievementCard({
  item,
  achievement: passedAchievement,
  onSelectAction,
  onSelect,
}: AchievementCardProps) {
  const achievement = item || passedAchievement;
  if (!achievement) return null;

  const {
    title,
    description,
    category,
    iconName,
    isUnlocked,
    current,
    total,
    percentage,
  } = achievement;

  const handleClick = () => {
    if (onSelectAction) {
      onSelectAction({ achievement });
    } else if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "group ui-card flex flex-col justify-between p-4.5 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer text-left",
        isUnlocked
          ? "border-primary/30 hover:border-primary/60 hover:shadow-md bg-card"
          : "hover:border-border hover:bg-muted/40"
      )}
    >
      <div>
        {/* Top Header: Icon & Status */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-105",
              isUnlocked
                ? "bg-primary/10 text-primary border-primary/20 shadow-2xs"
                : "bg-muted text-muted-foreground border-border"
            )}
          >
            <AchievementIcon name={iconName} className="size-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {isUnlocked ? (
              <div className="flex items-center gap-1.5">
                <span
                  title="Unlocked"
                  aria-label="Unlocked"
                  className="flex size-6 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary"
                >
                  <LockOpen className="size-3.5" />
                </span>
                <span
                  title="Share Milestone"
                  className="flex size-6 items-center justify-center rounded-lg text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
                >
                  <Share2 className="size-3.5" />
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Lock className="size-3" />
                <span>{percentage > 0 ? `${percentage}%` : "Locked"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3
          className={cn(
            "text-sm font-semibold tracking-tight transition-colors",
            isUnlocked
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}
        >
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>

      {/* Progress Footer */}
      <div className="mt-4 pt-3 border-t border-border/60">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium text-[11px]">
            {category}
          </span>
          <span
            className={cn(
              "font-semibold tabular-nums text-xs",
              isUnlocked ? "text-primary" : "text-muted-foreground"
            )}
          >
            {current} / {total}
          </span>
        </div>

        {/* Track */}
        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isUnlocked ? "bg-primary" : "bg-muted-foreground/30"
            )}
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
