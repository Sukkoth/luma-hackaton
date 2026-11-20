import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  "default" | "secondary" | "outline" | "destructive" | "success" | "accent";

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
};

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground shadow-2xs",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground bg-transparent",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground shadow-2xs",
  success:
    "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
  accent:
    "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300 border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        BADGE_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
