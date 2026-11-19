"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export type LogoutConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
};

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}: LogoutConfirmModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      aria-describedby="logout-modal-description"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Backdrop click dismiss */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isPending) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon Badge */}
        <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <LogOut className="size-5" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3
            id="logout-modal-title"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            Log Out of Your Account
          </h3>
          <p
            id="logout-modal-description"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            Are you sure you want to sign out? Your reading progress and study notes are safely synced to your account.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={onConfirm}
            disabled={isPending}
            isLoading={isPending}
            leftIcon={!isPending ? <LogOut className="size-4" /> : undefined}
            className="rounded-xl font-semibold shadow-xs"
          >
            {isPending ? "Logging out..." : "Log Out"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
