"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, Loader2, X } from "lucide-react";

const emptySubscribe = () => () => {};

export type CreateFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending?: boolean;
};

export function CreateFolderModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: CreateFolderModalProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-folder-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="ui-card relative w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <FolderPlus className="size-5 text-foreground" />
            <h3
              id="create-folder-title"
              className="text-[16px] font-bold text-foreground"
            >
              New Study Folder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-foreground-dim hover:bg-surface-elevated hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-foreground">
              Folder Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Pauline Epistles, Prayer Requests"
              required
              autoFocus
              className="ui-input mt-1.5 w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-btn-secondary ui-btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="ui-btn-primary ui-btn-sm gap-1.5"
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              <span>Create Folder</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
