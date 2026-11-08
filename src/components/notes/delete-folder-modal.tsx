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
      <div className="ui-card relative w-full max-w-md p-6 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-foreground-dim hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Icon & Folder Badge */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-[11px] font-bold text-foreground">
            <Folder className="size-3.5" />
            <span className="truncate max-w-[200px]">{folder.name}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          id="delete-folder-title"
          className="mt-4 text-[17px] font-bold text-foreground"
        >
          Delete Folder &ldquo;{folder.name}&rdquo;?
        </h3>

        {/* Description & Options Explainer */}
        <p
          id="delete-folder-description"
          className="mt-1.5 text-[13px] leading-relaxed text-foreground-secondary"
        >
          {hasNotes ? (
            <>
              This folder contains{" "}
              <strong className="text-foreground">
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
          <div className="mt-3.5 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-[12px] text-foreground-secondary flex items-start gap-2">
            <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
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
            className="ui-btn-secondary ui-btn-sm"
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
                className="ui-btn-primary ui-btn-sm"
              >
                Keep Notes
              </button>
              <button
                type="button"
                onClick={onDeleteFolderAndNotes}
                disabled={isPending}
                data-testid="delete-folder-and-notes-button"
                className="ui-btn-destructive ui-btn-sm"
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
              className="ui-btn-destructive ui-btn-sm"
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
