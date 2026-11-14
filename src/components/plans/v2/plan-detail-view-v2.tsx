"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  Plus,
  BookOpen,
  MapPin,
  FileText,
  Sliders,
} from "lucide-react";
import {
  type PlanInstanceDetail,
  type PlanSessionDetail,
  type PlanNoteDetail,
  togglePlanReadingItemAction,
  catchUpShiftAction,
  catchUpIncreasePaceAction,
} from "@/actions/plans";
import { PlanBibleReaderModal } from "../plan-bible-reader-modal";
import { PlanSessionNotes } from "../plan-session-notes";
import { PlanSettingsTab } from "../plan-settings-tab";
import { celebratePlanCompletion } from "@/lib/confetti";

type PlanDetailViewV2Props = {
  plan: PlanInstanceDetail;
};

export function PlanDetailViewV2({ plan }: PlanDetailViewV2Props) {
  const [, startTransition] = useTransition();

  // Active top tab switcher: "chapters" vs "settings"
  const [activeTab, setActiveTab] = useState<"chapters" | "settings">("chapters");

  // Core plan state
  const [currentPlan, setCurrentPlan] = useState<PlanInstanceDetail>(plan);
  const [sessions, setSessions] = useState<ReadonlyArray<PlanSessionDetail>>(
    plan.sessions
  );
  const [completedChapters, setCompletedChapters] = useState(
    plan.completedChapters
  );
  const [progressPercent, setProgressPercent] = useState(plan.progressPercent);
  const [notes, setNotes] = useState<ReadonlyArray<PlanNoteDetail>>(plan.notes);

  // Active Part & Session navigation
  const [activePartIndex, setActivePartIndex] = useState(1);
  const [activeSessionIndex, setActiveSessionIndex] = useState(1);

  // Bible Reader Modal State
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [activeReadingId, setActiveReadingId] = useState<string | null>(null);

  // Current Part and its Sessions
  const currentPart =
    currentPlan.parts.find((p) => p.partIndex === activePartIndex) ||
    currentPlan.parts[0];

  const partSessions = currentPart
    ? sessions.slice(
        currentPart.startSessionIndex - 1,
        currentPart.endSessionIndex
      )
    : sessions;

  const activeSession =
    sessions.find((s) => s.sessionIndex === activeSessionIndex) ||
    partSessions[0] ||
    sessions[0];

  // Arc Gauge Math (matching the screenshot's prominent semi-circle arc)
  const ARC_LENGTH = 494.28;
  const clampedPercent = Math.min(100, Math.max(0, progressPercent));
  const strokeDashoffset = ARC_LENGTH - (ARC_LENGTH * clampedPercent) / 100;
  const remainingChapters = Math.max(0, currentPlan.totalChapters - completedChapters);

  // Part navigation
  const handlePrevPart = () => {
    if (activePartIndex > 1) {
      const nextIdx = activePartIndex - 1;
      setActivePartIndex(nextIdx);
      const prevPart = currentPlan.parts.find((p) => p.partIndex === nextIdx);
      if (prevPart) {
        setActiveSessionIndex(prevPart.startSessionIndex);
      }
    }
  };

  const handleNextPart = () => {
    if (activePartIndex < currentPlan.parts.length) {
      const nextIdx = activePartIndex + 1;
      setActivePartIndex(nextIdx);
      const nextPart = currentPlan.parts.find((p) => p.partIndex === nextIdx);
      if (nextPart) {
        setActiveSessionIndex(nextPart.startSessionIndex);
      }
    }
  };

  // Toggle chapter reading completion
  const handleToggleReading = (readingItemId: string) => {
    let delta = 0;
    const nextSessions = sessions.map((session) => {
      const hasItem = session.readings.some((r) => r.id === readingItemId);
      if (!hasItem) return session;

      const updatedReadings = session.readings.map((r) => {
        if (r.id === readingItemId) {
          const nextVal = !r.isCompleted;
          delta = nextVal ? 1 : -1;
          return { ...r, isCompleted: nextVal };
        }
        return r;
      });

      const compCount = updatedReadings.filter((r) => r.isCompleted).length;
      return {
        ...session,
        readings: updatedReadings,
        completedCount: compCount,
        isCompleted: compCount === updatedReadings.length,
      };
    });

    const newCompletedCount = Math.max(
      0,
      Math.min(currentPlan.totalChapters, completedChapters + delta)
    );
    const newPercent = Math.round(
      (newCompletedCount / Math.max(1, currentPlan.totalChapters)) * 100
    );

    setSessions(nextSessions);
    setCompletedChapters(newCompletedCount);
    setProgressPercent(newPercent);

    if (newPercent === 100 && progressPercent < 100) {
      celebratePlanCompletion();
    }

    startTransition(async () => {
      await togglePlanReadingItemAction({
        instanceId: currentPlan.id,
        readingItemId,
      });
    });
  };

  const handleOpenReaderForReading = (readingId: string) => {
    setActiveReadingId(readingId);
    setIsReaderOpen(true);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* =========================================================================
          1. TITLE HEADER
          ========================================================================= */}
      <div className="flex items-center gap-3">
        <Link
          href="/plans"
          className="flex size-9 sm:size-10 items-center justify-center rounded-xl border border-border/70 bg-surface text-foreground-muted hover:text-foreground hover:border-border transition-colors shadow-2xs"
          aria-label="Back to all plans"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {currentPlan.title}
          </h1>
          <p className="text-xs text-foreground-dim mt-0.5">
            Tracker: {currentPlan.tracker.name}
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. SEGMENTED TAB SWITCHER: [Plan Chapters] | [Pacing & Settings]
          ========================================================================= */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-surface-elevated/80 p-1 border border-border/60 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
              activeTab === "chapters"
                ? "bg-foreground text-background shadow-xs"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>Plan Chapters</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 rounded-lg px-5 py-2 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-foreground text-background shadow-xs"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Sliders className="size-3.5" />
            <span>Pacing &amp; Settings</span>
          </button>
        </div>
      </div>

      {/* When Settings Tab is Active */}
      {activeTab === "settings" && (
        <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-2xs">
          <PlanSettingsTab
            plan={currentPlan}
            onPlanUpdatedAction={(updated) => {
              setCurrentPlan(updated);
              setSessions(updated.sessions);
              setCompletedChapters(updated.completedChapters);
              setProgressPercent(updated.progressPercent);
              setNotes(updated.notes);
            }}
          />
        </section>
      )}

      {/* When Chapters Tab is Active */}
      {activeTab === "chapters" && (
        <>
          {/* =========================================================================
              3. BIG PROGRESS ARCH CARD (EXACTLY LIKE THE REFERENCE SCREENSHOT)
              ========================================================================= */}
          <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-2xs">
            {/* Center Speedometer Arch */}
            <div className="relative flex flex-col items-center justify-center pt-2 pb-4">
              <div className="relative w-[240px] sm:w-[260px]">
                <svg
                  viewBox="0 0 320 220"
                  className="w-full overflow-visible"
                  aria-hidden="true"
                >
                  {/* Background Arc Track */}
                  <path
                    d="M 57.8 195 A 118 118 0 1 1 262.2 195"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeLinecap="round"
                    className="text-border/60"
                  />

                  {/* Foreground Filled Progress Arc */}
                  {clampedPercent > 0 && (
                    <path
                      d="M 57.8 195 A 118 118 0 1 1 262.2 195"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={ARC_LENGTH}
                      strokeDashoffset={strokeDashoffset}
                      className="text-foreground transition-all duration-700 ease-out"
                    />
                  )}
                </svg>

                {/* Inner Center Metrics */}
                <div className="absolute inset-x-0 top-[35px] bottom-[15px] flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
                    Journey
                  </span>
                  <span className="text-[44px] sm:text-[48px] font-extrabold leading-none tracking-tight text-foreground mt-0.5">
                    {clampedPercent}%
                  </span>
                  <span className="text-xs font-semibold text-foreground-muted mt-1">
                    {completedChapters} / {currentPlan.totalChapters} chapters
                  </span>
                  <span className="mt-2 inline-flex items-center rounded-md bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground-dim border border-border/40">
                    {currentPlan.mode === "scheduled" ? "Active Schedule" : "Self-Paced"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom 3-Column Metrics Row */}
            <div className="mx-auto max-w-lg mt-4 pt-6 border-t border-border/40 grid grid-cols-3 divide-x divide-border/40 text-center">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
                  Mode
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground capitalize">
                  {currentPlan.mode}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
                  Completed
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {completedChapters} / {currentPlan.totalChapters}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-foreground-dim">
                  Remaining
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {remainingChapters} Ch
                </span>
              </div>
            </div>
          </section>

          {/* =========================================================================
              4. READING FLOW SECTION
              ========================================================================= */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Reading Flow
              </h2>
              <p className="text-xs text-foreground-dim mt-0.5">
                Swipe horizontally to browse each session
              </p>
            </div>

            {/* Part / Week Toggler Bar */}
            {currentPlan.parts.length > 0 && currentPart && (
              <div className="rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 flex items-center justify-between shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevPart}
                  disabled={activePartIndex <= 1}
                  aria-label="Previous Part"
                  className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-surface text-foreground hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="text-center">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {currentPart.title}
                    </span>
                    <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[10.5px] font-semibold text-foreground-muted border border-border/60">
                      {currentPart.completedSessions}/{currentPart.totalSessions} Done
                    </span>
                  </div>
                  {currentPart.subtitle && (
                    <p className="text-[11px] text-foreground-dim mt-0.5">
                      {currentPart.subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextPart}
                  disabled={activePartIndex >= currentPlan.parts.length}
                  aria-label="Next Part"
                  className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-surface text-foreground hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}

            {/* Horizontally Scrollable Session Cards Rail */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {partSessions.map((session) => {
                const isSelected = session.sessionIndex === activeSessionIndex;

                return (
                  <div
                    key={session.sessionIndex}
                    onClick={() => setActiveSessionIndex(session.sessionIndex)}
                    className={`w-[210px] sm:w-[230px] shrink-0 cursor-pointer snap-start rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 select-none ${
                      isSelected
                        ? "border-foreground bg-surface shadow-sm ring-1 ring-foreground"
                        : "border-border/80 bg-surface hover:border-border-strong"
                    }`}
                  >
                    {/* Session Card Header */}
                    <div className="flex items-start justify-between pb-2 border-b border-border/40 mb-2">
                      <div>
                        <span className="text-[13px] font-bold text-foreground block">
                          {session.title}
                        </span>
                        {session.dateLabel && (
                          <span className="text-[10.5px] text-foreground-dim font-medium">
                            {session.dateLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isSelected && (
                          <MapPin className="size-3 text-foreground-dim" />
                        )}
                        {session.isCompleted && (
                          <Check className="size-3.5 stroke-[2.5] text-foreground-dim" />
                        )}
                      </div>
                    </div>

                    {/* Readings List inside Card */}
                    <div className="space-y-1.5 min-h-[44px]">
                      {session.readings.map((reading) => (
                        <div
                          key={reading.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReading(reading.id);
                            }}
                            className={`flex size-4.5 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer ${
                              reading.isCompleted
                                ? "bg-foreground text-background"
                                : "border border-border/80 hover:border-foreground"
                            }`}
                            aria-label={`Mark ${reading.displayText || reading.bookName} as ${reading.isCompleted ? "unread" : "read"}`}
                          >
                            {reading.isCompleted && (
                              <Check className="size-3 stroke-[3]" />
                            )}
                          </button>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReaderForReading(reading.id);
                            }}
                            className={`truncate hover:underline cursor-pointer ${
                              reading.isCompleted
                                ? "text-foreground-muted line-through"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {reading.displayText || `${reading.bookName} ${reading.chapter}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              5. STUDY JOURNAL & REFLECTIONS (LOCATED BELOW SESSIONS)
              ========================================================================= */}
          <section className="pt-2">
            <PlanSessionNotes
              instanceId={currentPlan.id}
              planTitle={currentPlan.title}
              activeSession={activeSession}
              notes={notes}
              onNoteCreatedAction={(newNote) => {
                setNotes((prev) => [newNote, ...prev]);
                setCurrentPlan((prev) => ({
                  ...prev,
                  notesCount: prev.notesCount + 1,
                  notes: [newNote, ...prev.notes],
                }));
              }}
              onNoteUpdatedAction={(updatedNote) => {
                setNotes((prev) =>
                  prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
                );
                setCurrentPlan((prev) => ({
                  ...prev,
                  notes: prev.notes.map((n) =>
                    n.id === updatedNote.id ? updatedNote : n
                  ),
                }));
              }}
              onNoteDeletedAction={(noteId) => {
                setNotes((prev) => prev.filter((n) => n.id !== noteId));
                setCurrentPlan((prev) => ({
                  ...prev,
                  notesCount: Math.max(0, prev.notesCount - 1),
                  notes: prev.notes.filter((n) => n.id !== noteId),
                }));
              }}
            />
          </section>
        </>
      )}

      {/* =========================================================================
          6. MODALS
          ========================================================================= */}
      {isReaderOpen && (
        <PlanBibleReaderModal
          isOpen={isReaderOpen}
          onCloseAction={() => setIsReaderOpen(false)}
          allSessions={sessions}
          currentReadingId={activeReadingId}
          onSelectReadingAction={(id) => setActiveReadingId(id)}
          onToggleReadingAction={handleToggleReading}
        />
      )}
    </div>
  );
}
