"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Compass,
  Lock,
  Pause,
  Play,
  RotateCcw,
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
  resetPlanProgressAction,
  deletePlanInstanceAction,
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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
    const nextStatus = plan.status === "paused" ? "active" : "paused";
    startTransition(async () => {
      const res = await updatePlanSettingsAction({
        instanceId: plan.id,
        status: nextStatus,
        shiftScheduleOnResume: nextStatus === "active" ? shiftOnResume : false,
      });
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

  // Handle Reset Progress
  const handleResetProgress = () => {
    startTransition(async () => {
      const res = await resetPlanProgressAction({ instanceId: plan.id });
      if (!res.success) {
        setErrorMessage(res.error);
      } else {
        setShowResetConfirm(false);
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
        <div className="flex items-center gap-2 rounded-xl border border-[#82ADD4]/30 bg-[#82ADD4]/10 p-3.5 text-[13px] text-[#507ea6] dark:text-[#82ADD4]">
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
              <Loader2 className="size-4 animate-spin text-[#82ADD4]" />
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
                className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all ${
                  paceType === "by_daily_target"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "border border-black/10 bg-white/60 text-[#666666] hover:bg-black/5 dark:border-white/10 dark:bg-white/6 dark:text-[#A1A1AA]"
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
                className={`rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all ${
                  paceType === "by_end_date"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "border border-black/10 bg-white/60 text-[#666666] hover:bg-black/5 dark:border-white/10 dark:bg-white/6 dark:text-[#A1A1AA]"
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
                  className="flex size-8.5 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 disabled:opacity-30 dark:border-white/12 dark:bg-white/10 dark:text-white"
                >
                  -
                </button>
                <span className="w-8 text-center text-[16px] font-semibold text-black dark:text-white">
                  {dailyChapters}
                </span>
                <button
                  type="button"
                  disabled={
                    isPending || dailyChapters >= 50 || !plan.allowCustomPace
                  }
                  onClick={() => handleUpdateDailyPace(dailyChapters + 1)}
                  className="flex size-8.5 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 disabled:opacity-30 dark:border-white/12 dark:bg-white/10 dark:text-white"
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
                  <span className="text-[13.5px] font-medium text-black dark:text-white">
                    Target Duration
                  </span>
                  <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
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
                    className="flex size-8.5 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 disabled:opacity-30 dark:border-white/12 dark:bg-white/10 dark:text-white"
                  >
                    -5
                  </button>
                  <span className="w-14 text-center text-[15px] font-semibold text-black dark:text-white">
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
                    className="flex size-8.5 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 disabled:opacity-30 dark:border-white/12 dark:bg-white/10 dark:text-white"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              {plan.allowCustomPace && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpdateDurationDays(preset)}
                      className={`rounded-xl border px-3 py-1 text-[11.5px] font-medium transition-all ${
                        targetDurationDays === preset
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-black/10 bg-white/60 text-[#666666] hover:bg-black/5 dark:border-white/10 dark:bg-white/6 dark:text-[#A1A1AA]"
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
            <div className="space-y-3 border-t border-black/6 pt-4 dark:border-white/6">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-medium text-black dark:text-white">
                  Weekly Reading Days
                </span>
                <span className="text-[12px] font-medium text-[#82ADD4]">
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
                      className={`flex size-9 sm:size-10 items-center justify-center rounded-full text-[13px] font-semibold transition-all ${
                        isActive
                          ? "bg-black text-white shadow-xs dark:bg-white dark:text-black"
                          : "bg-black/5 text-[#888888] hover:bg-black/10 dark:bg-white/6 dark:text-[#71717A] dark:hover:bg-white/10"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>

              {activeDays.length < 7 && (
                <p className="flex items-center gap-1.5 text-[11.5px] text-[#507ea6] dark:text-[#82ADD4]">
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
            <div className="rounded-2xl border border-black/6 bg-black/3 p-4 dark:border-white/8 dark:bg-white/4">
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#82ADD4] dark:bg-[#82ADD4]/25">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-black dark:text-white">
                    Projected Finish:{" "}
                    {projection.projectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
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
        <div className="glass-panel rounded-[26px] p-5 sm:p-6 space-y-4">
          <h3 className="text-[16px] font-semibold text-black dark:text-white">
            Habits & Notifications
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                <Bell className="size-4.5" />
              </div>
              <div>
                <span className="text-[13.5px] font-medium text-black dark:text-white">
                  Daily Reading Reminder
                </span>
                <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                  Receive prompt notifications in your browser
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={handleToggleReminder}
              className="size-5 rounded accent-black dark:accent-white"
            />
          </div>

          {reminderEnabled && (
            <div className="flex items-center justify-between rounded-xl bg-black/4 p-3 dark:bg-white/4">
              <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                Reminder Time
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => {
                  setSuccessMessage(null);
                  setReminderTime(e.target.value);
                }}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[12px] font-medium text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Explicit Form Submission Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-2xl bg-black px-6 py-3 text-[13.5px] font-medium text-white shadow-xs transition-all hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
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
            <BookOpen className="size-4.5 text-[#82ADD4]" />
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
                <div
                  key={part.partIndex}
                  className="rounded-2xl border border-black/6 bg-white/40 p-3.5 dark:border-white/8 dark:bg-white/4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-semibold text-black dark:text-white">
                        {part.title}
                      </span>
                      {part.subtitle && (
                        <p className="mt-0.5 text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                          {part.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="rounded-lg bg-black/5 px-2 py-0.5 text-[11px] font-medium text-[#777777] dark:bg-white/8 dark:text-[#A1A1AA]">
                      {part.completedSessions}/{part.totalSessions} sessions
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {partSessions.map((session) => (
                      <span
                        key={session.sessionIndex}
                        className={`rounded-md border px-2 py-0.5 text-[10.5px] font-medium ${
                          session.isCompleted
                            ? "border-[#82ADD4]/30 bg-[#82ADD4]/10 text-[#507ea6] dark:text-[#82ADD4]"
                            : "border-black/6 bg-white/70 text-black/80 dark:border-white/8 dark:bg-white/8 dark:text-white/80"
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
      <div className="glass-panel rounded-[26px] p-5 sm:p-6 space-y-4">
        <h3 className="text-[16px] font-semibold text-black dark:text-white">
          Plan Status & Danger Zone
        </h3>

        {/* Smart Resume Schedule Shift Option when paused */}
        {plan.status === "paused" && (
          <div className="flex items-center justify-between rounded-xl bg-black/4 p-3 dark:bg-white/4">
            <div>
              <span className="text-[12.5px] font-medium text-black dark:text-white">
                Shift Schedule on Resume
              </span>
              <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Pause / Resume Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleTogglePause}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white/80 px-4 py-2.5 text-[13px] font-medium text-black shadow-2xs hover:bg-black/5 dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {plan.status === "paused" ? (
              <>
                <Play className="size-4" />
                <span>Resume Reading Plan</span>
              </>
            ) : (
              <>
                <Pause className="size-4" />
                <span>Pause Plan</span>
              </>
            )}
          </button>

          {/* Reset Progress Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-[13px] font-medium text-amber-700 hover:bg-amber-500/20 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400"
          >
            <RotateCcw className="size-4" />
            <span>Reset Progress to 0%</span>
          </button>

          {/* Leave Plan Button */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-500/20 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
          >
            <Trash2 className="size-4" />
            <span>Leave / Delete Plan</span>
          </button>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <h4 className="text-[14px] font-semibold text-amber-800 dark:text-amber-300">
              Reset all completed chapters?
            </h4>
            <p className="mt-1 text-[12px] text-amber-700 dark:text-amber-400">
              This will unmark all chapters read in this plan and return your
              progress to 0%.
            </p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={handleResetProgress}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-amber-700"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Confirm Reset</span>
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-black/10 px-3.5 py-1.5 text-[12px] font-medium text-[#666666] hover:bg-black/5 dark:border-white/10 dark:text-[#A1A1AA]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <h4 className="text-[14px] font-semibold text-red-800 dark:text-red-300">
              Delete this reading plan?
            </h4>
            <p className="mt-1 text-[12px] text-red-700 dark:text-red-400">
              This will permanently delete this plan instance from your tracker.
            </p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeletePlan}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-red-700"
              >
                {isPending && <Loader2 className="size-3.5 animate-spin" />}
                <span>Delete Plan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-black/10 px-3.5 py-1.5 text-[12px] font-medium text-[#666666] hover:bg-black/5 dark:border-white/10 dark:text-[#A1A1AA]"
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
