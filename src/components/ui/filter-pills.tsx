"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FilterPillItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  count?: number;
  testId?: string;
  disabled?: boolean;
};

export type FilterChangeParams<T extends string = string> = {
  filter: T;
};

export type FilterPillsProps<T extends string = string> = {
  items: ReadonlyArray<FilterPillItem<T>>;
  activeFilter: T;
  onFilterChange: (params: FilterChangeParams<T>) => void;
  className?: string;
  containerTestId?: string;
};

export function FilterPills<T extends string = string>({
  items,
  activeFilter,
  onFilterChange,
  className,
  containerTestId,
}: FilterPillsProps<T>) {
  return (
    <div
      data-testid={containerTestId}
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none md:flex-wrap w-full",
        className
      )}
    >
      {items.map((item) => {
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            data-testid={item.testId}
            onClick={() => onFilterChange({ filter: item.id })}
            className={cn(
              "shrink-0 rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer select-none",
              isActive
                ? "border border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
                : "border border-border bg-surface-elevated text-muted-foreground hover:border-border-strong hover:text-foreground",
              item.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="ml-1 opacity-80 tabular-nums">
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
