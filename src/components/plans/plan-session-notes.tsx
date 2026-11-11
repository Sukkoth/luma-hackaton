"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  ExternalLink,
  Edit3,
  Calendar,
  BookOpen,
} from "lucide-react";
import type { PlanSessionDetail, PlanNoteDetail } from "@/actions/plans";
import { PlanNoteModal } from "./plan-note-modal";

export type PlanSessionNotesProps = {
  instanceId: string;
  planTitle: string;
  activeSession: PlanSessionDetail;
  notes: ReadonlyArray<PlanNoteDetail>;
  onNoteCreatedAction: (note: PlanNoteDetail) => void;
  onNoteUpdatedAction: (note: PlanNoteDetail) => void;
  onNoteDeletedAction: (noteId: string) => void;
};

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PlanSessionNotes({
  instanceId,
  planTitle,
  activeSession,
  notes,
  onNoteCreatedAction,
  onNoteUpdatedAction,
  onNoteDeletedAction,
}: PlanSessionNotesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<PlanNoteDetail | null>(null);

  const sessionNotes = notes.filter(
    (n) => n.planSessionId === activeSession.sessionIndex
  );

  const handleOpenCreateModal = () => {
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: PlanNoteDetail) => {
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  return (
    <div
      data-testid="plan-session-notes-section"
      className="glass-panel rounded-3xl border border-black/8 bg-white/70 p-4 sm:p-5 shadow-2xs backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] space-y-4"
    >
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-black/6 dark:border-white/6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
            <FileText className="size-5 text-zinc-900 dark:text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14.5px] font-semibold text-black dark:text-white">
                Study Journal & Reflections
              </h3>
              <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-medium text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                {sessionNotes.length}{" "}
                {sessionNotes.length === 1 ? "reflection" : "reflections"}
              </span>
            </div>
            <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
              Reflections for {activeSession.title} ({activeSession.totalCount}{" "}
              chapters)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenCreateModal}
            data-testid="add-plan-note-button"
            className="ui-btn-primary ui-btn-sm gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Note</span>
          </button>

          <Link
            href={`/notes?planId=${instanceId}&session=${activeSession.sessionIndex}`}
            data-testid="open-full-journal-link"
            className="ui-btn-secondary ui-btn-icon size-9 shrink-0 rounded-xl cursor-pointer"
            title="Open in full notes studio"
            aria-label="Open in full notes studio"
          >
            <ExternalLink className="size-4 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Notes List / Empty State */}
      {sessionNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sessionNotes.map((note) => {
            return (
              <div
                key={note.id}
                data-testid={`plan-note-card-${note.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/6 bg-white/80 p-3.5 shadow-2xs transition-all hover:border-black/15 hover:shadow-xs dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-white/20"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400">
                      <Calendar className="size-3" />
                      <span>{formatDisplayDate(note.createdAt)}</span>
                      {note.planSessionId && (
                        <span className="rounded-md bg-black/5 px-1.5 py-0.2 text-[9.5px] text-neutral-600 dark:bg-white/10 dark:text-neutral-300">
                          Day {note.planSessionId}
                        </span>
                      )}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(note)}
                        className="rounded-lg p-1 text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                        title="Edit reflection"
                        aria-label="Edit reflection"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <Link
                        href={`/notes?noteId=${note.id}`}
                        className="rounded-lg p-1 text-neutral-500 hover:bg-black/5 hover:text-black dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white"
                        title="Open in studio"
                        aria-label="Open in studio"
                      >
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>

                  <h4
                    onClick={() => handleOpenEditModal(note)}
                    className="mt-1.5 cursor-pointer text-[13.5px] font-semibold text-black transition-colors group-hover:text-zinc-600 dark:text-white dark:group-hover:text-zinc-300 line-clamp-1"
                  >
                    {note.title}
                  </h4>

                  <p
                    onClick={() => handleOpenEditModal(note)}
                    className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400 line-clamp-2 cursor-pointer"
                  >
                    {note.plainTextSnippet || "No preview text recorded."}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/4 dark:border-white/4 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <span>Session reflection</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(note)}
                    className="font-medium text-black dark:text-white hover:underline cursor-pointer"
                  >
                    Read & Edit →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 py-7 px-4 text-center dark:border-white/10">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
            <BookOpen className="size-5 text-zinc-900 dark:text-white" />
          </div>
          <h4 className="mt-3 text-[14px] font-semibold text-black dark:text-white">
            No reflections recorded for {activeSession.title}
          </h4>
          <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Record what God speaks to you, key passages, or prayer requests as
            you complete your daily reading.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="ui-btn-primary ui-btn-sm mt-3.5 gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Write Note for {activeSession.title}</span>
          </button>
        </div>
      )}

      {/* Dedicated Portal Modal */}
      <PlanNoteModal
        isOpen={isModalOpen}
        instanceId={instanceId}
        planTitle={planTitle}
        sessionIndex={activeSession.sessionIndex}
        sessionTitle={activeSession.title}
        noteToEdit={noteToEdit}
        onCloseAction={() => setIsModalOpen(false)}
        onNoteSavedAction={(savedNote) => {
          if (noteToEdit) {
            onNoteUpdatedAction(savedNote);
          } else {
            onNoteCreatedAction(savedNote);
          }
        }}
        onNoteDeletedAction={onNoteDeletedAction}
      />
    </div>
  );
}
