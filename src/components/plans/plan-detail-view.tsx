"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  MapPin,
  Sliders,
  AlertCircle,
  Zap,
  Users,
  ArrowRight,
  Calendar,
  Lock,
} from "lucide-react";
import {
  type PlanInstanceDetail,
  type PlanSessionDetail,
  type PlanNoteDetail,
  togglePlanReadingItemAction,
  resumePlanAction,
  catchUpShiftAction,
  catchUpIncreasePaceAction,
} from "@/actions/plans";
import { PlanSessionNotes } from "./plan-session-notes";
import { TabsBar } from "@/components/ui/tabs-bar";
import { PlanSettingsTab } from "./plan-settings-tab";
import { PlanCatchUpModal } from "./plan-catchup-modal";
import { PlanPausedLockModal } from "./plan-paused-lock-modal";
import { celebratePlanCompletion } from "@/lib/confetti";
import { RechartsPlanGauge } from "./recharts-plan-gauge";

type PlanDetailViewProps = {
  plan: PlanInstanceDetail;
};

export function PlanDetailView({ plan }: PlanDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active top tab switcher: "chapters" vs "settings"
  const [activeTab, setActiveTab] = useState<"chapters" | "settings">("chapters");

  // Core plan state
  const [prevPlan, setPrevPlan] = useState<PlanInstanceDetail>(plan);
  const [currentPlan, setCurrentPlan] = useState<PlanInstanceDetail>(plan);
  const [sessions, setSessions] = useState<ReadonlyArray<PlanSessionDetail>>(
    plan.sessions
  );
  const [completedChapters, setCompletedChapters] = useState(
    plan.completedChapters
  );
  const [progressPercent, setProgressPercent] = useState(plan.progressPercent);
  const [notes, setNotes] = useState<ReadonlyArray<PlanNoteDetail>>(plan.notes);

  // Synchronize internal state whenever server plan prop updates without remounting
  if (plan !== prevPlan) {
    setPrevPlan(plan);
    setCurrentPlan(plan);
    setSessions(plan.sessions);
    setCompletedChapters(plan.completedChapters);
    setProgressPercent(plan.progressPercent);
    setNotes(plan.notes);
  }

  // Refresh server data when navigating back via browser back/forward cache
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [router]);

  // Determine initial focus session (first uncompleted session, or session 1)
  const initialFocusSession =
    plan.sessions.find((s) => !s.isCompleted) || plan.sessions[0];
  const initialSessionIdx = initialFocusSession?.sessionIndex || 1;
  const initialFocusPart =
    plan.parts.find(
      (p) =>
        initialSessionIdx >= p.startSessionIndex &&
        initialSessionIdx <= p.endSessionIndex
    ) || plan.parts[0];
  const initialPartIdx = initialFocusPart?.partIndex || 1;

  // Active Part & Session navigation (preserves user selection across completions)
  const [activePartIndex, setActivePartIndex] = useState(initialPartIdx);
  const [activeSessionIndex, setActiveSessionIndex] = useState(initialSessionIdx);

  // Modals state
  const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState(false);
  const [isPausedLockModalOpen, setIsPausedLockModalOpen] = useState(false);

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

  const remainingChapters = Math.max(0, currentPlan.totalChapters - completedChapters);
  const completedSessionsCount = sessions.filter((s) => s.isCompleted).length;

  // Upcoming future scheduled plan detection
  const planStartDateObj = new Date(currentPlan.startDate);
  const nowMidnight = new Date();
  nowMidnight.setHours(0, 0, 0, 0);
  const isScheduledFuture =
    currentPlan.mode === "scheduled" &&
    planStartDateObj.getTime() > nowMidnight.getTime();

  let daysUntilStart = 0;
  let formattedPlanStartDate = "";
  if (isScheduledFuture) {
    daysUntilStart = Math.ceil(
      (planStartDateObj.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24)
    );
    formattedPlanStartDate = planStartDateObj.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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
    if (isScheduledFuture) {
      return;
    }
    if (currentPlan.status === "paused") {
      setIsPausedLockModalOpen(true);
      return;
    }

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

  const handlePlanUpdated = (updated: PlanInstanceDetail) => {
    setCurrentPlan(updated);
    setSessions(updated.sessions);
    setCompletedChapters(updated.completedChapters);
    setProgressPercent(updated.progressPercent);
    setNotes(updated.notes);
  };

  const handleResumePlan = () => {
    startTransition(async () => {
      const res = await resumePlanAction({ instanceId: currentPlan.id });
      if (res.success && res.plan) {
        handlePlanUpdated(res.plan);
        setIsPausedLockModalOpen(false);
      }
    });
  };

  const handleExecuteCatchUpShift = () => {
    startTransition(async () => {
      const res = await catchUpShiftAction({ instanceId: currentPlan.id });
      if (res.success && res.plan) {
        handlePlanUpdated(res.plan);
        setIsCatchUpModalOpen(false);
      }
    });
  };

  const handleExecuteIncreasePace = (newPace: number) => {
    startTransition(async () => {
      const res = await catchUpIncreasePaceAction({
        instanceId: currentPlan.id,
        newDailyTarget: newPace,
      });
      if (res.success && res.plan) {
        handlePlanUpdated(res.plan);
        setIsCatchUpModalOpen(false);
      }
    });
  };

  // Build Bible reader URL for dedicated reading route
  const buildReaderUrl = (reading: PlanSessionDetail["readings"][0]) => {
    const params = new URLSearchParams();
    params.set("plan", currentPlan.id);
    params.set("readingId", reading.id);
    if (reading.startVerse != null) {
      params.set("startVerse", reading.startVerse.toString());
    }
    if (reading.endVerse != null) {
      params.set("endVerse", reading.endVerse.toString());
    }
    return `/bible/${reading.bookId.toLowerCase()}/${reading.chapter}?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-7 animate-in fade-in duration-200">
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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {currentPlan.title}
            </h1>
            {currentPlan.communityInfo && (
              <Link
                href={`/groups/${currentPlan.communityInfo.groupId}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-0.5 text-[11px] font-semibold text-foreground border border-border hover:bg-surface transition-colors"
                title="View community fellowship"
              >
                <Users className="size-3 text-foreground" />
                <span>Fellowship: {currentPlan.communityInfo.groupName}</span>
                <ArrowRight className="size-2.5 text-foreground-dim" />
              </Link>
            )}
          </div>
          <p className="text-xs text-foreground-dim mt-0.5">
            Tracker: {currentPlan.tracker.name}
          </p>
        </div>
      </div>

      {/* =========================================================================
          UPCOMING SCHEDULED PLAN BANNER (PRE-ENROLLED FUTURE COHORT PLAN)
          ========================================================================= */}
      {isScheduledFuture && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated/70 p-4 text-foreground shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-surface border border-border text-foreground shrink-0">
              <Calendar className="size-4.5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-bold">
                  Cohort Plan Starts {formattedPlanStartDate}
                </span>
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground-secondary">
                  {daysUntilStart === 1 ? "Starts tomorrow" : `Starts in ${daysUntilStart} days`}
                </span>
              </div>
              <p className="text-[11.5px] text-foreground-dim mt-0.5">
                You are pre-enrolled with your cohort. Day 1 readings will unlock when the start date arrives.
              </p>
            </div>
          </div>
          {currentPlan.communityInfo && (
            <Link
              href={`/groups/${currentPlan.communityInfo.groupId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors shrink-0"
            >
              <Users className="size-3.5" />
              <span>Fellowship Hub</span>
            </Link>
          )}
        </div>
      )}

      {/* =========================================================================
          OVERDUE CATCH-UP BANNER (IF APPLICABLE)
          ========================================================================= */}
      {currentPlan.overdueInfo && currentPlan.overdueInfo.overdueDaysCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-foreground">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold">
                You are {currentPlan.overdueInfo.overdueDaysCount} session
                {currentPlan.overdueInfo.overdueDaysCount > 1 ? "s" : ""} behind schedule
              </p>
              <p className="text-[11px] text-foreground-dim">
                Adjust dates or daily pace to get back on track.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCatchUpModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 cursor-pointer shadow-xs"
          >
            <Zap className="size-3.5 fill-current" />
            <span>Catch Up Plan</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          2. SEGMENTED TAB SWITCHER: [Plan Chapters] | [Pacing & Settings]
          ========================================================================= */}
      <div className="flex justify-center">
        <TabsBar
          tabs={[
            {
              id: "chapters",
              label: "Plan Chapters",
              icon: <BookOpen className="size-3.5" />,
            },
            {
              id: "settings",
              label: "Pacing & Settings",
              icon: <Sliders className="size-3.5" />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={({ tab }) => setActiveTab(tab as "chapters" | "settings")}
        />
      </div>

      {/* When Settings Tab is Active */}
      {activeTab === "settings" && (
        <section className="rounded-3xl border border-border/80 bg-surface p-6 sm:p-8 shadow-2xs">
          <PlanSettingsTab
            plan={currentPlan}
            onPlanUpdatedAction={handlePlanUpdated}
          />
        </section>
      )}

      {/* When Chapters Tab is Active */}
      {activeTab === "chapters" && (
        <>
          {/* =========================================================================
              3. BIG PROGRESS ARCH CARD (RECHARTS HORSESHOE GAUGE)
              ========================================================================= */}
          <section className="rounded-3xl border border-border/80 bg-surface px-6 sm:px-8 py-6 sm:py-8 shadow-2xs">
            {/* Center Recharts Speedometer Arch */}
            <div>
              <RechartsPlanGauge
                progressPercent={progressPercent}
                completedChapters={completedChapters}
                totalChapters={currentPlan.totalChapters}
                mode={currentPlan.mode}
              />
            </div>

            {/* Bottom 4-Column Metrics Row */}
            <div className="mx-auto max-w-2xl mt-3 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-y-4 sm:gap-y-0 sm:divide-x divide-border/40 text-center">
              <div className="py-1 px-2">
                <span className="block text-xs font-medium text-foreground-dim">
                  Completed
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {completedChapters} / {currentPlan.totalChapters}
                </span>
              </div>
              <div className="py-1 px-2">
                <span className="block text-xs font-medium text-foreground-dim">
                  Remaining
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {remainingChapters} Ch
                </span>
              </div>
              <div className="py-1 px-2">
                <span className="block text-xs font-medium text-foreground-dim">
                  Daily Target
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {currentPlan.mode === "flexible"
                    ? "Self-Paced"
                    : `${currentPlan.dailyTarget} ch/day`}
                </span>
              </div>
              <div className="py-1 px-2">
                <span className="block text-xs font-medium text-foreground-dim">
                  Sessions
                </span>
                <span className="mt-1 block text-sm sm:text-base font-bold text-foreground">
                  {completedSessionsCount} / {sessions.length}
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

            {/* Part Toggler Bar */}
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-surface px-4 py-2.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevPart}
                disabled={activePartIndex <= 1}
                aria-label="Previous Part"
                className="flex size-7 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    Part {activePartIndex}
                  </span>
                  {currentPart && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                      {currentPart.completedSessions} /{" "}
                      {currentPart.totalSessions} Done
                    </span>
                  )}
                </div>
                {currentPart && (
                  <span className="text-[10px] sm:text-[10.5px] text-foreground-dim mt-0.5">
                    Sessions {currentPart.startSessionIndex}–
                    {currentPart.endSessionIndex} • Part {activePartIndex} of{" "}
                    {currentPlan.parts.length}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextPart}
                disabled={activePartIndex >= currentPlan.parts.length}
                aria-label="Next Part"
                className="flex size-7 items-center justify-center rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Horizontally Scrollable Session Rail */}
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none scroll-smooth">
                {partSessions.map((session) => {
                  const isSelected =
                    session.sessionIndex === activeSession.sessionIndex;
                  const isPreviousIncomplete =
                    currentPlan.mode === "scheduled" &&
                    session.sessionIndex > 1 &&
                    sessions.slice(0, session.sessionIndex - 1).some((s) => !s.isCompleted);
                  const isLocked = isScheduledFuture || isPreviousIncomplete;

                  return (
                    <div
                      key={session.sessionIndex}
                      onClick={() => setActiveSessionIndex(session.sessionIndex)}
                      className={`w-[210px] sm:w-[230px] shrink-0 cursor-pointer snap-start rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 select-none ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/40"
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
                          {isLocked && (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-surface-elevated px-1.5 py-0.5 text-[9.5px] font-semibold text-foreground-dim border border-border"
                              title={
                                isScheduledFuture
                                  ? `Readings unlock on ${formattedPlanStartDate}`
                                  : "Complete previous sessions to unlock"
                              }
                            >
                              <Lock className="size-2.5" />
                              <span>Locked</span>
                            </span>
                          )}
                          {isSelected && !isLocked && (
                            <MapPin className="size-3 text-foreground-dim" />
                          )}
                          {session.isCompleted && (
                            <Check className="size-3.5 stroke-[2.5] text-foreground-dim" />
                          )}
                        </div>
                      </div>

                      {/* Readings List inside Card */}
                      <div className="space-y-1.5 min-h-[44px]">
                        {session.readings.map((reading) => {
                          const readerUrl = buildReaderUrl(reading);

                          return (
                            <div
                              key={reading.id}
                              className="flex items-center justify-between gap-1.5 text-xs group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLocked) {
                                      handleToggleReading(reading.id);
                                    }
                                  }}
                                  className={`flex size-4.5 shrink-0 items-center justify-center rounded-full transition-colors ${
                                    isLocked
                                      ? "border border-border/40 opacity-40 cursor-not-allowed text-foreground-dim"
                                      : reading.isCompleted
                                        ? "bg-primary text-primary-foreground border border-primary cursor-pointer shadow-2xs"
                                        : "border border-border/80 hover:border-primary cursor-pointer"
                                  }`}
                                  title={
                                    isScheduledFuture
                                      ? `Readings are locked until cohort start date (${formattedPlanStartDate})`
                                      : isPreviousIncomplete
                                        ? "Complete previous sessions to unlock"
                                        : undefined
                                  }
                                  aria-label={
                                    isScheduledFuture
                                      ? `Locked until ${formattedPlanStartDate}`
                                      : isPreviousIncomplete
                                        ? "Locked: complete previous sessions first"
                                        : `Toggle reading ${reading.displayText || reading.bookName}`
                                  }
                                >
                                  {isScheduledFuture ? (
                                    <Lock className="size-2.5 text-foreground-dim" />
                                  ) : (
                                    reading.isCompleted && (
                                      <Check className="size-3 stroke-[2.5]" />
                                    )
                                  )}
                                </button>
                                {isScheduledFuture ? (
                                  <span
                                    className="truncate text-foreground-dim select-none cursor-not-allowed text-xs"
                                    title={`Locked until cohort start date (${formattedPlanStartDate})`}
                                  >
                                    {reading.displayText ||
                                      `${reading.bookName} ${reading.chapter}`}
                                  </span>
                                ) : (
                                  <Link
                                    href={readerUrl}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`truncate hover:text-primary transition-colors cursor-pointer ${
                                      reading.isCompleted
                                        ? "text-foreground-muted line-through"
                                        : "text-foreground font-medium"
                                    }`}
                                  >
                                    {reading.displayText ||
                                      `${reading.bookName} ${reading.chapter}`}
                                  </Link>
                                )}
                              </div>

                              {isScheduledFuture ? (
                                <span
                                  className="flex size-5 shrink-0 items-center justify-center rounded text-foreground-dim/40 cursor-not-allowed select-none"
                                  title={`Locked until cohort start date (${formattedPlanStartDate})`}
                                >
                                  <Lock className="size-2.5" />
                                </span>
                              ) : (
                                <Link
                                  href={readerUrl}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label={`Read ${reading.displayText || `${reading.bookName} ${reading.chapter}`}`}
                                  className="flex size-5 shrink-0 items-center justify-center rounded text-foreground-dim hover:text-foreground hover:bg-surface-elevated transition-colors"
                                >
                                  <BookOpen className="size-3" />
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================================
              5. STUDY JOURNAL & REFLECTIONS (DIRECTLY UNDER THE SESSIONS)
              ========================================================================= */}
          <section className="rounded-3xl border border-border/80 bg-surface p-5 sm:p-7 shadow-2xs">
            <PlanSessionNotes
              instanceId={currentPlan.id}
              planTitle={currentPlan.title}
              activeSession={activeSession}
              groupPlanId={currentPlan.communityInfo?.groupPlanId}
              communityName={currentPlan.communityInfo?.groupName}
              notes={notes}
              isLocked={isScheduledFuture}
              unlockDateLabel={formattedPlanStartDate}
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
      {currentPlan.overdueInfo && (
        <PlanCatchUpModal
          isOpen={isCatchUpModalOpen}
          onCloseAction={() => setIsCatchUpModalOpen(false)}
          overdueInfo={currentPlan.overdueInfo}
          currentPace={currentPlan.dailyTarget}
          onExecuteShiftAction={handleExecuteCatchUpShift}
          onExecuteIncreasePaceAction={handleExecuteIncreasePace}
          isPending={isPending}
        />
      )}

      <PlanPausedLockModal
        isOpen={isPausedLockModalOpen}
        onCloseAction={() => setIsPausedLockModalOpen(false)}
        onResumeAction={handleResumePlan}
      />
    </div>
  );
}
