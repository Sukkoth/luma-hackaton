"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Sliders,
  Trophy,
  Sparkles,
  Info,
  PauseCircle,
  Play,
  AlertCircle,
  RefreshCw,
  ArrowLeftCircle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
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
import { PlanSpeedometerGauge } from "./plan-speedometer-gauge";
import { PlanReadingFlow } from "./plan-reading-flow";
import { PlanSettingsTab } from "./plan-settings-tab";
import { PlanDetailsTab } from "./plan-details-tab";
import { PlanCatchUpModal } from "./plan-catchup-modal";
import { PlanPausedLockModal } from "./plan-paused-lock-modal";
import { celebratePlanCompletion } from "@/lib/confetti";

type PlanDetailViewProps = {
  plan: PlanInstanceDetail;
};

export function PlanDetailView({ plan }: PlanDetailViewProps) {
  const [activeTab, setActiveTab] = useState<"chapters" | "settings">(
    "chapters"
  );
  const [, startTransition] = useTransition();
  const [activePartIndex, setActivePartIndex] = useState(1);
  const [activeSessionIndex, setActiveSessionIndex] = useState(1);
  const [isCatchUpModalOpen, setIsCatchUpModalOpen] = useState(false);
  const [isPausedLockModalOpen, setIsPausedLockModalOpen] = useState(false);

  // Current plan state
  const [currentPlan, setCurrentPlan] = useState<PlanInstanceDetail>(plan);
  const [sessions, setSessions] = useState<ReadonlyArray<PlanSessionDetail>>(
    plan.sessions
  );
  const [completedChapters, setCompletedChapters] = useState(
    plan.completedChapters
  );
  const [progressPercent, setProgressPercent] = useState(plan.progressPercent);
  const [notes, setNotes] = useState<ReadonlyArray<PlanNoteDetail>>(plan.notes);

  // Keep state in sync whenever server component passes a fresh plan prop
  const [prevPlan, setPrevPlan] = useState<PlanInstanceDetail>(plan);
  if (prevPlan !== plan) {
    setPrevPlan(plan);
    setCurrentPlan(plan);
    setSessions(plan.sessions);
    setCompletedChapters(plan.completedChapters);
    setProgressPercent(plan.progressPercent);
    setNotes(plan.notes);
  }

  // Handle immediate state update when settings tab saves changes
  const handlePlanUpdated = (updatedPlan: PlanInstanceDetail) => {
    setCurrentPlan(updatedPlan);
    setSessions(updatedPlan.sessions);
    setCompletedChapters(updatedPlan.completedChapters);
    setProgressPercent(updatedPlan.progressPercent);
    setNotes(updatedPlan.notes);
  };

  const handleNoteCreated = (newNote: PlanNoteDetail) => {
    setNotes((prev) => [newNote, ...prev]);
    setCurrentPlan((prev) => ({
      ...prev,
      notesCount: prev.notesCount + 1,
      notes: [newNote, ...prev.notes],
    }));
  };

  const handleNoteUpdated = (updatedNote: PlanNoteDetail) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
    setCurrentPlan((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)),
    }));
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    setCurrentPlan((prev) => ({
      ...prev,
      notesCount: Math.max(0, prev.notesCount - 1),
      notes: prev.notes.filter((n) => n.id !== noteId),
    }));
  };

  const isFinished =
    currentPlan.status === "completed" || progressPercent === 100;

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

  const handleToggleReading = (readingItemId: string) => {
    if (currentPlan.status === "paused") {
      setIsPausedLockModalOpen(true);
      return;
    }

    // Optimistic calculation
    let toggledItemNextStatus = false;
    let delta = 0;

    const nextSessions = sessions.map((session) => {
      const hasItem = session.readings.some((r) => r.id === readingItemId);
      if (!hasItem) return session;

      const nextReadings = session.readings.map((reading) => {
        if (reading.id === readingItemId) {
          toggledItemNextStatus = !reading.isCompleted;
          delta = toggledItemNextStatus ? 1 : -1;
          return { ...reading, isCompleted: toggledItemNextStatus };
        }
        return reading;
      });

      const nextCompletedCount = nextReadings.filter(
        (r) => r.isCompleted
      ).length;

      return {
        ...session,
        readings: nextReadings,
        completedCount: nextCompletedCount,
        isCompleted: nextCompletedCount === nextReadings.length,
      };
    });

    setSessions(nextSessions);
    const nextCompletedChapters = Math.max(0, completedChapters + delta);
    setCompletedChapters(nextCompletedChapters);
    const nextPercent = Math.min(
      100,
      Math.round(
        (nextCompletedChapters / (currentPlan.totalChapters || 1)) * 100
      )
    );
    setProgressPercent(nextPercent);

    if (nextPercent === 100 && progressPercent < 100) {
      celebratePlanCompletion();
    }

    startTransition(async () => {
      const res = await togglePlanReadingItemAction({
        instanceId: currentPlan.id,
        readingItemId,
      });

      if (res.success) {
        setCompletedChapters(res.completedChapters);
        setProgressPercent(res.progressPercent);
        if (res.progressPercent === 100 && progressPercent < 100) {
          celebratePlanCompletion();
        }
        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          window.dispatchEvent(
            new CustomEvent("achievement-unlocked", {
              detail: res.newlyUnlocked,
            })
          );
        }
      } else {
        // Rollback on failure
        setSessions(sessions);
        setCompletedChapters(completedChapters);
        setProgressPercent(progressPercent);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar (Donezo style) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/plans"
            className="flex size-10 items-center justify-center rounded-[14px] border border-border bg-surface text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground shadow-2xs"
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Plan Catalog</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-foreground">
                {currentPlan.title}
              </h1>
              <span className="ui-pill text-[10px] font-semibold uppercase">
                {currentPlan.mode}
              </span>
            </div>
            <p className="text-[12.5px] font-medium text-foreground-dim">
              Tracker: {currentPlan.tracker.name} • {currentPlan.totalChapters}{" "}
              chapters across {currentPlan.sessions.length} sessions
            </p>
          </div>
        </div>

        {/* Right Action Controls: Tab Segmented Pill + Celebrate Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 rounded-[14px] border border-border bg-surface p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("chapters")}
              className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer ${
                activeTab === "chapters"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              <BookOpen className="size-3.5" />
              <span>Chapters</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-[12.5px] font-medium transition-all cursor-pointer ${
                activeTab === "settings"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-foreground-secondary hover:text-foreground"
              }`}
            >
              {isFinished ? (
                <>
                  <Info className="size-3.5" />
                  <span>Details</span>
                </>
              ) : (
                <>
                  <Sliders className="size-3.5" />
                  <span>Pacing</span>
                </>
              )}
            </button>
          </div>

          {progressPercent === 100 && (
            <button
              type="button"
              onClick={() => celebratePlanCompletion()}
              className="ui-btn-primary ui-btn-sm gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="size-3.5 text-primary-foreground" />
              <span>Celebrate</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Donezo-style KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Journey Progress */}
        <div className="ui-card flex flex-col justify-between p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-foreground-dim">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Progress
            </span>
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] sm:text-[30px] font-extrabold leading-none tracking-tight text-foreground">
              {progressPercent}%
            </div>
            <p className="mt-1 text-[11.5px] font-medium text-foreground-dim">
              {isFinished ? "Completed journey" : "Active schedule pace"}
            </p>
          </div>
        </div>

        {/* Card 2: Completed Chapters */}
        <div className="ui-card flex flex-col justify-between p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-foreground-dim">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Completed
            </span>
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] sm:text-[30px] font-extrabold leading-none tracking-tight text-foreground">
              {completedChapters}
            </div>
            <p className="mt-1 text-[11.5px] font-medium text-foreground-dim">
              Out of {currentPlan.totalChapters} chapters
            </p>
          </div>
        </div>

        {/* Card 3: Remaining */}
        <div className="ui-card flex flex-col justify-between p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-foreground-dim">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Remaining
            </span>
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary">
              <Clock className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] sm:text-[30px] font-extrabold leading-none tracking-tight text-foreground">
              {Math.max(0, currentPlan.totalChapters - completedChapters)}
            </div>
            <p className="mt-1 text-[11.5px] font-medium text-foreground-dim">
              {isFinished ? "All chapters read!" : "Chapters to finish"}
            </p>
          </div>
        </div>

        {/* Card 4: Daily Target */}
        <div className="ui-card flex flex-col justify-between p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-foreground-dim">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Daily Target
            </span>
            <div className="flex size-7 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary">
              <Target className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-[26px] sm:text-[30px] font-extrabold leading-none tracking-tight text-foreground">
              {currentPlan.dailyTarget ?? 3}
            </div>
            <p className="mt-1 text-[11.5px] font-medium text-foreground-dim">
              Ch/day (
              {currentPlan.mode === "flexible" ? "Self-Paced" : "Scheduled"})
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "chapters" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Column: Banners + Reading Flow */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Plan Paused Banner */}
            {currentPlan.status === "paused" && (
              <div className="ui-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-warning/30 bg-warning/5 p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-warning/15 text-warning">
                    <PauseCircle className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-warning/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-warning">
                        PLAN PAUSED
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-[15px] font-bold tracking-tight text-foreground">
                      Plan is Paused
                    </h3>
                    <p className="text-[12.5px] text-foreground-secondary">
                      Check marks are locked while your plan is paused. When you
                      are ready to continue, tap Resume to shift your schedule
                      to today.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResumePlan}
                  className="ui-btn-primary px-4 py-2 text-[12.5px] gap-1.5 cursor-pointer"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>Resume Plan</span>
                </button>
              </div>
            )}

            {/* Behind Schedule Banner */}
            {currentPlan.status === "active" && currentPlan.overdueInfo && (
              <div className="glass-panel rounded-[24px] border border-red-500/25 bg-red-500/5 p-5 shadow-xs dark:border-red-500/20 dark:bg-red-500/8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
                      <AlertCircle className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                          {currentPlan.overdueInfo.overdueDaysCount}{" "}
                          {currentPlan.overdueInfo.overdueDaysCount === 1
                            ? "DAY"
                            : "DAYS"}{" "}
                          BEHIND SCHEDULE
                        </span>
                        <span className="text-[11.5px] font-medium text-red-600/80 dark:text-red-400/80">
                          {currentPlan.overdueInfo.overdueChaptersCount}{" "}
                          chapters pending
                        </span>
                      </div>
                      <p className="mt-1 text-[12.5px] text-foreground-secondary">
                        You have unread chapters starting from{" "}
                        {currentPlan.overdueInfo.firstOverdueSessionTitle}
                        {currentPlan.overdueInfo.firstOverdueSessionDateLabel
                          ? ` (${currentPlan.overdueInfo.firstOverdueSessionDateLabel})`
                          : ""}
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap pt-3 border-t border-red-500/15">
                  <button
                    type="button"
                    onClick={() => setIsCatchUpModalOpen(true)}
                    className="ui-btn-primary ui-btn-sm gap-1.5 shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="size-3" />
                    <span>Catch Up to Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentPlan.overdueInfo) {
                        setActiveSessionIndex(
                          currentPlan.overdueInfo.firstOverdueSessionIndex
                        );
                        const partForSession =
                          Math.floor(
                            (currentPlan.overdueInfo.firstOverdueSessionIndex -
                              1) /
                              7
                          ) + 1;
                        setActivePartIndex(partForSession);
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-foreground transition-all hover:bg-surface-elevated"
                  >
                    <ArrowLeftCircle className="size-3" />
                    <span>
                      {currentPlan.overdueInfo.firstOverdueSessionTitle}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-3 py-1.5 text-[12px] font-medium text-foreground-secondary transition-all hover:text-foreground"
                  >
                    <Sliders className="size-3" />
                    <span>Adjust Pace</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reading Flow Section */}
            <PlanReadingFlow
              key={`${currentPlan.id}-${currentPlan.dailyTarget}-${currentPlan.activeDaysMask}-${currentPlan.mode}`}
              instanceId={currentPlan.id}
              planTitle={currentPlan.title}
              sessions={sessions}
              parts={currentPlan.parts}
              notes={notes}
              activePartIndex={activePartIndex}
              activeSessionIndex={activeSessionIndex}
              onSelectPartAction={(idx) => setActivePartIndex(idx)}
              onSelectSessionAction={(idx) => setActiveSessionIndex(idx)}
              onToggleReadingAction={handleToggleReading}
              onNoteCreatedAction={handleNoteCreated}
              onNoteUpdatedAction={handleNoteUpdated}
              onNoteDeletedAction={handleNoteDeleted}
              mode={currentPlan.mode}
            />
          </div>

          {/* Right Column: Speedometer Hero Card + Donezo Meta Cards */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Speedometer Gauge Hero Card (Donezo Project Progress style) */}
            <PlanSpeedometerGauge
              progressPercent={progressPercent}
              completedChapters={completedChapters}
              totalChapters={currentPlan.totalChapters}
              mode={currentPlan.mode}
              dailyTarget={currentPlan.dailyTarget}
              title="Journey Progress"
            />

            {/* 100% Completion Celebration Card */}
            {progressPercent === 100 && (
              <div className="ui-card p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-primary text-primary-foreground shadow-xs">
                    <Trophy className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-dim">
                        Milestone Reached
                      </span>
                      <span className="ui-pill text-[10.5px] font-bold">
                        100%
                      </span>
                    </div>
                    <h3 className="mt-0.5 text-[15px] font-bold tracking-tight text-foreground">
                      Journey Finished! 🎉
                    </h3>
                  </div>
                </div>
                <p className="text-[12px] text-foreground-secondary leading-relaxed">
                  You have read all {currentPlan.totalChapters} chapters of{" "}
                  {currentPlan.title}.
                </p>
                <button
                  type="button"
                  onClick={() => celebratePlanCompletion()}
                  className="ui-btn-primary w-full py-2 text-[12.5px] gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="size-3.5" />
                  <span>Celebrate Again</span>
                </button>
              </div>
            )}

            {/* Plan Info Card (Donezo Project details style) */}
            <div className="ui-card p-5 space-y-3 shadow-2xs">
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-foreground-dim">
                Plan Details
              </h4>
              <div className="divide-y divide-border text-[12.5px]">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-foreground-secondary">
                    Active Tracker
                  </span>
                  <span className="font-semibold text-foreground">
                    {currentPlan.tracker.name}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-foreground-secondary">
                    Total Sessions
                  </span>
                  <span className="font-semibold text-foreground">
                    {currentPlan.sessions.length} sessions
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-foreground-secondary">Pace Mode</span>
                  <span className="font-semibold text-foreground capitalize">
                    {currentPlan.mode}
                  </span>
                </div>
                {currentPlan.startDate && (
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-foreground-secondary">
                      Started On
                    </span>
                    <span className="font-semibold text-foreground">
                      {new Date(currentPlan.startDate).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Plan details (when finished) OR Pacing & Settings View */}
      {activeTab === "settings" &&
        (isFinished ? (
          <PlanDetailsTab plan={currentPlan} />
        ) : (
          <PlanSettingsTab
            plan={currentPlan}
            onPlanUpdatedAction={handlePlanUpdated}
          />
        ))}

      {/* Catch-Up Modal */}
      {currentPlan.overdueInfo && (
        <PlanCatchUpModal
          isOpen={isCatchUpModalOpen}
          onCloseAction={() => setIsCatchUpModalOpen(false)}
          overdueInfo={currentPlan.overdueInfo}
          currentPace={currentPlan.dailyTarget}
          onExecuteShiftAction={handleExecuteCatchUpShift}
          onExecuteIncreasePaceAction={handleExecuteIncreasePace}
        />
      )}

      {/* Paused Checkmarks Locked Notice Modal */}
      <PlanPausedLockModal
        isOpen={isPausedLockModalOpen}
        onCloseAction={() => setIsPausedLockModalOpen(false)}
        onResumeAction={handleResumePlan}
      />
    </div>
  );
}
