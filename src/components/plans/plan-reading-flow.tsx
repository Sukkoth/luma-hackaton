"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type {
  PlanSessionDetail,
  PlanPartDetail,
  PlanNoteDetail,
} from "@/actions/plans";
import { PlanSessionNotes } from "./plan-session-notes";

type PlanReadingFlowProps = {
  instanceId: string;
  planTitle: string;
  sessions: ReadonlyArray<PlanSessionDetail>;
  parts: ReadonlyArray<PlanPartDetail>;
  notes: ReadonlyArray<PlanNoteDetail>;
  activePartIndex: number;
  activeSessionIndex: number;
  onSelectPartAction: (partIndex: number) => void;
  onSelectSessionAction: (sessionIndex: number) => void;
  onToggleReadingAction: (readingItemId: string) => void;
  onNoteCreatedAction: (note: PlanNoteDetail) => void;
  onNoteUpdatedAction: (note: PlanNoteDetail) => void;
  onNoteDeletedAction: (noteId: string) => void;
  mode?: "scheduled" | "flexible";
};

type IsSessionLockedParams = {
  sessionIndex: number;
  allSessions: ReadonlyArray<PlanSessionDetail>;
  mode?: "scheduled" | "flexible";
};

function isSessionLocked({
  sessionIndex,
  allSessions,
  mode,
}: IsSessionLockedParams): boolean {
  if (mode !== "scheduled") return false;
  if (sessionIndex <= 1) return false;

  // In scheduled time pacing, a session is locked if any previous session is not fully complete
  for (let i = 0; i < sessionIndex - 1; i++) {
    const prev = allSessions[i];
    if (prev && !prev.isCompleted) {
      return true;
    }
  }
  return false;
}

export function PlanReadingFlow({
  instanceId,
  planTitle,
  sessions,
  parts,
  notes,
  activePartIndex,
  activeSessionIndex,
  onSelectPartAction,
  onSelectSessionAction,
  onToggleReadingAction,
  onNoteCreatedAction,
  onNoteUpdatedAction,
  onNoteDeletedAction,
  mode,
}: PlanReadingFlowProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const currentPart =
    parts.find((p) => p.partIndex === activePartIndex) || parts[0];

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

  const handlePrevPart = () => {
    if (activePartIndex > 1) {
      const nextPartIdx = activePartIndex - 1;
      onSelectPartAction(nextPartIdx);
      const prevPart = parts.find((p) => p.partIndex === nextPartIdx);
      if (prevPart) {
        onSelectSessionAction(prevPart.startSessionIndex);
      }
    }
  };

  const handleNextPart = () => {
    if (activePartIndex < parts.length) {
      const nextPartIdx = activePartIndex + 1;
      onSelectPartAction(nextPartIdx);
      const nextPart = parts.find((p) => p.partIndex === nextPartIdx);
      if (nextPart) {
        onSelectSessionAction(nextPart.startSessionIndex);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-foreground">
          Reading Flow
        </h2>
        <p className="mt-0.5 text-[12px] text-foreground-secondary">
          Select a session to view and track chapters
        </p>
      </div>

      {/* Part Navigation Pill */}
      {parts.length > 0 && currentPart && (
        <div className="ui-card flex items-center justify-between p-2.5">
          <button
            type="button"
            onClick={handlePrevPart}
            disabled={activePartIndex <= 1}
            aria-label="Previous Part"
            className="ui-btn-secondary ui-btn-icon size-8 shrink-0 rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4 shrink-0" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2">
              <span className="text-[13.5px] font-bold text-foreground">
                {currentPart.title}
              </span>
              <span className="ui-pill text-[10px]">
                {currentPart.completedSessions}/{currentPart.totalSessions} Done
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-foreground-dim">
              {currentPart.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextPart}
            disabled={activePartIndex >= parts.length}
            aria-label="Next Part"
            className="ui-btn-secondary ui-btn-icon size-8 shrink-0 rounded-full cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Compact Horizontal Sessions Carousel */}
      <div
        ref={carouselRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
      >
        {partSessions.map((session) => {
          const isSelected = session.sessionIndex === activeSessionIndex;
          const isLocked = isSessionLocked({
            sessionIndex: session.sessionIndex,
            allSessions: sessions,
            mode,
          });

          return (
            <div
              key={session.sessionIndex}
              onClick={() => onSelectSessionAction(session.sessionIndex)}
              className={`w-[195px] sm:w-[220px] shrink-0 cursor-pointer snap-start rounded-[16px] border bg-surface p-3 sm:p-3.5 transition-all ${
                isSelected
                  ? "border-primary shadow-xs"
                  : "border-border hover:border-border-strong"
              }`}
            >
              {/* Session Card Header */}
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">
                      {session.title}
                    </span>
                    {isLocked && (
                      <Lock
                        className="size-3 text-foreground-dim"
                        aria-label="Session locked"
                      />
                    )}
                  </div>
                  {session.dateLabel && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-foreground-dim">
                        {session.dateLabel}
                      </span>
                      {session.isPastDue && (
                        <span className="rounded bg-destructive/15 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-destructive">
                          Overdue
                        </span>
                      )}
                      {session.isToday && (
                        <span className="ui-pill text-[9px] uppercase tracking-wider">
                          Today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected && !isLocked && (
                    <MapPin className="size-3 text-primary" />
                  )}
                  {session.isCompleted ? (
                    <CheckCircle2
                      className="size-3.5 text-primary"
                      aria-label="Completed"
                    />
                  ) : (
                    <span className="text-[11.5px] font-medium text-foreground-secondary">
                      {session.completedCount}/{session.totalCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Session Readings List */}
              <div className="mt-2.5 space-y-1.5">
                {session.readings.map((reading) => {
                  if (isLocked) {
                    return (
                      <div
                        key={reading.id}
                        data-testid="locked-reading-item"
                        className="flex items-center gap-2 rounded-lg px-1 py-1 select-none opacity-50 cursor-not-allowed"
                        title="Complete previous sessions to unlock"
                      >
                        {/* Lock Icon replacing checkbox */}
                        <div
                          className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-dim"
                          aria-label="Locked"
                        >
                          <Lock className="size-2.5" />
                        </div>

                        {/* Reading Title */}
                        <span className="truncate text-[12px] font-medium text-foreground-dim">
                          {reading.displayText ||
                            `${reading.bookName} ${reading.chapter}`}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={reading.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleReadingAction(reading.id);
                      }}
                      role="button"
                      aria-label={`Toggle reading ${reading.displayText || `${reading.bookName} ${reading.chapter}`}`}
                      aria-pressed={reading.isCompleted}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggleReadingAction(reading.id);
                        }
                      }}
                      className="group flex items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-elevated/70 cursor-pointer"
                    >
                      {/* Circular Checkbox */}
                      <div
                        className={`flex size-4.5 shrink-0 items-center justify-center rounded-full transition-all ${
                          reading.isCompleted
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "border border-border bg-transparent group-hover:border-border-strong"
                        }`}
                      >
                        {reading.isCompleted && (
                          <Check className="size-2.5" strokeWidth={3} />
                        )}
                      </div>

                      {/* Reading Title */}
                      <span className="truncate text-[12px] font-medium text-foreground transition-colors">
                        {reading.displayText ||
                          `${reading.bookName} ${reading.chapter}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Session Notes Section */}
      {activeSession && (
        <PlanSessionNotes
          instanceId={instanceId}
          planTitle={planTitle}
          activeSession={activeSession}
          notes={notes}
          onNoteCreatedAction={onNoteCreatedAction}
          onNoteUpdatedAction={onNoteUpdatedAction}
          onNoteDeletedAction={onNoteDeletedAction}
        />
      )}
    </div>
  );
}
