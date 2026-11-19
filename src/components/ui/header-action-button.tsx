"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeaderActionType = "primary" | "secondary";

export type HeaderActionButtonProps = {
  type?: HeaderActionType;
  label: ReactNode;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  isLoading?: boolean;
  testId?: string;
  className?: string;
};

export type HeaderActionsProps = {
  actions?: ReadonlyArray<HeaderActionButtonProps>;
  children?: ReactNode;
  className?: string;
};

export function HeaderActionButton({
  type = "primary",
  label,
  icon,
  rightIcon,
  onClick,
  href,
  disabled = false,
  isLoading = false,
  testId,
  className,
}: HeaderActionButtonProps) {
  const isPrimary = type === "primary";

  const button = (
    <Button
      type="button"
      variant={isPrimary ? "default" : "outline"}
      size="default"
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      data-testid={testId}
      leftIcon={icon}
      rightIcon={rightIcon}
      className={cn(
        "rounded-xl transition-all cursor-pointer",
        isPrimary ? "font-semibold shadow-xs" : "font-medium",
        className
      )}
    >
      {label}
    </Button>
  );

  if (href && !disabled) {
    return <Link href={href}>{button}</Link>;
  }

  return button;
}

export function HeaderActions({
  actions,
  children,
  className,
}: HeaderActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 shrink-0 self-start sm:self-auto",
        className
      )}
    >
      {actions
        ? actions.map((action, idx) => (
            <HeaderActionButton key={idx} {...action} />
          ))
        : children}
    </div>
  );
}
