"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Plus,
  ExternalLink,
  Edit3,
  Calendar,
  BookOpen,
  Globe,
  Lock,
  Users,
  MessageSquare,
} from "lucide-react";
import type { PlanSessionDetail, PlanNoteDetail } from "@/actions/plans";
import {
  shareNoteWithCommunityAction,
  getGroupSessionNotesAction,
  type GroupSessionNote,
} from "@/actions/groups";
import { PlanNoteModal } from "./plan-note-modal";

export type PlanSessionNotesProps = {
  instanceId: string;
  planTitle: string;
  activeSession: PlanSessionDetail;
  groupPlanId?: string;
  communityName?: string;
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
  groupPlanId,
  communityName,
  notes,
  onNoteCreatedAction,
  onNoteUpdatedAction,
  onNoteDeletedAction,
}: PlanSessionNotesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<PlanNoteDetail | null>(null);
  const [activeNotesTab, setActiveNotesTab] = useState<"personal" | "fellowship">(
    "personal"
  );
  const [peerNotes, setPeerNotes] = useState<ReadonlyArray<GroupSessionNote>>([]);
  const [isLoadingPeers, setIsLoadingPeers] = useState(false);
  const [togglingNoteId, setTogglingNoteId] = useState<string | null>(null);

  const sessionNotes = notes.filter(
    (n) => n.planSessionId === activeSession.sessionIndex
  );

  // Load cohort reflections when fellowship tab is active or groupPlanId exists
  useEffect(() => {
    let isCancelled = false;
    if (groupPlanId) {
      setIsLoadingPeers(true);
      getGroupSessionNotesAction({
        groupPlanId,
        sessionIndex: activeSession.sessionIndex,
      })
        .then((res) => {
          if (!isCancelled && res.success && res.notes) {
            setPeerNotes(res.notes);
          }
        })
        .finally(() => {
          if (!isCancelled) setIsLoadingPeers(false);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [groupPlanId, activeSession.sessionIndex]);

  const handleOpenCreateModal = () => {
    setNoteToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: PlanNoteDetail) => {
    setNoteToEdit(note);
    setIsModalOpen(true);
  };

  async function handleToggleShare(note: PlanNoteDetail) {
    const nextVal = !note.isSharedWithCommunity;
    setTogglingNoteId(note.id);
    try {
      const res = await shareNoteWithCommunityAction({
        noteId: note.id,
        isSharedWithCommunity: nextVal,
      });
      if (res.success) {
        onNoteUpdatedAction({
          ...note,
          isSharedWithCommunity: nextVal,
        });
      }
    } finally {
      setTogglingNoteId(null);
    }
  }

  return (
    <div
      data-testid="plan-session-notes-section"
      className="space-y-4"
    >
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-elevated text-foreground">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[14.5px] font-semibold text-foreground">
                Study Journal & Reflections
              </h3>
              {communityName && (
                <span className="rounded-md bg-surface-elevated px-2 py-0.5 text-[10.5px] font-medium text-foreground-secondary border border-border">
                  {communityName}
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-foreground-dim">
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
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-[10px] bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Add Note</span>
          </button>

          <Link
            href={`/notes?planId=${instanceId}&session=${activeSession.sessionIndex}`}
            data-testid="open-full-journal-link"
            className="flex size-8 items-center justify-center rounded-xl border border-border bg-surface text-foreground-dim hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            title="Open in full notes studio"
            aria-label="Open in full notes studio"
          >
            <ExternalLink className="size-3.5 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Sub-tab switcher if enrolled in a community fellowship */}
      {groupPlanId && (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-elevated p-1 w-fit">
          <button
            type="button"
            onClick={() => setActiveNotesTab("personal")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeNotesTab === "personal"
                ? "bg-surface text-foreground shadow-xs font-semibold border border-border"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <span>My Reflections ({sessionNotes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNotesTab("fellowship")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              activeNotesTab === "fellowship"
                ? "bg-surface text-foreground shadow-xs font-semibold border border-border"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Users className="size-3" />
            <span>Fellowship Peers ({peerNotes.length})</span>
          </button>
        </div>
      )}

      {/* View: Personal Notes */}
      {activeNotesTab === "personal" && (
        <>
          {sessionNotes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessionNotes.map((note) => {
                const isToggling = togglingNoteId === note.id;

                return (
                  <div
                    key={note.id}
                    data-testid={`plan-note-card-${note.id}`}
                    className="ui-card-elevated group relative flex flex-col justify-between p-4 transition-all hover:border-border"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-foreground-dim">
                          <Calendar className="size-3" />
                          <span>{formatDisplayDate(note.createdAt)}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Share with Fellowship Toggle (Only if community plan) */}
                          {groupPlanId && (
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleToggleShare(note)}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border transition-colors cursor-pointer ${
                                note.isSharedWithCommunity
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-surface text-foreground-dim border-border hover:text-foreground hover:bg-surface-elevated"
                              }`}
                              title={
                                note.isSharedWithCommunity
                                  ? "Shared with your fellowship"
                                  : "Private note. Click to share with fellowship"
                              }
                            >
                              {note.isSharedWithCommunity ? (
                                <>
                                  <Globe className="size-2.5" />
                                  <span>Shared</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="size-2.5" />
                                  <span>Private</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(note)}
                            className="rounded-lg p-1 text-foreground-dim hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
                            title="Edit reflection"
                            aria-label="Edit reflection"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4
                        onClick={() => handleOpenEditModal(note)}
                        className="mt-2 cursor-pointer text-sm font-semibold text-foreground transition-colors line-clamp-1"
                      >
                        {note.title}
                      </h4>

                      <p
                        onClick={() => handleOpenEditModal(note)}
                        className="mt-1 text-xs leading-relaxed text-foreground-secondary line-clamp-2 cursor-pointer"
                      >
                        {note.plainTextSnippet || "No preview text recorded."}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-foreground-dim">
                      <span>Session reflection</span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(note)}
                        className="font-medium text-foreground hover:underline cursor-pointer"
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-8 px-4 text-center bg-surface-elevated/30">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-surface text-foreground">
                <BookOpen className="size-5" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-foreground">
                No reflections recorded for {activeSession.title}
              </h4>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-foreground-dim">
                Record what God speaks to you, key passages, or prayer requests as you complete your daily reading.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-[10px] bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer shadow-xs mt-3.5"
              >
                <Plus className="size-3.5" />
                <span>Write Note for {activeSession.title}</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* View: Fellowship Reflections from Peers */}
      {activeNotesTab === "fellowship" && (
        <div className="space-y-3">
          {isLoadingPeers ? (
            <div className="rounded-2xl border border-border bg-surface-elevated/40 p-8 text-center text-xs text-foreground-dim">
              Loading fellowship reflections...
            </div>
          ) : peerNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface-elevated/30 p-8 text-center space-y-2">
              <MessageSquare className="size-6 text-foreground-dim mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">
                No peers have shared reflections for Day {activeSession.sessionIndex} yet
              </h4>
              <p className="text-[11px] text-foreground-dim max-w-xs mx-auto">
                Be the first to share your takeaways with the fellowship! Write a reflection and toggle &quot;Shared&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {peerNotes.map((peerNote) => {
                const initials = peerNote.userName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={peerNote.id}
                    className="ui-card-elevated p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-[11px] font-semibold text-foreground overflow-hidden">
                        {peerNote.userAvatar ? (
                          <Image
                            src={peerNote.userAvatar}
                            alt={peerNote.userName}
                            width={28}
                            height={28}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-xs font-semibold text-foreground">
                          {peerNote.userName}
                        </span>
                        <span className="text-[10px] text-foreground-dim">
                          {formatDisplayDate(peerNote.updatedAt.toString())}
                        </span>
                      </div>
                    </div>

                    <h5 className="text-xs font-semibold text-foreground line-clamp-1 pt-1">
                      {peerNote.title}
                    </h5>
                    <p className="text-xs leading-relaxed text-foreground-secondary line-clamp-3">
                      {peerNote.plainTextSnippet || "Shared reflection."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
