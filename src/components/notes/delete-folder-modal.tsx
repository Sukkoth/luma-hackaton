"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Folder, Trash2, X, AlertTriangle } from "lucide-react";

const emptySubscribe = () => () => {};

export type DeleteFolderModalProps = {
  isOpen: boolean;
  folder: {
    id: string;
    name: string;
    notesCount: number;
  } | null;
  onClose: () => void;
  onDeleteFolderOnly: () => void;
  onDeleteFolderAndNotes: () => void;
  isPending?: boolean;
};

export function DeleteFolderModal({
  isOpen,
  folder,
  onClose,
  onDeleteFolderOnly,
  onDeleteFolderAndNotes,
  isPending = false,
}: DeleteFolderModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !folder || !isClient) return null;

  const hasNotes = folder.notesCount > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-folder-title"
      aria-describedby="delete-folder-description"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="glass-panel relative w-full max-w-md rounded-3xl border border-white/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-neutral-400 hover:bg-black/5 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon & Folder Badge */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <Trash2 className="size-5" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#82ADD4]/15 px-2.5 py-1 text-[12px] font-medium text-[#416e94] dark:text-[#82ADD4]">
            <Folder className="size-3.5" />
            <span className="truncate max-w-[200px]">{folder.name}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          id="delete-folder-title"
          className="mt-4 text-[17px] font-semibold text-neutral-900 dark:text-neutral-50"
        >
          Delete Folder &ldquo;{folder.name}&rdquo;?
        </h3>

        {/* Description & Options Explainer */}
        <p
          id="delete-folder-description"
          className="mt-1.5 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400"
        >
          {hasNotes ? (
            <>
              This folder contains{" "}
              <strong className="text-neutral-900 dark:text-neutral-200">
                {folder.notesCount} {folder.notesCount === 1 ? "note" : "notes"}
              </strong>
              . You can delete the folder while keeping its notes safe as
              uncategorized reflections, or permanently delete the folder and
              all notes inside.
            </>
          ) : (
            "This folder is currently empty. Are you sure you want to permanently delete it?"
          )}
        </p>

        {hasNotes && (
          <div className="mt-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-[12px] text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-200 flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Deleting notes cannot be undone. Choosing &ldquo;Keep Notes&rdquo;
              moves them to Uncategorized.
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            data-testid="delete-folder-cancel-button"
            className="h-9 rounded-xl border border-black/8 bg-black/4 px-4 text-[13px] font-medium text-neutral-700 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {hasNotes ? (
            <>
              <button
                type="button"
                onClick={onDeleteFolderOnly}
                disabled={isPending}
                data-testid="delete-folder-only-button"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-black px-4 text-[13px] font-medium text-white shadow-xs hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors cursor-pointer"
              >
                Keep Notes
              </button>
              <button
                type="button"
                onClick={onDeleteFolderAndNotes}
                disabled={isPending}
                data-testid="delete-folder-and-notes-button"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4 text-[13px] font-medium text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Folder & Notes
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDeleteFolderOnly}
              disabled={isPending}
              data-testid="delete-folder-only-button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-red-600 px-4.5 text-[13px] font-medium text-white shadow-xs hover:bg-red-700 transition-colors cursor-pointer"
            >
              Delete Folder
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
