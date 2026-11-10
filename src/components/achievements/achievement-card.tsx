"use client";

import { Check, Lock, Share2 } from "lucide-react";
import type { UserAchievementItem } from "@/actions/achievements";
import { AchievementIcon } from "./achievement-icon";

export type AchievementCardProps = {
  achievement: UserAchievementItem;
  onSelectAction: ({
    achievement,
  }: {
    achievement: UserAchievementItem;
  }) => void;
};

export function AchievementCard({
  achievement,
  onSelectAction,
}: AchievementCardProps) {
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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectAction({ achievement })}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectAction({ achievement });
        }
      }}
      className={`group ui-card flex flex-col justify-between p-5 rounded-[22px] transition-all duration-200 cursor-pointer text-left ${
        isUnlocked
          ? "border-border-strong hover:border-foreground/30 hover:shadow-md bg-surface"
          : "hover:border-border-strong hover:bg-surface-elevated/40"
      }`}
    >
      <div>
        {/* Top Header: Icon & Status Pill */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] border transition-transform duration-200 group-hover:scale-105 ${
              isUnlocked
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-surface-elevated text-foreground-dim border-border"
            }`}
          >
            <AchievementIcon name={iconName} className="size-5" />
          </div>

          <div className="flex items-center gap-1.5">
            {isUnlocked ? (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-semibold text-primary-foreground shadow-2xs">
                  <Check className="size-3" strokeWidth={2.5} />
                  <span>UNLOCKED</span>
                </span>
                <span
                  title="Share Milestone"
                  className="flex size-6 items-center justify-center rounded-full text-foreground-dim opacity-70 transition-opacity hover:opacity-100"
                >
                  <Share2 className="size-3.5" />
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-border bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-foreground-secondary">
                <Lock className="size-2.5" />
                <span>{percentage > 0 ? "IN PROGRESS" : "LOCKED"}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3
          className={`text-[15px] font-semibold tracking-tight transition-colors ${
            isUnlocked
              ? "text-foreground"
              : "text-foreground-secondary group-hover:text-foreground"
          }`}
        >
          {title}
        </h3>
        <p className="mt-1 text-[12px] leading-relaxed text-foreground-dim line-clamp-2">
          {description}
        </p>
      </div>

      {/* Progress Footer */}
      <div className="mt-4 pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-semibold text-foreground-dim uppercase tracking-wider text-[9.5px]">
            {category}
          </span>
          <span
            className={`font-semibold tabular-nums text-[11.5px] ${
              isUnlocked
                ? "text-foreground font-bold"
                : "text-foreground-secondary"
            }`}
          >
            {current} / {total}
          </span>
        </div>

        {/* Track */}
        <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden border border-border-subtle">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isUnlocked ? "bg-primary" : "bg-foreground-secondary/40"
            }`}
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
