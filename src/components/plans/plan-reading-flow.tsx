"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Check,
  FileText,
  Plus,
  CheckCircle2,
  Lock,
} from "lucide-react";
import type { PlanSessionDetail, PlanPartDetail } from "@/actions/plans";

type PlanReadingFlowProps = {
  instanceId: string;
  sessions: ReadonlyArray<PlanSessionDetail>;
  parts: ReadonlyArray<PlanPartDetail>;
  activePartIndex: number;
  activeSessionIndex: number;
  onSelectPartAction: (partIndex: number) => void;
  onSelectSessionAction: (sessionIndex: number) => void;
  onToggleReadingAction: (readingItemId: string) => void;
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
  sessions,
  parts,
  activePartIndex,
  activeSessionIndex,
  onSelectPartAction,
  onSelectSessionAction,
  onToggleReadingAction,
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
        <h2 className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-black dark:text-white">
          Reading Flow
        </h2>
        <p className="mt-0.5 text-[12px] text-[#777777] dark:text-[#9CA3AF]">
          Swipe horizontally to browse each session
        </p>
      </div>

      {/* Part Navigation Pill */}
      {parts.length > 0 && currentPart && (
        <div className="flex items-center justify-between rounded-2xl border border-black/6 bg-white/70 p-2.5 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/[0.04]">
          <button
            type="button"
            onClick={handlePrevPart}
            disabled={activePartIndex <= 1}
            aria-label="Previous Part"
            className="flex size-8 items-center justify-center rounded-full border border-black/8 bg-black/4 text-black transition-colors hover:bg-black/8 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-black dark:text-white">
                {currentPart.title}
              </span>
              <span className="rounded-full bg-black/6 px-2 py-0.5 text-[10.5px] font-medium text-[#555555] dark:bg-white/10 dark:text-[#D4D4D4]">
                {currentPart.completedSessions}/{currentPart.totalSessions} Done
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#777777] dark:text-[#9CA3AF]">
              {currentPart.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextPart}
            disabled={activePartIndex >= parts.length}
            aria-label="Next Part"
            className="flex size-8 items-center justify-center rounded-full border border-black/8 bg-black/4 text-black transition-colors hover:bg-black/8 disabled:opacity-30 disabled:cursor-not-allowed dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
          >
            <ChevronRight className="size-4" />
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
              className={`w-[195px] sm:w-[220px] shrink-0 cursor-pointer snap-start rounded-[18px] border p-3 sm:p-3.5 transition-all ${
                isSelected
                  ? "border-black/90 bg-white shadow-md dark:border-white dark:bg-white/[0.08]"
                  : "border-black/6 bg-white/60 hover:border-black/20 hover:bg-white/80 dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-white/16 dark:hover:bg-white/[0.05]"
              }`}
            >
              {/* Session Card Header */}
              <div className="flex items-center justify-between border-b border-black/6 pb-2.5 dark:border-white/6">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-black dark:text-white">
                      {session.title}
                    </span>
                    {isLocked && (
                      <Lock
                        className="size-3 text-[#888888] dark:text-[#71717A]"
                        aria-label="Session locked"
                      />
                    )}
                  </div>
                  {session.dateLabel && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#888888] dark:text-[#A1A1AA]">
                        {session.dateLabel}
                      </span>
                      {session.isPastDue && (
                        <span className="rounded bg-red-500/15 px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                          Overdue
                        </span>
                      )}
                      {session.isToday && (
                        <span className="rounded bg-[#82ADD4]/20 px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-[#507ea6] dark:text-[#82ADD4]">
                          Today
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {isSelected && !isLocked && (
                    <MapPin className="size-3 text-[#82ADD4]" />
                  )}
                  {session.isCompleted ? (
                    <CheckCircle2
                      className="size-3.5 text-black dark:text-white"
                      aria-label="Completed"
                    />
                  ) : (
                    <span className="text-[11.5px] font-medium text-[#777777] dark:text-[#A1A1AA]">
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
                          className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#888888] dark:bg-white/8 dark:text-[#71717A]"
                          aria-label="Locked"
                        >
                          <Lock className="size-2.5" />
                        </div>

                        {/* Reading Title */}
                        <span className="truncate text-[12px] font-medium text-[#777777] dark:text-[#9CA3AF]">
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
                      className="group flex items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-black/3 cursor-pointer dark:hover:bg-white/5"
                    >
                      {/* Circular Checkbox */}
                      <div
                        className={`flex size-4.5 shrink-0 items-center justify-center rounded-full transition-all ${
                          reading.isCompleted
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "border border-black/25 bg-transparent group-hover:border-black/50 dark:border-white/25 dark:group-hover:border-white/50"
                        }`}
                      >
                        {reading.isCompleted && (
                          <Check className="size-2.5" strokeWidth={3} />
                        )}
                      </div>

                      {/* Reading Title */}
                      <span
                        className={`truncate text-[12px] font-medium transition-colors ${
                          reading.isCompleted
                            ? "text-[#888888] line-through dark:text-[#71717A]"
                            : "text-black dark:text-white"
                        }`}
                      >
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
        <div className="flex items-center justify-between rounded-2xl border border-black/6 bg-white/70 p-3.5 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
              <FileText className="size-4.5" />
            </div>
            <div>
              <h3 className="text-[13.5px] font-semibold text-black dark:text-white">
                {activeSession.title} Notes
              </h3>
              <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                {activeSession.totalCount} Chapters •{" "}
                {activeSession.completedCount}/{activeSession.totalCount} read
              </p>
            </div>
          </div>

          <Link
            href={`/notes?planId=${instanceId}&session=${activeSession.sessionIndex}`}
            className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-[11.5px] font-medium text-black shadow-2xs transition-all hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            <Plus className="size-3.5" />
            <span>Add Note</span>
          </Link>
        </div>
      )}
    </div>
  );
}
