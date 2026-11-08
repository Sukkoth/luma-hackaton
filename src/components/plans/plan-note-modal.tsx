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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="ui-card relative flex max-h-[92vh] w-full max-w-2xl flex-col p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-foreground">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim">
                  {planTitle}
                </span>
                <span className="ui-pill text-[10.5px]">{sessionTitle}</span>
              </div>
              <h3
                id="plan-note-modal-title"
                className="mt-0.5 text-[16px] font-semibold text-foreground"
              >
                {isEditing ? "Edit Reflection" : "New Study Reflection"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-lg p-1.5 text-foreground-dim hover:bg-surface-elevated hover:text-foreground cursor-pointer transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[12px] text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && isEditing && (
          <div className="mt-4 rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
            <h4 className="text-[13px] font-semibold text-destructive">
              Delete this reflection?
            </h4>
            <p className="mt-1 text-[12px] text-destructive/90">
              This action cannot be undone. It will remove this reflection from
              both your plan and study journal.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isPending}
                className="ui-btn-secondary ui-btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="ui-btn-destructive ui-btn-sm gap-1.5"
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
            <label className="block text-[12.5px] font-medium text-foreground-secondary">
              Reflection Title
            </label>
            <input
              type="text"
              name="title"
              defaultValue={defaultTitle}
              required
              className="ui-input mt-1.5 w-full"
              placeholder="e.g. Day 1 - Key Insights & Prayer"
            />
          </div>

          <div className="flex-1 min-h-[220px] max-h-[50vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-surface p-2.5">
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAndOpenStudio}
                disabled={isPending}
                data-testid="modal-open-in-studio-button"
                className="ui-btn-secondary ui-btn-sm gap-1.5"
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
                  className="ui-btn-destructive ui-btn-sm"
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
