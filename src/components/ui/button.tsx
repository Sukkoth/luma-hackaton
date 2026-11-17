"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "subtle"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-xs font-medium border border-transparent",
  secondary:
    "bg-surface-elevated text-foreground hover:bg-surface-subtle active:scale-[0.98] font-medium border border-border/60",
  outline:
    "bg-surface text-foreground hover:bg-surface-elevated active:scale-[0.98] font-medium border border-border",
  subtle:
    "bg-surface-subtle/70 text-foreground hover:bg-surface-subtle active:scale-[0.98] font-medium border border-transparent",
  ghost:
    "text-foreground-secondary hover:text-foreground hover:bg-surface-elevated active:scale-[0.98] font-medium border border-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 active:scale-[0.98] font-medium shadow-xs border border-transparent",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs rounded-xl gap-1.5",
  md: "h-10.5 px-4.5 text-xs sm:text-sm rounded-xl gap-2",
  lg: "h-12 px-5.5 text-sm rounded-2xl gap-2.5 font-semibold",
  icon: "size-10 p-0 rounded-xl flex items-center justify-center shrink-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
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
        className={`inline-flex items-center justify-center transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`}
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
