"use client";

import { useSyncExternalStore, useTransition, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FileText, Loader2, X, ExternalLink, Trash2 } from "lucide-react";
import type { PlanNoteDetail } from "@/actions/plans";
import dynamic from "next/dynamic";
import {
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/actions/notes";

const TiptapEditor = dynamic(
  () => import("@/components/notes/tiptap-editor").then((m) => m.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[160px] items-center justify-center text-[13px] text-neutral-400">
        Loading editor...
      </div>
    ),
  }
);

const emptySubscribe = () => () => {};

export type PlanNoteModalProps = {
  isOpen: boolean;
  instanceId: string;
  planTitle: string;
  sessionIndex: number;
  sessionTitle: string;
  noteToEdit: PlanNoteDetail | null;
  onCloseAction: () => void;
  onNoteSavedAction: (note: PlanNoteDetail) => void;
  onNoteDeletedAction: (noteId: string) => void;
};

type SaveNoteExecutionParams = {
  shouldNavigateToStudio?: boolean;
};

export function PlanNoteModal({
  isOpen,
  instanceId,
  planTitle,
  sessionIndex,
  sessionTitle,
  noteToEdit,
  onCloseAction,
  onNoteSavedAction,
  onNoteDeletedAction,
}: PlanNoteModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const contentDraftRef = useRef<{ html: string; plainText: string }>({
    html: noteToEdit?.bodyHtml || "",
    plainText: noteToEdit?.plainTextSnippet || "",
  });

  if (!isOpen || !isClient) return null;

  const isEditing = noteToEdit !== null;
  const defaultTitle = isEditing
    ? noteToEdit.title
    : `${sessionTitle} Reflection`;

  const executeSaveNote = ({
    shouldNavigateToStudio = false,
  }: SaveNoteExecutionParams = {}) => {
    setErrorMessage(null);
    const formData = formRef.current
      ? new FormData(formRef.current)
      : new FormData();
    const titleVal = (formData.get("title") as string)?.trim() || defaultTitle;
    const htmlContent = contentDraftRef.current.html;
    const plainText = contentDraftRef.current.plainText;

    startTransition(async () => {
      if (isEditing && noteToEdit) {
        const res = await updateNoteAction({
          noteId: noteToEdit.id,
          title: titleVal,
          bodyHtml: htmlContent,
          plainTextSnippet: plainText.slice(0, 200),
        });

        if (!res.success) {
          setErrorMessage(res.error);
          return;
        }

        const savedNote: PlanNoteDetail = {
          id: res.note.id,
          planSessionId: res.note.planSessionId,
          planDayNumber: res.note.planDayNumber,
          title: res.note.title,
          plainTextSnippet: res.note.plainTextSnippet,
          bodyHtml: res.note.bodyHtml,
          createdAt: res.note.createdAt,
          updatedAt: res.note.updatedAt,
        };

        onNoteSavedAction(savedNote);
        onCloseAction();

        if (shouldNavigateToStudio) {
          router.push(`/notes?noteId=${res.note.id}`);
          router.refresh();
        }
      } else {
        const res = await createNoteAction({
          title: titleVal,
          bodyHtml: htmlContent,
          plainTextSnippet: plainText.slice(0, 200),
          planInstanceId: instanceId,
          planSessionId: sessionIndex,
        });

        if (!res.success) {
          setErrorMessage(res.error);
          return;
        }

        const savedNote: PlanNoteDetail = {
          id: res.note.id,
          planSessionId: res.note.planSessionId,
          planDayNumber: res.note.planDayNumber,
          title: res.note.title,
          plainTextSnippet: res.note.plainTextSnippet,
          bodyHtml: res.note.bodyHtml,
          createdAt: res.note.createdAt,
          updatedAt: res.note.updatedAt,
        };

        onNoteSavedAction(savedNote);
        onCloseAction();

        if (shouldNavigateToStudio) {
          router.push(`/notes?noteId=${res.note.id}`);
          router.refresh();
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSaveNote({ shouldNavigateToStudio: false });
  };

  const handleSaveAndOpenStudio = () => {
    executeSaveNote({ shouldNavigateToStudio: true });
  };

  const handleDelete = () => {
    if (!noteToEdit) return;
    startTransition(async () => {
      const res = await deleteNoteAction({ noteId: noteToEdit.id });
      if (res.success) {
        onNoteDeletedAction(noteToEdit.id);
        onCloseAction();
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-note-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="glass-panel relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-white/90 bg-white p-5 sm:p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/6 pb-4 dark:border-white/6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#82ADD4]">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#82ADD4]">
                  {planTitle}
                </span>
                <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-medium text-black dark:bg-white/10 dark:text-white">
                  {sessionTitle}
                </span>
              </div>
              <h3
                id="plan-note-modal-title"
                className="mt-0.5 text-[16px] font-semibold text-black dark:text-white"
              >
                {isEditing ? "Edit Reflection" : "New Study Reflection"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-black/5 hover:text-black dark:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12px] text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && isEditing && (
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
            <h4 className="text-[13px] font-semibold text-red-700 dark:text-red-300">
              Delete this reflection?
            </h4>
            <p className="mt-1 text-[12px] text-red-600/90 dark:text-red-400/90">
              This action cannot be undone. It will remove this reflection from
              both your plan and study journal.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="rounded-xl border border-black/10 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-[12px] font-medium text-white shadow-xs hover:bg-red-700"
              >
                {isPending && <Loader2 className="size-3 animate-spin" />}
                <span>Delete Note</span>
              </button>
            </div>
          </div>
        )}

        {/* Note Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-4 flex flex-1 flex-col min-h-0 space-y-4"
        >
          <div>
            <label className="block text-[12.5px] font-medium text-neutral-700 dark:text-neutral-300">
              Reflection Title
            </label>
            <input
              type="text"
              name="title"
              defaultValue={defaultTitle}
              required
              className="mt-1.5 w-full rounded-xl border border-black/8 bg-black/[0.02] px-3.5 py-2.5 text-[13.5px] font-medium text-black focus:border-[#82ADD4] focus:bg-white focus:outline-hidden dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#1f1f26]"
              placeholder="e.g. Day 1 - Key Insights & Prayer"
            />
          </div>

          <div className="flex-1 min-h-[220px] max-h-[50vh] flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white/80 p-2.5 dark:border-white/10 dark:bg-black/20">
            <div className="flex-1 min-h-0 overflow-y-auto px-1 py-0.5">
              <TiptapEditor
                key={noteToEdit?.id || `new-${sessionIndex}`}
                content={noteToEdit?.bodyHtml || ""}
                minHeightClass="min-h-[160px]"
                placeholder="Write your study observations, cross-references, what God spoke to you, or prayer requests..."
                onChangeAction={(content) => {
                  contentDraftRef.current = content;
                }}
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/6 dark:border-white/6 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAndOpenStudio}
                disabled={isPending}
                data-testid="modal-open-in-studio-button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-black/4 px-3 py-1.5 text-[12px] font-medium text-neutral-700 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Save reflection and open in full studio"
              >
                <ExternalLink className="size-3.5" />
                <span>Open in Studio</span>
              </button>

              {isEditing && noteToEdit && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/15 bg-red-500/5 px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/15 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 cursor-pointer"
                  title="Delete reflection"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCloseAction}
                disabled={isPending}
                className="h-9 rounded-xl border border-black/8 bg-black/4 px-4 text-[13px] font-medium text-neutral-700 hover:bg-black/8 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-black px-4.5 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90 cursor-pointer"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>{isEditing ? "Save Reflection" : "Save Note"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
