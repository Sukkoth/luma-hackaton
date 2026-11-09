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
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/plans"
            className="flex size-9 items-center justify-center rounded-[12px] border border-border bg-surface-elevated text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to Plan Catalog</span>
          </Link>
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-foreground">
              {currentPlan.title}
            </h1>
            <p className="text-[12px] font-medium text-foreground-dim">
              Tracker: {currentPlan.tracker.name}
            </p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-1.5 rounded-[16px] border border-border bg-surface-elevated p-1">
        <button
          type="button"
          onClick={() => setActiveTab("chapters")}
          className={`flex items-center justify-center gap-2 rounded-[12px] py-2 text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === "chapters"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Plan Chapters</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center justify-center gap-2 rounded-[12px] py-2 text-[13px] font-medium transition-all cursor-pointer ${
            activeTab === "settings"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          {isFinished ? (
            <>
              <Info className="size-4" />
              <span>Plan details</span>
            </>
          ) : (
            <>
              <Sliders className="size-4" />
              <span>Pacing & Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Tab 1: Plan Chapters View */}
      {activeTab === "chapters" && (
        <div className="space-y-6">
          {/* Speedometer Gauge Hero Card */}
          <PlanSpeedometerGauge
            progressPercent={progressPercent}
            completedChapters={completedChapters}
            totalChapters={currentPlan.totalChapters}
            mode={currentPlan.mode}
          />

          {/* 100% Completion Celebration Banner */}
          {progressPercent === 100 && (
            <div className="ui-card flex flex-col sm:flex-row items-center justify-between gap-4 p-5 shadow-xs">
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
                      100% Complete
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-[16px] font-bold tracking-tight text-foreground">
                    Journey Finished! 🎉
                  </h3>
                  <p className="text-[12.5px] text-foreground-secondary">
                    You have read all {currentPlan.totalChapters} chapters of{" "}
                    {currentPlan.title}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => celebratePlanCompletion()}
                className="ui-btn-primary px-4 py-2 text-[12.5px] gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Celebrate Again</span>
              </button>
            </div>
          )}

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
                    are ready to continue, tap Resume to shift your schedule to
                    today.
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
                        {currentPlan.overdueInfo.overdueChaptersCount} chapters
                        pending
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-[#666666] dark:text-[#9CA3AF]">
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
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white/80 px-3 py-1.5 text-[12px] font-medium text-black transition-all hover:bg-black/4 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <ArrowLeftCircle className="size-3" />
                  <span>
                    {currentPlan.overdueInfo.firstOverdueSessionTitle}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-transparent px-3 py-1.5 text-[12px] font-medium text-[#666666] transition-all hover:text-black dark:border-white/10 dark:text-[#A1A1AA] dark:hover:text-white"
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
