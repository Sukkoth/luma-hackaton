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
      <div className="glass-panel relative w-full max-w-md rounded-3xl border border-white/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
        <div className="flex items-center justify-between border-b border-black/6 pb-3 dark:border-white/6">
          <div className="flex items-center gap-2">
            <FolderPlus className="size-5 text-zinc-900 dark:text-zinc-100" />
            <h3
              id="create-folder-title"
              className="text-[16px] font-semibold text-black dark:text-white"
            >
              New Study Folder
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/5 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-black dark:text-white">
              Folder Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Pauline Epistles, Prayer Requests"
              required
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white/70 px-3.5 py-2.5 text-[13px] text-black focus:border-zinc-950 focus:outline-hidden dark:border-zinc-800 dark:bg-white/5 dark:text-white dark:focus:border-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-xl border border-white/80 bg-white/70 px-4 text-[13px] font-medium text-neutral-600 hover:bg-white hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-black px-4.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer"
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
