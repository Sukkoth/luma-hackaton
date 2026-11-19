"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  count?: number;
  testId?: string;
  disabled?: boolean;
};

export type TabChangeParams<T extends string = string> = {
  tab: T;
};

export type TabsBarProps<T extends string = string> = {
  tabs: ReadonlyArray<TabItem<T>>;
  activeTab: T;
  onTabChange: (params: TabChangeParams<T>) => void;
  className?: string;
  containerTestId?: string;
};

export function TabsBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
  containerTestId,
}: TabsBarProps<T>) {
  return (
    <div
      data-testid={containerTestId}
      className={cn(
        "flex items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-2xs max-w-full overflow-x-auto scrollbar-none w-fit",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            data-testid={tab.testId}
            onClick={() => onTabChange({ tab: tab.id })}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer shrink-0 select-none",
              isActive
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
              tab.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {tab.icon && (
              <span className="shrink-0 flex items-center">{tab.icon}</span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
