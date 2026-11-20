"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: `${defaultClassNames.root} w-fit`,
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-semibold text-foreground",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 size-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg hover:bg-muted border border-border flex items-center justify-center text-foreground transition-colors cursor-pointer"
        ),
        button_next: cn(
          "absolute right-1 size-7 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-lg hover:bg-muted border border-border flex items-center justify-center text-foreground transition-colors cursor-pointer"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "h-9 w-9 text-center text-sm p-0 relative flex items-center justify-center",
        day_button: cn(
          "size-8 rounded-lg font-normal text-xs text-foreground transition-all hover:bg-muted focus-visible:bg-muted cursor-pointer flex items-center justify-center"
        ),
        selected:
          "bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-xs",
        today: "border border-primary text-primary font-semibold rounded-lg",
        outside: "text-muted-foreground opacity-40",
        disabled:
          "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="size-4" />;
          }
          return <ChevronRight className="size-4" />;
        },
      }}
      {...props}
    />
  );
}
