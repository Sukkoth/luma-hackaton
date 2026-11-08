"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

const emptySubscribe = () => () => {};

export type NotesConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function NotesConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  isPending = false,
}: NotesConfirmModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !isClient) return null;

  const isDanger = variant === "danger";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-description"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="ui-card relative w-full max-w-sm p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-xl p-1 text-foreground-dim hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon Header */}
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${
            isDanger
              ? "bg-destructive/10 text-destructive"
              : "bg-warning/10 text-warning"
          }`}
        >
          {isDanger ? (
            <Trash2 className="size-5" />
          ) : (
            <AlertTriangle className="size-5" />
          )}
        </div>

        {/* Title & Description */}
        <h3
          id="confirm-modal-title"
          className="mt-3.5 text-[17px] font-bold text-foreground"
        >
          {title}
        </h3>
        <p
          id="confirm-modal-description"
          className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary"
        >
          {description}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            data-testid="confirm-modal-cancel"
            className="ui-btn-secondary ui-btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-delete-button"
            className={
              isDanger
                ? "ui-btn-destructive ui-btn-sm"
                : "ui-btn-primary ui-btn-sm"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
