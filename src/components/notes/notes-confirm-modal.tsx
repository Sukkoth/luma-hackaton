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
      <div className="glass-panel relative w-full max-w-sm rounded-3xl border border-white/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-xl p-1 text-neutral-400 hover:bg-black/5 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon Header */}
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${
            isDanger
              ? "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
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
          className="mt-3.5 text-[17px] font-semibold text-neutral-900 dark:text-neutral-50"
        >
          {title}
        </h3>
        <p
          id="confirm-modal-description"
          className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400"
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
            className="h-9 rounded-xl border border-black/8 bg-black/4 px-4 text-[13px] font-medium text-neutral-700 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-delete-button"
            className={`inline-flex h-9 items-center justify-center rounded-xl px-4.5 text-[13px] font-medium text-white shadow-xs transition-colors cursor-pointer ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-black hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
