"use client";

import { useState, useTransition, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

const emptySubscribe = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Bell,
  FolderPlus,
  Coffee,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import type { ReadingPlanTemplate } from "@/data/readingPlans";
import { startPlanAction } from "@/actions/plans";
import {
  buildPlanSessions,
  exportPlanToPdf,
} from "@/lib/plans/export-plan-pdf";

type Props = {
  isOpen: boolean;
  onCloseAction: () => void;
  plan: ReadingPlanTemplate;
  activeTrackerId: string;
  trackerName?: string;
  onSuccessAction?: (instanceId: string) => void;
};

type WizardStep = "overview" | "pacing" | "schedule" | "review";

const WIZARD_STEPS: ReadonlyArray<{
  id: WizardStep;
  num: string;
  label: string;
}> = [
  { id: "overview", num: "01", label: "Overview" },
  { id: "pacing", num: "02", label: "Pacing" },
  { id: "schedule", num: "03", label: "Schedule" },
  { id: "review", num: "04", label: "Review" },
];

const WEEKDAYS = [
  { dayIndex: 0, label: "S", name: "Sun" },
  { dayIndex: 1, label: "M", name: "Mon" },
  { dayIndex: 2, label: "T", name: "Tue" },
  { dayIndex: 3, label: "W", name: "Wed" },
  { dayIndex: 4, label: "T", name: "Thu" },
  { dayIndex: 5, label: "F", name: "Fri" },
  { dayIndex: 6, label: "S", name: "Sat" },
];

const PRESET_DURATIONS = [14, 30, 60, 90, 180, 365];

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PlanSetupModal({
  isOpen,
  onCloseAction,
  plan,
  activeTrackerId,
  trackerName,
  onSuccessAction,
}: Props) {
  const router = useRouter();
  const isClient = useIsClient();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<WizardStep>("overview");
  const [maxStepReached, setMaxStepReached] = useState<number>(0);
  const [isCurriculumExpanded, setIsCurriculumExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Setup options
  const [pacingMode, setPacingMode] = useState<"scheduled" | "flexible">(
    plan.allowSelfPaced === false ? "scheduled" : "scheduled"
  );
  const [paceType, setPaceType] = useState<"by_daily_target" | "by_end_date">(
    "by_daily_target"
  );
  const [dailyChapters, setDailyChapters] = useState<number>(
    plan.defaultDailyTarget || 2
  );
  const [targetDays, setTargetDays] = useState<number>(
    plan.recommendedDays || 30
  );
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startDateStr, setStartDateStr] = useState<string>(getTodayString);
  const [autoCompletePastDays, setAutoCompletePastDays] =
    useState<boolean>(true);
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(false);
  const [reminderTime, setReminderTime] = useState<string>("08:00");
  const [createNoteFolder, setCreateNoteFolder] = useState<boolean>(true);

  // Calculations
  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedStartMidnight = useMemo(() => {
    const parts = startDateStr.split("-").map(Number);
    const d = new Date(parts[0] || 2026, (parts[1] || 1) - 1, parts[2] || 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [startDateStr]);

  const diffDaysFromToday = useMemo(() => {
    const diffMs = selectedStartMidnight.getTime() - todayMidnight.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }, [selectedStartMidnight, todayMidnight]);

  const isStartDateInPast =
    selectedStartMidnight.getTime() < todayMidnight.getTime();
  const isStartDateToday =
    selectedStartMidnight.getTime() === todayMidnight.getTime();

  // Active days safe mask
  const safeActiveDays = useMemo(() => {
    return activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];
  }, [activeDays]);

  const activeDaysMaskStr = useMemo(() => {
    let mask = "";
    for (let i = 0; i < 7; i++) {
      mask += safeActiveDays.includes(i) ? "1" : "0";
    }
    return mask;
  }, [safeActiveDays]);

  // Rest day detection for start date
  const isStartOnRestDay = useMemo(() => {
    if (pacingMode !== "scheduled") return false;
    return !safeActiveDays.includes(selectedStartMidnight.getDay());
  }, [pacingMode, safeActiveDays, selectedStartMidnight]);

  const firstActiveReadingDate = useMemo(() => {
    const cursor = new Date(selectedStartMidnight.getTime());
    cursor.setHours(0, 0, 0, 0);
    while (!safeActiveDays.includes(cursor.getDay())) {
      cursor.setDate(cursor.getDate() + 1);
    }
    return cursor;
  }, [selectedStartMidnight, safeActiveDays]);

  // Effective daily pace
  const effectiveDailyPace = useMemo(() => {
    if (plan.allowCustomPace === false) {
      return Math.max(1, plan.defaultDailyTarget);
    }
    if (paceType === "by_end_date") {
      const activeDaysPerWeek = Math.max(1, safeActiveDays.length);
      const estimatedActiveDays = Math.max(
        1,
        Math.round((targetDays * activeDaysPerWeek) / 7)
      );
      return Math.max(1, Math.ceil(plan.totalChapters / estimatedActiveDays));
    }
    return Math.max(1, dailyChapters);
  }, [plan, paceType, targetDays, safeActiveDays, dailyChapters]);

  // Projected End Date calculation
  const projectedEndDate = useMemo(() => {
    const totalReadingDaysNeeded = Math.ceil(
      plan.totalChapters / effectiveDailyPace
    );
    const cursor = new Date(selectedStartMidnight.getTime());
    cursor.setHours(0, 0, 0, 0);

    // Advance to first active reading day
    while (!safeActiveDays.includes(cursor.getDay())) {
      cursor.setDate(cursor.getDate() + 1);
    }

    let activeCount = 1;
    while (activeCount < totalReadingDaysNeeded) {
      cursor.setDate(cursor.getDate() + 1);
      if (safeActiveDays.includes(cursor.getDay())) {
        activeCount++;
      }
    }
    return cursor;
  }, [
    plan.totalChapters,
    effectiveDailyPace,
    selectedStartMidnight,
    safeActiveDays,
  ]);

  // Calculate past readings
  const pastReadingsCount = useMemo(() => {
    if (!isStartDateInPast || pacingMode !== "scheduled") return 0;
    const cursor = new Date(selectedStartMidnight.getTime());
    cursor.setHours(0, 0, 0, 0);
    while (!safeActiveDays.includes(cursor.getDay())) {
      cursor.setDate(cursor.getDate() + 1);
    }

    let pastCount = 0;
    for (let i = 0; i < plan.readings.length; i += effectiveDailyPace) {
      const chunk = plan.readings.slice(i, i + effectiveDailyPace);
      if (i > 0) {
        cursor.setDate(cursor.getDate() + 1);
        while (!safeActiveDays.includes(cursor.getDay())) {
          cursor.setDate(cursor.getDate() + 1);
        }
      }
      if (cursor.getTime() < todayMidnight.getTime()) {
        pastCount += chunk.length;
      } else {
        break;
      }
    }
    return pastCount;
  }, [
    isStartDateInPast,
    pacingMode,
    selectedStartMidnight,
    safeActiveDays,
    plan.readings,
    effectiveDailyPace,
    todayMidnight,
  ]);

  const remainingReadingsCount = Math.max(
    0,
    plan.readings.length - pastReadingsCount
  );
  const isPlanAlreadyExpired =
    pacingMode === "scheduled" &&
    isStartDateInPast &&
    remainingReadingsCount <= 0;

  const currentStepIdx = WIZARD_STEPS.findIndex((s) => s.id === step);

  if (!isOpen || !isClient) return null;

  // Step navigation guards: only allow jumping to steps already reached
  const handleStepClick = (targetIdx: number) => {
    if (targetIdx <= maxStepReached) {
      setStep(WIZARD_STEPS[targetIdx]!.id);
    }
  };

  const handleNext = () => {
    if (currentStepIdx < WIZARD_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setMaxStepReached((prev) => Math.max(prev, nextIdx));
      setStep(WIZARD_STEPS[nextIdx]!.id);
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setStep(WIZARD_STEPS[currentStepIdx - 1]!.id);
    }
  };

  // Toggle active weekday
  const handleToggleWeekday = (dayIdx: number) => {
    if (activeDays.includes(dayIdx)) {
      if (activeDays.length > 1) {
        setActiveDays(activeDays.filter((d) => d !== dayIdx));
      }
    } else {
      setActiveDays([...activeDays, dayIdx].sort());
    }
  };

  // Toggle reminder with Web Push permission prompt
  const handleToggleReminder = async () => {
    const nextVal = !reminderEnabled;
    if (nextVal) {
      if (typeof window !== "undefined" && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setErrorMessage(
            "Notification permission was not granted in your browser. Reminders will be logged in-app."
          );
        }
      }
    }
    setReminderEnabled(nextVal);
  };

  // Submission handler strictly guarded to Step 4 (review)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard: Prevent premature plan creation from any step prior to review
    if (step !== "review") {
      return;
    }

    setErrorMessage(null);

    if (isPlanAlreadyExpired) {
      setErrorMessage(
        "This plan has already finished in the past based on the selected start date. Please select a more recent start date."
      );
      return;
    }

    const formData = new FormData(e.currentTarget);
    const templateId = String(formData.get("templateId"));
    const trackerId = String(formData.get("trackerId"));
    const mode = String(formData.get("mode")) as "scheduled" | "flexible";
    const selectedPaceType = String(formData.get("paceType")) as
      "by_daily_target" | "by_end_date" | "self_paced";
    const startVal = String(formData.get("startDate"));
    const dailyTargetVal = Number(formData.get("dailyTarget"));
    const maskVal = String(formData.get("activeDaysMask"));
    const targetEndVal = formData.get("targetEndDate")
      ? String(formData.get("targetEndDate"))
      : undefined;
    const autoPastVal = formData.get("autoCompletePastDays") === "true";
    const reminderVal = formData.get("reminderEnabled") === "true";
    const reminderTimeVal = formData.get("reminderTime")
      ? String(formData.get("reminderTime"))
      : "08:00";
    const noteFolderVal = formData.get("createNoteFolder") === "true";

    startTransition(async () => {
      const res = await startPlanAction({
        templateId,
        trackerId,
        mode,
        paceType: selectedPaceType,
        startDate: startVal,
        dailyTarget: dailyTargetVal,
        targetEndDate: targetEndVal,
        activeDaysMask: maskVal,
        autoCompletePastDays: autoPastVal,
        reminderEnabled: reminderVal,
        reminderTime: reminderTimeVal,
        createNoteFolder: noteFolderVal,
      });

      if (res.success) {
        if (res.newlyUnlocked && res.newlyUnlocked.length > 0) {
          window.dispatchEvent(
            new CustomEvent("achievement-unlocked", {
              detail: res.newlyUnlocked,
            })
          );
        }
        onCloseAction();
        if (onSuccessAction) {
          onSuccessAction(res.instanceId);
        } else {
          router.push(`/plans/${res.instanceId}`);
        }
      } else {
        setErrorMessage(res.error);
      }
    });
  };

  const handleExportPdf = () => {
    const sessions = buildPlanSessions({
      readings: plan.readings,
      dailyTarget:
        pacingMode === "scheduled"
          ? effectiveDailyPace
          : plan.defaultDailyTarget,
      startDate: selectedStartMidnight,
      activeDays: safeActiveDays,
    });

    exportPlanToPdf({
      planTitle: plan.title,
      subtitle: plan.subtitle,
      category: plan.category,
      canonCompatibility: plan.canonCompatibility,
      totalChapters: plan.totalChapters,
      dailyTarget:
        pacingMode === "scheduled"
          ? effectiveDailyPace
          : plan.defaultDailyTarget,
      sessions,
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-setup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        onClick={onCloseAction}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="ui-card relative z-10 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border-subtle px-6 py-4.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim">
                Reading Plan Setup
              </span>
              {trackerName && (
                <span className="text-[11.5px] text-foreground-dim">
                  • {trackerName}
                </span>
              )}
            </div>
            <h2
              id="plan-setup-modal-title"
              className="mt-1 text-[18px] font-medium tracking-tight text-foreground"
            >
              {step === "overview" && "Plan Overview"}
              {step === "pacing" && "Pacing Style"}
              {step === "schedule" &&
                (pacingMode === "flexible"
                  ? "Routine & Preferences"
                  : "Schedule & Habits")}
              {step === "review" && "Review & Confirm"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCloseAction}
            aria-label="Close dialog"
            className="rounded-full p-2 text-foreground-dim hover:bg-surface-elevated hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Step Progress Bar: Distinctive Numeral Stages (No Green Check Mark) */}
        <div className="shrink-0 border-b border-border-subtle bg-surface-elevated px-6 py-3">
          {/* Subtle connecting track */}
          <div className="mb-2.5 grid grid-cols-4 gap-1.5">
            {WIZARD_STEPS.map((s, idx) => (
              <div
                key={s.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx <= currentStepIdx
                    ? "bg-primary"
                    : "bg-border-strong opacity-40"
                }`}
              />
            ))}
          </div>

          {/* Stepped Stage Chips */}
          <div className="flex items-center justify-between gap-1.5">
            {WIZARD_STEPS.map((s, idx) => {
              const isActive = step === s.id;
              const isPassed = idx < currentStepIdx;
              const isClickable = idx <= maxStepReached;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleStepClick(idx)}
                  className={`group relative flex items-center gap-2 rounded-xl px-3 py-1.5 text-left transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : isPassed
                        ? "cursor-pointer bg-surface text-foreground hover:bg-surface-elevated"
                        : "cursor-not-allowed opacity-40 text-foreground-dim"
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold tracking-wider ${
                      isActive
                        ? "text-primary-foreground"
                        : isPassed
                          ? "text-foreground-secondary"
                          : "text-foreground-dim"
                    }`}
                  >
                    {s.num}
                  </span>
                  <span
                    className={`text-[12px] font-medium ${
                      isActive ? "inline font-semibold" : "hidden sm:inline"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-[13px] text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: OVERVIEW */}
          {step === "overview" && (
            <div className="space-y-5">
              <div className="ui-card-elevated p-5">
                <div className="flex items-center gap-2">
                  <span className="ui-pill text-[11px] font-medium">
                    {plan.category}
                  </span>
                  <span className="ui-pill-primary text-[10px]">Blueprint</span>
                </div>
                <h3 className="mt-2.5 text-[21px] font-medium tracking-tight text-black dark:text-white">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="mt-0.5 text-[13.5px] font-normal text-[#666666] dark:text-[#9CA3AF]">
                    {plan.subtitle}
                  </p>
                )}
                <p className="mt-2.5 text-[13px] leading-relaxed text-[#777777] dark:text-[#A1A1AA]">
                  {plan.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                <div className="rounded-xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/4">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-[#777777] dark:text-[#A1A1AA]">
                    <BookOpen className="size-3.5 text-zinc-900 dark:text-white" />
                    <span>Chapters</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-black dark:text-white">
                    {plan.totalChapters}
                  </p>
                </div>
                <div className="rounded-xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/4">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-[#777777] dark:text-[#A1A1AA]">
                    <Clock className="size-3.5 text-zinc-900 dark:text-white" />
                    <span>Target Length</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-black dark:text-white">
                    {plan.recommendedDays} days
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-black/6 bg-white/70 p-3.5 sm:col-span-1 dark:border-white/8 dark:bg-white/4">
                  <span className="flex items-center gap-1.5 text-[11.5px] text-[#777777] dark:text-[#A1A1AA]">
                    <Sparkles className="size-3.5 text-zinc-900 dark:text-white" />
                    <span>Default Pace</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-black dark:text-white">
                    ~{plan.defaultDailyTarget} / day
                  </p>
                </div>
              </div>

              {/* Curriculum Accordion */}
              <div className="rounded-2xl border border-black/6 bg-white/50 p-4.5 dark:border-white/8 dark:bg-white/3">
                <button
                  type="button"
                  onClick={() => setIsCurriculumExpanded(!isCurriculumExpanded)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <h4 className="text-[14px] font-medium text-black dark:text-white">
                      Curriculum Breakdown
                    </h4>
                    <p className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
                      {plan.sections.length > 0
                        ? `${plan.sections.length} thematic sections`
                        : "Sequential scripture readings"}
                    </p>
                  </div>
                  {isCurriculumExpanded ? (
                    <ChevronUp className="size-4.5 text-[#888888]" />
                  ) : (
                    <ChevronDown className="size-4.5 text-[#888888]" />
                  )}
                </button>

                {isCurriculumExpanded && (
                  <div className="mt-3.5 max-h-52 space-y-2 overflow-y-auto border-t border-black/6 pt-3 text-[12.5px] dark:border-white/6">
                    {plan.sections.length > 0
                      ? plan.sections.map((sec, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-black/3 px-3 py-2 dark:bg-white/4"
                          >
                            <span className="font-medium text-black dark:text-white">
                              {sec.title}
                            </span>
                            <span className="text-[#888888] dark:text-[#9CA3AF]">
                              {sec.chaptersCount} ch
                            </span>
                          </div>
                        ))
                      : plan.readings.slice(0, 8).map((r, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-black/3 px-3 py-2 dark:bg-white/4"
                          >
                            <span className="font-medium text-black dark:text-white">
                              {r.displayText || `${r.bookName} ${r.chapter}`}
                            </span>
                            <span className="text-[#888888] dark:text-[#9CA3AF]">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                    {plan.readings.length > 8 && plan.sections.length === 0 && (
                      <p className="pt-1.5 text-center text-[11.5px] text-[#888888]">
                        + {plan.readings.length - 8} additional readings
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PACING STYLE */}
          {step === "pacing" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-medium text-black dark:text-white">
                  Choose your pacing style
                </h3>
                <p className="mt-0.5 text-[13px] text-[#777777] dark:text-[#9CA3AF]">
                  Select the structure that best fits your daily rhythm.
                </p>
              </div>

              {/* Option A: Scheduled Calendar */}
              <button
                type="button"
                onClick={() => setPacingMode("scheduled")}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4.5 text-left transition-all cursor-pointer ${
                  pacingMode === "scheduled"
                    ? "border-primary bg-primary-muted shadow-xs"
                    : "border-border bg-surface hover:bg-surface-elevated"
                }`}
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    pacingMode === "scheduled"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface-elevated text-foreground-dim"
                  }`}
                >
                  <Calendar className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-medium text-foreground">
                      Scheduled Calendar
                    </span>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        pacingMode === "scheduled"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {pacingMode === "scheduled" && (
                        <div className="size-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-foreground-secondary">
                    Structured reading calendar with daily targets, projected
                    finish dates, custom weekly rest days, and smart catch-up
                    rebalancing.
                  </p>
                </div>
              </button>

              {/* Option B: Self-Paced */}
              <button
                type="button"
                disabled={plan.allowSelfPaced === false}
                onClick={() => setPacingMode("flexible")}
                className={`flex w-full items-start gap-4 rounded-2xl border p-4.5 text-left transition-all ${
                  plan.allowSelfPaced === false
                    ? "opacity-50 cursor-not-allowed border-border bg-surface-subtle"
                    : pacingMode === "flexible"
                      ? "border-primary bg-primary-muted shadow-xs cursor-pointer"
                      : "border-border bg-surface hover:bg-surface-elevated cursor-pointer"
                }`}
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    pacingMode === "flexible"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-surface-elevated text-foreground-dim"
                  }`}
                >
                  <Sparkles className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-medium text-foreground">
                        Self-Paced (Flexible)
                      </span>
                      {plan.allowSelfPaced === false && (
                        <span className="ui-pill text-[10.5px]">
                          Fixed Itinerary
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex size-5 items-center justify-center rounded-full border ${
                        pacingMode === "flexible"
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {pacingMode === "flexible" && (
                        <div className="size-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#666666] dark:text-[#A1A1AA]">
                    Read freely without calendar deadlines or overdue notices.
                    Check off chapters as you complete them.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* STEP 3: SCHEDULE & PREFERENCES */}
          {step === "schedule" && (
            <div className="space-y-5">
              {pacingMode === "flexible" ? (
                /* SELF-PACED SCHEDULE CONFIGURATION */
                <div className="space-y-4">
                  {/* Start Date */}
                  <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-medium text-black dark:text-white">
                        Plan Start Date
                      </label>
                      <span className="rounded-md bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                        {isStartDateToday
                          ? "Starts Today"
                          : diffDaysFromToday < 0
                            ? `${Math.abs(diffDaysFromToday)}d ago`
                            : `In ${diffDaysFromToday}d`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => setStartDateStr(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[13px] text-black shadow-2xs focus:border-black focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Daily Reading Reminder */}
                  <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                          <Bell className="size-4.5" />
                        </div>
                        <div>
                          <span className="text-[13.5px] font-medium text-black dark:text-white">
                            Daily Reading Reminder
                          </span>
                          <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                            Receive a daily notification in your browser
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={handleToggleReminder}
                        className="size-4.5 rounded accent-black dark:accent-white"
                      />
                    </label>

                    {reminderEnabled && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-black/4 p-2.5 pl-3.5 dark:bg-white/4">
                        <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                          Reminder Time
                        </span>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.preventDefault();
                          }}
                          className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[12px] font-medium text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dedicated Study Journal Folder */}
                  <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white">
                          <FolderPlus className="size-4.5" />
                        </div>
                        <div>
                          <span className="text-[13.5px] font-medium text-black dark:text-white">
                            Create Study Journal Folder
                          </span>
                          <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                            Group all notes taken during this plan in &ldquo;
                            {plan.title}&rdquo;
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={createNoteFolder}
                        onChange={(e) => setCreateNoteFolder(e.target.checked)}
                        className="size-4.5 rounded accent-black dark:accent-white"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                /* SCHEDULED CALENDAR CONFIGURATION */
                <>
                  {/* Daily Target / End Date Steppers */}
                  {plan.allowCustomPace !== false ? (
                    <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                      {/* Sub-mode switcher */}
                      <div className="flex items-center justify-between border-b border-black/6 pb-3 dark:border-white/6">
                        <label className="text-[13px] font-medium text-black dark:text-white">
                          Pacing Calculation
                        </label>
                        <div className="flex items-center gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/6">
                          <button
                            type="button"
                            onClick={() => setPaceType("by_daily_target")}
                            className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                              paceType === "by_daily_target"
                                ? "bg-white font-semibold text-black shadow-2xs dark:bg-white/15 dark:text-white"
                                : "text-[#777777] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                            }`}
                          >
                            Chapters / Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaceType("by_end_date")}
                            className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                              paceType === "by_end_date"
                                ? "bg-white font-semibold text-black shadow-2xs dark:bg-white/15 dark:text-white"
                                : "text-[#777777] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                            }`}
                          >
                            Target Duration
                          </button>
                        </div>
                      </div>

                      {paceType === "by_daily_target" ? (
                        <div className="mt-3.5 flex items-center justify-between">
                          <div>
                            <span className="text-[13px] font-medium text-black dark:text-white">
                              Daily Chapters Target
                            </span>
                            <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                              Spans ~
                              {Math.ceil(plan.totalChapters / dailyChapters)}{" "}
                              reading days
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setDailyChapters(Math.max(1, dailyChapters - 1))
                              }
                              className="flex size-9 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:text-white"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-[17px] font-semibold text-black dark:text-white">
                              {dailyChapters}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setDailyChapters(
                                  Math.min(50, dailyChapters + 1)
                                )
                              }
                              className="flex size-9 items-center justify-center rounded-xl border border-black/10 bg-white text-black shadow-2xs hover:bg-black/5 dark:border-white/15 dark:bg-white/10 dark:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[13px] font-medium text-black dark:text-white">
                                Target Total Duration
                              </span>
                              <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                                Requires ~{effectiveDailyPace} ch / reading day
                              </p>
                            </div>
                            <span className="text-[17px] font-semibold text-black dark:text-white">
                              {targetDays} days
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_DURATIONS.map((days) => (
                              <button
                                key={days}
                                type="button"
                                onClick={() => setTargetDays(days)}
                                className={`rounded-lg px-3 py-1.5 text-[11.5px] font-medium transition-all ${
                                  targetDays === days
                                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                    : "border border-border bg-surface text-foreground-secondary hover:bg-surface-elevated"
                                }`}
                              >
                                {days}d
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-black/6 bg-white/60 p-4 dark:border-white/8 dark:bg-white/3">
                      <span className="text-[12px] font-medium text-[#777777] dark:text-[#A1A1AA]">
                        Fixed Plan Schedule
                      </span>
                      <p className="text-[14.5px] font-medium text-black dark:text-white">
                        {plan.defaultDailyTarget} Chapters / Day (Fixed
                        Itinerary)
                      </p>
                    </div>
                  )}

                  {/* Compact Weekly Rest Days Selector */}
                  <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-medium text-black dark:text-white">
                        Weekly Reading Days
                      </label>
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        {safeActiveDays.length} active /{" "}
                        {7 - safeActiveDays.length} rest
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                      Tap days to toggle reading on or off (rest days).
                    </p>

                    {/* Compact Circular Chips */}
                    <div className="mt-3.5 flex items-center justify-center gap-2 sm:gap-3">
                      {WEEKDAYS.map((w) => {
                        const isActive = safeActiveDays.includes(w.dayIndex);
                        return (
                          <button
                            key={w.dayIndex}
                            type="button"
                            onClick={() => handleToggleWeekday(w.dayIndex)}
                            className={`flex size-9 sm:size-10 items-center justify-center rounded-full text-[13px] font-medium transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "border border-border bg-surface text-foreground-secondary hover:bg-surface-elevated"
                            }`}
                          >
                            <span>{w.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {safeActiveDays.length < 7 && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-[11.5px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                        <Coffee className="size-3.5 shrink-0" />
                        <span>
                          Rest days pause new readings without streak penalties.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Start Date & Migration Options */}
                  <div className="rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-medium text-black dark:text-white">
                        Plan Start Date
                      </label>
                      <span className="rounded-md bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                        {isStartDateToday
                          ? "Starts Today"
                          : diffDaysFromToday < 0
                            ? `${Math.abs(diffDaysFromToday)}d ago`
                            : `In ${diffDaysFromToday}d`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => setStartDateStr(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2 text-[13px] text-black shadow-2xs focus:border-black focus:outline-none dark:border-white/15 dark:bg-white/5 dark:text-white"
                      />
                    </div>

                    {/* Rest Day Alert */}
                    {isStartOnRestDay && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-[11.5px] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        <Coffee className="size-4 shrink-0 mt-0.5" />
                        <span>
                          Selected start date falls on a rest day. Day 1
                          readings will begin on{" "}
                          <strong>
                            {formatDateDisplay(firstActiveReadingDate)}
                          </strong>
                          .
                        </span>
                      </div>
                    )}

                    {/* Past Date Migration Checkbox */}
                    {isStartDateInPast && pastReadingsCount > 0 && (
                      <div className="mt-3 rounded-xl border border-black/8 bg-white/80 p-3.5 dark:border-white/10 dark:bg-white/5">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoCompletePastDays}
                            onChange={(e) =>
                              setAutoCompletePastDays(e.target.checked)
                            }
                            className="mt-0.5 size-4 rounded accent-black dark:accent-white"
                          />
                          <div>
                            <span className="text-[12.5px] font-medium text-black dark:text-white">
                              Mark Previous Sessions as Read
                            </span>
                            <p className="mt-0.5 text-[11px] text-[#666666] dark:text-[#9CA3AF]">
                              Auto-complete {pastReadingsCount} reading items up
                              to today. Perfect for migrating your progress from
                              another Bible app.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Preferences: Reminder & Note Folder */}
                  <div className="space-y-3 rounded-2xl border border-black/6 bg-white/60 p-4.5 dark:border-white/8 dark:bg-white/3">
                    {/* Note Folder Option */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8.5 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white">
                          <FolderPlus className="size-4" />
                        </div>
                        <div>
                          <span className="text-[13px] font-medium text-black dark:text-white">
                            Study Journal Note Folder
                          </span>
                          <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                            Group all notes under &ldquo;{plan.title}&rdquo;
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={createNoteFolder}
                        onChange={(e) => setCreateNoteFolder(e.target.checked)}
                        className="size-4 rounded accent-black dark:accent-white"
                      />
                    </label>

                    {/* Reminder Option */}
                    <div className="border-t border-black/6 pt-3 dark:border-white/6">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8.5 items-center justify-center rounded-xl bg-black/5 text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                            <Bell className="size-4" />
                          </div>
                          <div>
                            <span className="text-[13px] font-medium text-black dark:text-white">
                              Daily Reading Reminder
                            </span>
                            <p className="text-[11px] text-[#777777] dark:text-[#9CA3AF]">
                              Browser reading prompt
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={reminderEnabled}
                          onChange={handleToggleReminder}
                          className="size-4 rounded accent-black dark:accent-white"
                        />
                      </label>

                      {reminderEnabled && (
                        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-black/4 p-2.5 pl-3.5 dark:bg-white/4">
                          <span className="text-[12px] text-[#777777] dark:text-[#A1A1AA]">
                            Reminder Time
                          </span>
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.preventDefault();
                            }}
                            className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[12px] font-medium text-black dark:border-white/10 dark:bg-white/10 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === "review" && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="rounded-2xl border border-black/8 bg-white/80 p-5 dark:border-white/10 dark:bg-white/4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  ENROLLMENT SUMMARY
                </span>
                <h3 className="mt-1 text-[19px] font-medium text-black dark:text-white">
                  {plan.title}
                </h3>

                <div className="mt-4 space-y-2.5 border-t border-black/6 pt-3.5 text-[13px] dark:border-white/6">
                  <div className="flex justify-between">
                    <span className="text-[#777777] dark:text-[#A1A1AA]">
                      Pacing Mode
                    </span>
                    <span className="font-medium text-black dark:text-white capitalize">
                      {pacingMode === "scheduled"
                        ? "Scheduled Calendar"
                        : "Self-Paced (Flexible)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777] dark:text-[#A1A1AA]">
                      Start Date
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {formatDateDisplay(selectedStartMidnight)}
                    </span>
                  </div>

                  {pacingMode === "scheduled" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[#777777] dark:text-[#A1A1AA]">
                          Daily Target
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {effectiveDailyPace} chapters / reading day
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#777777] dark:text-[#A1A1AA]">
                          Active Days
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {safeActiveDays.length} reading days / week
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#777777] dark:text-[#A1A1AA]">
                          Projected Completion
                        </span>
                        <span className="font-medium text-black dark:text-white">
                          {formatDateDisplay(projectedEndDate)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-[#777777] dark:text-[#A1A1AA]">
                        Total Chapters
                      </span>
                      <span className="font-medium text-black dark:text-white">
                        {plan.totalChapters} chapters (Open-ended)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#777777] dark:text-[#A1A1AA]">
                      Daily Reminder
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {reminderEnabled ? `At ${reminderTime}` : "Disabled"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#777777] dark:text-[#A1A1AA]">
                      Study Journal Folder
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {createNoteFolder ? `"${plan.title}"` : "Default"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Controls & Step 4 Form Submission */}
        <div className="shrink-0 flex items-center justify-between border-t border-border-subtle bg-surface px-6 py-4">
          <div>
            {currentStepIdx > 0 && (
              <button
                key="btn-modal-back"
                type="button"
                onClick={handleBack}
                className="ui-btn-secondary ui-btn-sm gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div>
            {step !== "review" ? (
              <button
                key="btn-modal-continue"
                type="button"
                onClick={handleNext}
                className="ui-btn-primary ui-btn-sm gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <form
                id="plan-enrollment-form"
                onSubmit={handleSubmit}
                className="inline-flex m-0 p-0"
              >
                {/* Hidden inputs for complete uncontrolled submission */}
                <input type="hidden" name="templateId" value={plan.id} />
                <input type="hidden" name="trackerId" value={activeTrackerId} />
                <input type="hidden" name="mode" value={pacingMode} />
                <input
                  type="hidden"
                  name="paceType"
                  value={pacingMode === "scheduled" ? paceType : "self_paced"}
                />
                <input type="hidden" name="startDate" value={startDateStr} />
                <input
                  type="hidden"
                  name="dailyTarget"
                  value={pacingMode === "scheduled" ? effectiveDailyPace : 1}
                />
                <input
                  type="hidden"
                  name="targetEndDate"
                  value={
                    pacingMode === "scheduled"
                      ? projectedEndDate.toISOString()
                      : ""
                  }
                />
                <input
                  type="hidden"
                  name="activeDaysMask"
                  value={activeDaysMaskStr}
                />
                <input
                  type="hidden"
                  name="autoCompletePastDays"
                  value={autoCompletePastDays ? "true" : "false"}
                />
                <input
                  type="hidden"
                  name="reminderEnabled"
                  value={reminderEnabled ? "true" : "false"}
                />
                <input type="hidden" name="reminderTime" value={reminderTime} />
                <input
                  type="hidden"
                  name="createNoteFolder"
                  value={createNoteFolder ? "true" : "false"}
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    data-testid="extract-plan-pdf-btn"
                    className="ui-btn-secondary ui-btn-sm gap-1.5 cursor-pointer"
                    title="Extract checklist to printable A4 PDF"
                  >
                    <Download className="size-3.5" />
                    <span>Extract to PDF</span>
                  </button>

                  <button
                    key="btn-modal-submit"
                    type="submit"
                    disabled={isPending || isPlanAlreadyExpired}
                    className="ui-btn-primary ui-btn-sm gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Enrolling Plan...</span>
                      </>
                    ) : (
                      <span>Confirm & Start Plan</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
