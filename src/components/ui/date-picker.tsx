"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DatePickerProps = {
  date?: Date | string | null;
  onDateChange?: (date: Date | undefined, dateStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  testId?: string;
};

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  minDate,
  maxDate,
  testId,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!date) return undefined;
    if (typeof date === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [y, m, d] = date.split("-").map(Number);
        return new Date(y!, m! - 1, d!);
      }
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return date;
  }, [date]);

  const handleSelect = (newDate: Date | undefined) => {
    const dateStr = newDate ? format(newDate, "yyyy-MM-dd") : "";
    onDateChange?.(newDate, dateStr);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          data-testid={testId}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2 text-xs sm:text-sm font-medium text-foreground shadow-2xs transition-all hover:bg-muted/60 focus:outline-hidden focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer text-left",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 text-primary shrink-0" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl shadow-xl border-border bg-card"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(d) => {
            if (minDate && d < minDate) return true;
            if (maxDate && d > maxDate) return true;
            return false;
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
