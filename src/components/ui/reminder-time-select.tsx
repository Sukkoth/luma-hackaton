"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  getThirtyMinuteSlots,
  is12HourFormat,
  snapToNearestThirtyMinutes,
  formatTimeForDisplay,
} from "@/lib/time-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "luma_time_format_preference";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "12h") return true;
  if (saved === "24h") return false;
  return is12HourFormat();
}

function getServerSnapshot(): boolean {
  return true;
}

export type ReminderTimeSelectProps = {
  value: string; // "HH:MM" 24-hour format (e.g. "08:30" or "20:00")
  onChange: (time: string) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  showFormatToggle?: boolean;
};

export function ReminderTimeSelect({
  value,
  onChange,
  disabled = false,
  name,
  id,
  className,
  showFormatToggle = true,
}: ReminderTimeSelectProps) {
  // Synchronized with localStorage and cross-component updates via useSyncExternalStore
  const is12Hour = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const handleFormatChange = (newIs12Hour: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newIs12Hour ? "12h" : "24h");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const slots = useMemo(
    () => getThirtyMinuteSlots({ use12Hour: is12Hour }),
    [is12Hour]
  );

  const snappedValue = useMemo(
    () => snapToNearestThirtyMinutes({ timeString: value || "20:00" }),
    [value]
  );

  const currentDisplayLabel = useMemo(
    () => formatTimeForDisplay({ time24: snappedValue, use12Hour: is12Hour }),
    [snappedValue, is12Hour]
  );

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* shadcn UI Select */}
      <div className="relative">
        <Select
          disabled={disabled}
          value={snappedValue}
          onValueChange={onChange}
          name={name}
        >
          <SelectTrigger
            id={id}
            data-testid="reminder-time-select"
            className="h-8.5 w-[125px] rounded-xl border-border bg-card px-2.5 text-xs font-semibold text-foreground shadow-2xs hover:border-primary/40 focus:ring-1 focus:ring-primary"
          >
            <SelectValue placeholder="Select time">
              {currentDisplayLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            position="popper"
            className="max-h-64 min-w-[130px] rounded-xl border border-border bg-popover shadow-xl z-50 overflow-y-auto"
          >
            {slots.map((slot) => (
              <SelectItem
                key={slot.value}
                value={slot.value}
                className="text-xs font-medium py-1.5 px-2.5 rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary"
              >
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 12h / 24h Custom Format Switcher */}
      {showFormatToggle && (
        <div
          role="group"
          aria-label="Time format toggle"
          className="inline-flex h-8 items-center rounded-lg border border-border bg-muted/50 p-0.5 text-xs font-semibold shadow-2xs"
        >
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleFormatChange(true)}
            data-state={is12Hour ? "on" : "off"}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
              is12Hour
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Switch to 12-hour AM/PM format"
          >
            12h
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleFormatChange(false)}
            data-state={!is12Hour ? "on" : "off"}
            className={cn(
              "px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
              !is12Hour
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Switch to 24-hour military format"
          >
            24h
          </button>
        </div>
      )}
    </div>
  );
}
