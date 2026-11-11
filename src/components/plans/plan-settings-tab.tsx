"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Compass,
  Lock,
  Pause,
  Play,
  Trash2,
  Bell,
  Coffee,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  BookOpen,
  Check,
} from "lucide-react";
import {
  updatePlanSettingsAction,
  deletePlanInstanceAction,
  pausePlanAction,
  resumePlanAction,
  type PlanInstanceDetail,
} from "@/actions/plans";

type PlanSettingsTabProps = {
  plan: PlanInstanceDetail;
  onPlanUpdatedAction?: (updatedPlan: PlanInstanceDetail) => void;
};

const WEEKDAYS = [
  { dayIndex: 0, label: "S", name: "Sun" },
  { dayIndex: 1, label: "M", name: "Mon" },
  { dayIndex: 2, label: "T", name: "Tue" },
  { dayIndex: 3, label: "W", name: "Wed" },
  { dayIndex: 4, label: "T", name: "Thu" },
  { dayIndex: 5, label: "F", name: "Fri" },
  { dayIndex: 6, label: "S", name: "Sat" },
];

const DURATION_PRESETS = [14, 30, 60, 90, 180, 365];

type CalculateProjectedDateParams = {
  remainingChapters: number;
  dailyChapters: number;
  activeDays: number[];
};

function calculateProjectedCompletionDate({
  remainingChapters,
  dailyChapters,
  activeDays,
}: CalculateProjectedDateParams): {
  projectedDate: Date;
  activeReadingDaysNeeded: number;
  calendarDaysNeeded: number;
} {
  const safePace = Math.max(1, dailyChapters);
  const safeDays = activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];
  const activeReadingDaysNeeded = Math.max(
    1,
    Math.ceil(remainingChapters / safePace)
  );

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (!safeDays.includes(cursor.getDay())) {
    cursor.setDate(cursor.getDate() + 1);
  }

  let activeCount = 1;
  const startStamp = cursor.getTime();

  while (activeCount < activeReadingDaysNeeded) {
    cursor.setDate(cursor.getDate() + 1);
    if (safeDays.includes(cursor.getDay())) {
      activeCount++;
    }
  }

  const calendarDaysNeeded = Math.max(
    1,
    Math.round((cursor.getTime() - startStamp) / (1000 * 60 * 60 * 24)) + 1
  );

  return {
    projectedDate: cursor,
    activeReadingDaysNeeded,
    calendarDaysNeeded,
  };
}

export function PlanSettingsTab({
  plan,
  onPlanUpdatedAction,
}: PlanSettingsTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Local settings draft state (does NOT trigger API calls until "Update Settings" is clicked)
  const [mode, setMode] = useState<"scheduled" | "flexible">(plan.mode);
  const [paceType, setPaceType] = useState<"by_daily_target" | "by_end_date">(
    plan.paceType === "by_end_date" ? "by_end_date" : "by_daily_target"
  );
  const [dailyChapters, setDailyChapters] = useState(plan.dailyTarget);
  const [targetDurationDays, setTargetDurationDays] = useState(
    plan.recommendedDays || 30
  );

  const [activeDays, setActiveDays] = useState<number[]>(() => {
    const list: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (plan.activeDaysMask[i] === "1") {
        list.push(i);
      }
    }
    return list.length > 0 ? list : [0, 1, 2, 3, 4, 5, 6];
  });

  const [reminderEnabled, setReminderEnabled] = useState(plan.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(
    plan.reminderTime || "08:00"
  );

  const [shiftOnResume, setShiftOnResume] = useState(true);
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const remainingChapters = Math.max(
    1,
    plan.totalChapters - plan.completedChapters
  );

  // Live client-side projection calculation (0 API calls)
  const projection = useMemo(() => {
    return calculateProjectedCompletionDate({
      remainingChapters,
      dailyChapters,
      activeDays,
    });
  }, [remainingChapters, dailyChapters, activeDays]);

  // Active days mask string derived from draft activeDays
  const activeDaysMask = useMemo(() => {
    let mask = "";
    for (let i = 0; i < 7; i++) {
      mask += activeDays.includes(i) ? "1" : "0";
    }
    return mask;
  }, [activeDays]);

  // Handle switching Mode in draft
  const handleSwitchMode = (nextMode: "scheduled" | "flexible") => {
    if (!plan.allowSelfPaced && nextMode === "flexible") return;
    setSuccessMessage(null);
    setMode(nextMode);
  };

  // Handle updating daily pace in draft
  const handleUpdateDailyPace = (nextTarget: number) => {
    if (!plan.allowCustomPace) return;
    setSuccessMessage(null);
    const clamped = Math.max(1, Math.min(50, nextTarget));
    setDailyChapters(clamped);
  };

  // Handle updating target duration (days) in draft
  const handleUpdateDurationDays = (nextDays: number) => {
    if (!plan.allowCustomPace) return;
    setSuccessMessage(null);
    const clampedDays = Math.max(1, Math.min(730, nextDays));
    setTargetDurationDays(clampedDays);

    // Compute required daily pace for preview
    const activePerWeek = activeDays.length;
    const estimatedActiveDays = Math.max(
      1,
      Math.round(clampedDays * (activePerWeek / 7))
    );
    const requiredDailyChapters = Math.max(
      1,
      Math.ceil(remainingChapters / estimatedActiveDays)
    );
    setDailyChapters(requiredDailyChapters);
  };

  // Handle toggling weekday active / rest in draft
  const handleToggleWeekday = (dayIdx: number) => {
    setSuccessMessage(null);
    let nextDays: number[];
    if (activeDays.includes(dayIdx)) {
      if (activeDays.length <= 1) return;
      nextDays = activeDays.filter((d) => d !== dayIdx);
    } else {
      nextDays = [...activeDays, dayIdx].sort();
    }
    setActiveDays(nextDays);
  };

  // Handle toggling notification reminder in draft
  const handleToggleReminder = async () => {
    setSuccessMessage(null);
    const nextVal = !reminderEnabled;
    setReminderEnabled(nextVal);

    if (nextVal && typeof window !== "undefined" && "Notification" in window) {
      await Notification.requestPermission();
    }
  };

  // Explicit Save Handler: ONLY triggers API call when "Update Settings" is clicked
  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const submittedMode =
      (formData.get("mode") as "scheduled" | "flexible") || mode;
    const submittedPaceType =
      submittedMode === "flexible"
        ? "self_paced"
        : (formData.get("paceType") as "by_daily_target" | "by_end_date") ||
          paceType;
    const submittedDailyTarget =
      Number(formData.get("dailyTarget")) || dailyChapters;
    const submittedActiveDaysMask =
      (formData.get("activeDaysMask") as string) || activeDaysMask;
    const submittedReminderEnabled = formData.get("reminderEnabled") === "true";
    const submittedReminderTime =
      (formData.get("reminderTime") as string) || reminderTime;

    let targetEndDate: string | undefined;
    if (submittedMode === "scheduled" && submittedPaceType === "by_end_date") {
      const projectedEnd = new Date();
      projectedEnd.setDate(projectedEnd.getDate() + targetDurationDays);
      targetEndDate = projectedEnd.toISOString();
    }

    startTransition(async () => {
      const res = await updatePlanSettingsAction({
        instanceId: plan.id,
        mode: submittedMode,
        paceType: submittedPaceType,
        dailyTarget: submittedDailyTarget,
        targetEndDate,
        activeDaysMask: submittedActiveDaysMask,
        reminderEnabled: submittedReminderEnabled,
        reminderTime: submittedReminderTime,
      });

      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage("Settings updated successfully");
        if (res.plan) {
          onPlanUpdatedAction?.(res.plan);
        }
        router.refresh();
      }
    });
  };

  // Handle Pause / Resume (dedicated immediate action)
  const handleTogglePause = () => {
    startTransition(async () => {
      let res;
      if (plan.status === "paused") {
        res = await resumePlanAction({ instanceId: plan.id });
      } else {
        res = await pausePlanAction({ instanceId: plan.id });
      }
      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        if (res.plan) {
          onPlanUpdatedAction?.(res.plan);
        }
        router.refresh();
      }
    });
  };

  // Handle Delete Plan
  const handleDeletePlan = () => {
    startTransition(async () => {
      const res = await deletePlanInstanceAction({ instanceId: plan.id });
      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        router.push("/plans");
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-[13px] text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-[13px] text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white">
          <Check className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Settings Form - Changes are batched and only saved when submitting */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="paceType" value={paceType} />
        <input type="hidden" name="dailyTarget" value={dailyChapters} />
        <input type="hidden" name="activeDaysMask" value={activeDaysMask} />
        <input
          type="hidden"
          name="reminderEnabled"
          value={reminderEnabled ? "true" : "false"}
        />
        <input type="hidden" name="reminderTime" value={reminderTime} />

        {/* 1. Pacing Mode Selector Card */}
        <div className="glass-panel rounded-[26px] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-black dark:text-white">
                Pacing Mode
              </h3>
              <p className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                Choose how you want to progress through this reading plan
              </p>
            </div>
            {isPending && (
              <Loader2 className="size-4 animate-spin text-zinc-900 dark:text-white" />
            )}
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1.5 dark:bg-white/6">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSwitchMode("scheduled")}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
                mode === "scheduled"
                  ? "bg-white text-black shadow-xs dark:bg-white/15 dark:text-white"
                  : "text-[#777777] hover:text-black dark:text-[#A1A1AA] dark:hover:text-white"
              }`}
            >
              <Calendar className="size-4" />
              <span>Calendar Schedule</span>
            </button>

            <button
              type="button"
              disabled={isPending || !plan.allowSelfPaced}
              onClick={() => handleSwitchMode("flexible")}
              className={`relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
                mode === "flexible"
                  ? "bg-white text-black shadow-xs dark:bg-white/15 dark:text-white"
                  : "text-[#777777] hover:text-black dark:text-[#A1A1AA] dark:hover:text-white"
              } ${!plan.allowSelfPaced ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Compass className="size-4" />
              <span>Self-Paced / Flexible</span>
              {!plan.allowSelfPaced && (
                <Lock className="size-3 text-[#9CA3AF]" />
              )}
            </button>
          </div>

          {!plan.allowSelfPaced && (
            <p className="flex items-center gap-1.5 text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
              <Info className="size-3.5" />
              <span>
                This reading plan requires scheduled calendar pacing to preserve
                chronological sequencing.
              </span>
            </p>
          )}
        </div>

        {/* 2. Pacing Configuration Card */}
        <div className="glass-panel rounded-[26px] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-black/6 pb-4 dark:border-white/6">
            <div>
              <h3 className="text-[16px] font-semibold text-black dark:text-white">
                {mode === "scheduled" ? "Pacing Schedule" : "Reading Target"}
              </h3>
              <p className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                {mode === "scheduled"
                  ? "Configure your reading pace, completion goal, and rest days"
                  : "Set an optional daily reading goal for guidance"}
              </p>
            </div>

            {!plan.allowCustomPace && (
              <span className="flex items-center gap-1.5 rounded-full border border-black/8 bg-black/4 px-2.5 py-1 text-[11.5px] font-medium text-[#666666] dark:border-white/10 dark:bg-white/6 dark:text-[#A1A1AA]">
                <Lock className="size-3" />
                Fixed Author Pace
              </span>
            )}
          </div>

          {/* Pacing Style Sub-Tabs (Only in Scheduled mode) */}
          {mode === "scheduled" && plan.allowCustomPace && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(null);
                  setPaceType("by_daily_target");
                }}
                className={`rounded-xl px-3 py-1.5 text-[12px] transition-all cursor-pointer ${
                  paceType === "by_daily_target"
                    ? "bg-primary font-bold text-primary-foreground shadow-xs"
                    : "border border-border bg-surface font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                By Chapters Per Day
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage(null);
                  setPaceType("by_end_date");
                }}
                className={`rounded-xl px-3 py-1.5 text-[12px] transition-all cursor-pointer ${
                  paceType === "by_end_date"
                    ? "bg-primary font-bold text-primary-foreground shadow-xs"
                    : "border border-border bg-surface font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                By Target Duration (Days)
              </button>
            </div>
          )}

          {/* Option A: By Daily Target */}
          {(mode === "flexible" || paceType === "by_daily_target") && (
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-[13.5px] font-medium text-black dark:text-white">
                  Daily Target
                </span>
                <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                  {mode === "scheduled"
                    ? "Chapters assigned per active reading session"
                    : "Target chapters you aim to complete daily"}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={
                    isPending || dailyChapters <= 1 || !plan.allowCustomPace
                  }
                  onClick={() => handleUpdateDailyPace(dailyChapters - 1)}
                  className="ui-btn-secondary ui-btn-icon size-8.5 rounded-xl font-bold cursor-pointer disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-8 text-center text-[16px] font-semibold text-foreground">
                  {dailyChapters}
                </span>
                <button
                  type="button"
                  disabled={
                    isPending || dailyChapters >= 50 || !plan.allowCustomPace
                  }
                  onClick={() => handleUpdateDailyPace(dailyChapters + 1)}
                  className="ui-btn-secondary ui-btn-icon size-8.5 rounded-xl font-bold cursor-pointer disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Option B: By Target Duration (Days) */}
          {mode === "scheduled" && paceType === "by_end_date" && (
            <div className="space-y-3.5 py-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13.5px] font-medium text-foreground">
                    Target Duration
                  </span>
                  <p className="text-[11.5px] text-foreground-dim">
                    Total calendar days to complete the remaining chapters
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      targetDurationDays <= 1 ||
                      !plan.allowCustomPace
                    }
                    onClick={() =>
                      handleUpdateDurationDays(targetDurationDays - 5)
                    }
                    className="ui-btn-secondary ui-btn-icon size-8.5 rounded-xl font-bold cursor-pointer disabled:opacity-30"
                  >
                    -5
                  </button>
                  <span className="w-14 text-center text-[15px] font-semibold text-foreground">
                    {targetDurationDays}d
                  </span>
                  <button
                    type="button"
                    disabled={
                      isPending ||
                      targetDurationDays >= 730 ||
                      !plan.allowCustomPace
                    }
                    onClick={() =>
                      handleUpdateDurationDays(targetDurationDays + 5)
                    }
                    className="ui-btn-secondary ui-btn-icon size-8.5 rounded-xl font-bold cursor-pointer disabled:opacity-30"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              {plan.allowCustomPace && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpdateDurationDays(preset)}
                      className={`shrink-0 rounded-xl border px-3 py-1 text-[11.5px] transition-all cursor-pointer ${
                        targetDurationDays === preset
                          ? "border-primary bg-primary font-bold text-primary-foreground shadow-xs"
                          : "border-border bg-surface font-medium text-foreground-secondary hover:bg-surface-elevated hover:text-foreground"
                      }`}
                    >
                      {preset} days
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Reading Days (Rest Days) - only relevant in scheduled mode */}
          {mode === "scheduled" && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-foreground">
                  Weekly Reading Days
                </span>
                <span className="text-[11px] font-medium text-foreground-dim">
                  {activeDays.length} active / {7 - activeDays.length} rest
                </span>
              </div>

              <div className="flex items-center justify-between gap-1.5 sm:justify-start sm:gap-2.5">
                {WEEKDAYS.map((w) => {
                  const isActive = activeDays.includes(w.dayIndex);
                  return (
                    <button
                      key={w.dayIndex}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleWeekday(w.dayIndex)}
                      className={`flex size-9 sm:size-10 items-center justify-center rounded-full text-[13px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary font-bold text-primary-foreground shadow-xs"
                          : "border border-border bg-surface-elevated font-medium text-foreground-dim hover:text-foreground"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>

              {activeDays.length < 7 && (
                <p className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  <Coffee className="size-3.5" />
                  <span>
                    Rest days allow you to reflect or catch up without breaking
                    your streak.
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Live Projected Completion Banner */}
          {mode === "scheduled" && (
            <div className="ui-card-elevated p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">
                    Projected Finish:{" "}
                    {projection.projectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-foreground-dim">
                    {remainingChapters} chapters remaining • ~
                    {projection.activeReadingDaysNeeded} active reading sessions
                    ({projection.calendarDaysNeeded} calendar days) at{" "}
                    {dailyChapters} ch/day.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Routine & Habits Notifications */}
        <div className="ui-card p-5 sm:p-6 space-y-4">
          <h3 className="text-[16px] font-semibold text-foreground">
            Habits & Notifications
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground-secondary">
                <Bell className="size-4.5" />
              </div>
              <div>
                <span className="text-[13.5px] font-medium text-foreground">
                  Daily Reading Reminder
                </span>
                <p className="text-[11.5px] text-foreground-dim">
                  Receive prompt notifications in your browser
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={handleToggleReminder}
              className="size-5 rounded accent-primary"
            />
          </div>

          {reminderEnabled && (
            <div className="ui-card-elevated flex items-center justify-between p-3">
              <span className="text-[12px] text-foreground-secondary">
                Reminder Time
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => {
                  setSuccessMessage(null);
                  setReminderTime(e.target.value);
                }}
                className="ui-input py-1 text-[12px] font-medium"
              />
            </div>
          )}
        </div>

        {/* Explicit Form Submission Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="ui-btn-primary ui-btn-sm gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <span>Update Settings</span>
          </button>
        </div>
      </form>

      {/* 4. Curriculum Overview Accordion */}
      <div className="glass-panel rounded-[26px] p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setShowCurriculum((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-4.5 text-zinc-900 dark:text-white" />
            <div>
              <h3 className="text-[15px] font-semibold text-black dark:text-white">
                Curriculum Breakdown
              </h3>
              <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                {plan.parts.length} parts • {plan.totalChapters} total chapters
              </p>
            </div>
          </div>
          {showCurriculum ? (
            <ChevronUp className="size-4 text-[#777777]" />
          ) : (
            <ChevronDown className="size-4 text-[#777777]" />
          )}
        </button>

        {showCurriculum && (
          <div className="mt-4 space-y-3 border-t border-black/6 pt-4 dark:border-white/6">
            {plan.parts.map((part) => {
              const partSessions = plan.sessions.slice(
                part.startSessionIndex,
                part.endSessionIndex + 1
              );
              return (
                <div key={part.partIndex} className="ui-card-elevated p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-semibold text-foreground">
                        {part.title}
                      </span>
                      {part.subtitle && (
                        <p className="mt-0.5 text-[11.5px] text-foreground-dim">
                          {part.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="ui-pill text-[11px]">
                      {part.completedSessions}/{part.totalSessions} sessions
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {partSessions.map((session) => (
                      <span
                        key={session.sessionIndex}
                        className={`rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${
                          session.isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-foreground-secondary"
                        }`}
                      >
                        {session.title} ({session.readings.length} ch)
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Danger Zone & Plan Lifecycle */}
      <div className="ui-card p-5 sm:p-6 space-y-4">
        <h3 className="text-[16px] font-semibold text-foreground">
          Plan Status & Danger Zone
        </h3>

        {/* Smart Resume Schedule Shift Option when paused */}
        {plan.status === "paused" && (
          <div className="ui-card-elevated flex items-center justify-between p-3">
            <div>
              <span className="text-[12.5px] font-medium text-foreground">
                Shift Schedule on Resume
              </span>
              <p className="text-[11px] text-foreground-dim">
                Advance start date to today so you don&apos;t accumulate overdue
                days
              </p>
            </div>
            <input
              type="checkbox"
              checked={shiftOnResume}
              onChange={(e) => setShiftOnResume(e.target.checked)}
              className="size-4.5 rounded accent-black dark:accent-white"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Pause / Resume Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePause}
            className="ui-btn-secondary ui-btn-sm w-full gap-2"
          >
            {plan.status === "paused" ? (
              <>
                <Play className="size-4 shrink-0" />
                <span>Resume Plan</span>
              </>
            ) : (
              <>
                <Pause className="size-4 shrink-0" />
                <span>Pause Plan</span>
              </>
            )}
          </button>

          {/* Leave Plan Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowDeleteConfirm(true)}
            className="ui-btn-destructive ui-btn-sm w-full gap-2"
          >
            <Trash2 className="size-4 shrink-0" />
            <span>Leave / Delete Plan</span>
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <h4 className="text-[14px] font-bold text-destructive">
              Delete this reading plan?
            </h4>
            <p className="mt-1 text-[12px] text-destructive/80">
              This will permanently delete this plan instance from your tracker.
            </p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeletePlan}
                className="ui-btn-destructive ui-btn-sm gap-1.5"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Delete Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="ui-btn-secondary ui-btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
