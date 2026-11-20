"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "subtle"
  | "destructive"
  | "link";

export type ButtonSize = "sm" | "default" | "md" | "lg" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-xs font-medium border border-transparent",
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-xs font-medium border border-transparent",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98] font-medium border border-border/40",
  outline:
    "bg-card text-foreground hover:bg-muted active:scale-[0.98] font-medium border border-border",
  subtle:
    "bg-muted/70 text-foreground hover:bg-muted active:scale-[0.98] font-medium border border-transparent",
  ghost:
    "text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.98] font-medium border border-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 active:scale-[0.98] font-medium shadow-xs border border-transparent",
  link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8.5 px-3 text-xs rounded-xl gap-1.5",
  default: "h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
  md: "h-10 px-4 text-xs sm:text-sm rounded-xl gap-2",
  lg: "h-11 px-5 text-sm rounded-xl gap-2.5 font-semibold",
  icon: "size-10 p-0 rounded-xl flex items-center justify-center shrink-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
