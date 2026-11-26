"use client";

import { useState, useTransition, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

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
import { DatePicker } from "@/components/ui/date-picker";
import {
  buildPlanSessions,
  exportPlanToPdf,
} from "@/lib/plans/export-plan-pdf";
import { requestAndSubscribePush } from "@/lib/push-client";
import { ReminderTimeSelect } from "@/components/ui/reminder-time-select";

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
  const { data: session } = useSession();
  const isClient = useIsClient();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<WizardStep>("overview");
  const [maxStepReached, setMaxStepReached] = useState<number>(0);
  const [isCurriculumExpanded, setIsCurriculumExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Setup options
  const hasCuratedSessions = useMemo(
    () => plan.readings.some((r) => r.dayNumber != null),
    [plan.readings]
  );
  const curatedDaysCount = useMemo(() => {
    if (!hasCuratedSessions) return plan.recommendedDays || 30;
    const uniqueDays = new Set(
      plan.readings
        .map((r) => r.dayNumber)
        .filter((d): d is number => typeof d === "number" && d > 0)
    );
    return uniqueDays.size || plan.recommendedDays || 365;
  }, [hasCuratedSessions, plan]);

  const [pacingMode, setPacingMode] = useState<"scheduled" | "flexible">(
    plan.allowSelfPaced === false ? "scheduled" : "scheduled"
  );
  const [paceType, setPaceType] = useState<
    "curated" | "by_daily_target" | "by_end_date"
  >(hasCuratedSessions ? "curated" : "by_daily_target");
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
    if (paceType === "curated") {
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
    const totalReadingDaysNeeded =
      paceType === "curated"
        ? curatedDaysCount
        : Math.ceil(plan.totalChapters / effectiveDailyPace);
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
    paceType,
    curatedDaysCount,
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
    const sessionChunks: (typeof plan.readings)[] = [];
    if (paceType === "curated" && hasCuratedSessions) {
      const dayMap = new Map<number, typeof plan.readings>();
      for (const r of plan.readings) {
        const day = r.dayNumber ?? 1;
        const list = dayMap.get(day) ?? [];
        list.push(r);
        dayMap.set(day, list);
      }
      const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a - b);
      for (const d of sortedDays) {
        const items = dayMap.get(d);
        if (items && items.length > 0) {
          sessionChunks.push(items);
        }
      }
    } else {
      for (let i = 0; i < plan.readings.length; i += effectiveDailyPace) {
        sessionChunks.push(plan.readings.slice(i, i + effectiveDailyPace));
      }
    }

    for (let i = 0; i < sessionChunks.length; i++) {
      const chunk = sessionChunks[i]!;
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
    paceType,
    hasCuratedSessions,
    selectedStartMidnight,
    safeActiveDays,
    plan,
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
      const pushRes = await requestAndSubscribePush();
      if (!pushRes.success && pushRes.permission !== "granted") {
        setErrorMessage(
          "Notification permission was not granted in your browser. Reminders will be logged in-app."
        );
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
      "curated" | "by_daily_target" | "by_end_date" | "self_paced";
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
      paceType: pacingMode === "scheduled" ? paceType : "self_paced",
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
                  <span className="text-xs font-semibold text-primary">
                    {plan.category} Blueprint
                  </span>
                </div>
                <h3 className="mt-2.5 text-[21px] font-semibold tracking-tight text-foreground">
                  {plan.title}
                </h3>
                {plan.subtitle && (
                  <p className="mt-0.5 text-[13.5px] font-normal text-foreground-secondary">
                    {plan.subtitle}
                  </p>
                )}
                <p className="mt-2.5 text-[13px] leading-relaxed text-foreground-dim">
                  {plan.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-elevated/70 p-3.5">
                  <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                    <BookOpen className="size-3.5 text-primary" />
                    <span>Chapters</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-foreground">
                    {plan.totalChapters}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated/70 p-3.5">
                  <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                    <Clock className="size-3.5 text-primary" />
                    <span>Target Length</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-foreground">
                    {plan.recommendedDays} days
                  </p>
                </div>
                <div className="col-span-2 rounded-xl border border-border bg-surface-elevated/70 p-3.5 sm:col-span-1">
                  <span className="flex items-center gap-1.5 text-xs text-foreground-secondary">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>Default Pace</span>
                  </span>
                  <p className="mt-1 text-[20px] font-semibold text-foreground">
                    ~{plan.defaultDailyTarget} / day
                  </p>
                </div>
              </div>

              {/* Curriculum Accordion */}
              <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                <button
                  type="button"
                  onClick={() => setIsCurriculumExpanded(!isCurriculumExpanded)}
                  className="flex w-full items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <h4 className="text-[14px] font-semibold text-foreground">
                      Curriculum Breakdown
                    </h4>
                    <p className="text-[12px] text-foreground-secondary">
                      {plan.sections.length > 0
                        ? `${plan.sections.length} thematic sections`
                        : "Sequential scripture readings"}
                    </p>
                  </div>
                  {isCurriculumExpanded ? (
                    <ChevronUp className="size-4.5 text-foreground-dim" />
                  ) : (
                    <ChevronDown className="size-4.5 text-foreground-dim" />
                  )}
                </button>

                {isCurriculumExpanded && (
                  <div className="mt-3.5 max-h-52 space-y-2 overflow-y-auto border-t border-border pt-3 text-[12.5px]">
                    {plan.sections.length > 0
                      ? plan.sections.map((sec, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 border border-border/50"
                          >
                            <span className="font-medium text-foreground">
                              {sec.title}
                            </span>
                            <span className="text-foreground-dim">
                              {sec.chaptersCount} ch
                            </span>
                          </div>
                        ))
                      : plan.readings.slice(0, 8).map((r, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 border border-border/50"
                          >
                            <span className="font-medium text-foreground">
                              {r.displayText || `${r.bookName} ${r.chapter}`}
                            </span>
                            <span className="text-foreground-dim">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                    {plan.readings.length > 8 && plan.sections.length === 0 && (
                      <p className="pt-1.5 text-center text-[11.5px] text-foreground-dim">
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
                <h3 className="text-[16px] font-semibold text-foreground">
                  Choose your pacing style
                </h3>
                <p className="mt-0.5 text-[13px] text-foreground-secondary">
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
                        <span className="rounded-full bg-surface-elevated border border-border px-2 py-0.5 text-[10.5px] font-medium text-foreground-secondary">
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
                  <p className="mt-1 text-[12.5px] leading-relaxed text-foreground-secondary">
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
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-semibold text-foreground">
                        Plan Start Date
                      </label>
                      <span className="rounded-md bg-surface border border-border px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary">
                        {isStartDateToday
                          ? "Starts Today"
                          : diffDaysFromToday < 0
                            ? `${Math.abs(diffDaysFromToday)}d ago`
                            : `In ${diffDaysFromToday}d`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <DatePicker
                        date={startDateStr}
                        onDateChange={(_, dateStr) => setStartDateStr(dateStr)}
                      />
                    </div>
                  </div>

                  {/* Daily Reading Reminder */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-surface border border-border text-foreground">
                          <Bell className="size-4.5 text-primary" />
                        </div>
                        <div>
                          <span className="text-[13.5px] font-semibold text-foreground">
                            Daily Reading Reminder
                          </span>
                          <p className="text-[11.5px] text-foreground-secondary">
                            Receive a daily notification in your browser
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={handleToggleReminder}
                        className="size-4.5 rounded accent-primary"
                      />
                    </label>

                    {reminderEnabled && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-surface p-2.5 pl-3.5 border border-border">
                        <span className="text-[12px] text-foreground-secondary">
                          Reminder Time
                        </span>
                        <ReminderTimeSelect
                          value={reminderTime}
                          onChange={setReminderTime}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dedicated Study Journal Folder */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
                          <FolderPlus className="size-4.5 text-primary" />
                        </div>
                        <div>
                          <span className="text-[13.5px] font-semibold text-foreground">
                            Create Study Journal Folder
                          </span>
                          <p className="text-[11.5px] text-foreground-secondary">
                            Group all notes taken during this plan in &ldquo;
                            {plan.title}&rdquo;
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={createNoteFolder}
                        onChange={(e) => setCreateNoteFolder(e.target.checked)}
                        className="size-4.5 rounded accent-primary"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                /* SCHEDULED CALENDAR CONFIGURATION */
                <>
                  {/* Daily Target / End Date Steppers */}
                  {plan.allowCustomPace !== false ? (
                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                      {/* Sub-mode switcher */}
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <label className="text-[13px] font-semibold text-foreground">
                          Pacing Calculation
                        </label>
                        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border">
                          {hasCuratedSessions && (
                            <button
                              type="button"
                              onClick={() => setPaceType("curated")}
                              className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                                paceType === "curated"
                                  ? "bg-primary font-semibold text-primary-foreground shadow-2xs"
                                  : "text-foreground-secondary hover:text-foreground"
                              }`}
                            >
                              Curated Schedule
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setPaceType("by_daily_target")}
                            className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                              paceType === "by_daily_target"
                                ? "bg-primary font-semibold text-primary-foreground shadow-2xs"
                                : "text-foreground-secondary hover:text-foreground"
                            }`}
                          >
                            Chapters / Day
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaceType("by_end_date")}
                            className={`rounded-lg px-3 py-1 text-[11.5px] font-medium transition-all ${
                              paceType === "by_end_date"
                                ? "bg-primary font-semibold text-primary-foreground shadow-2xs"
                                : "text-foreground-secondary hover:text-foreground"
                            }`}
                          >
                            Target Duration
                          </button>
                        </div>
                      </div>

                      {paceType === "curated" ? (
                        <div className="mt-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[13px] font-semibold text-foreground">
                                Original Narrative Schedule
                              </span>
                              <p className="text-[11.5px] text-foreground-secondary">
                                Spans {curatedDaysCount} scheduled days (~
                                {plan.defaultDailyTarget} ch/day average)
                              </p>
                            </div>
                            <span className="rounded-full bg-surface border border-border px-2.5 py-1 text-[11.5px] font-medium text-foreground">
                              {curatedDaysCount} days
                            </span>
                          </div>
                          <p className="rounded-xl bg-surface/60 p-3 text-[12px] text-foreground-secondary border border-border/50 leading-relaxed">
                            Chapters follow the author&apos;s curated narrative
                            itinerary preserving historical events. Daily
                            chapter counts vary naturally (1–8 chapters).
                          </p>
                        </div>
                      ) : paceType === "by_daily_target" ? (
                        <div className="mt-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[13px] font-semibold text-foreground">
                                Daily Chapters Target
                              </span>
                              <p className="text-[11.5px] text-foreground-secondary">
                                Spans ~
                                {Math.ceil(plan.totalChapters / dailyChapters)}{" "}
                                reading days
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setDailyChapters(
                                    Math.max(1, dailyChapters - 1)
                                  )
                                }
                                className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-2xs hover:bg-surface-elevated cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-10 text-center text-[17px] font-semibold text-foreground">
                                {dailyChapters}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDailyChapters(
                                    Math.min(50, dailyChapters + 1)
                                  )
                                }
                                className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground shadow-2xs hover:bg-surface-elevated cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {hasCuratedSessions && (
                            <p className="rounded-lg bg-surface/60 px-3 py-2 text-[11.5px] text-primary border border-border/50 font-medium">
                              Custom pace: Chapters will be distributed evenly
                              into sessions of {dailyChapters} chapters.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3.5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[13px] font-semibold text-foreground">
                                Target Total Duration
                              </span>
                              <p className="text-[11.5px] text-foreground-secondary">
                                Requires ~{effectiveDailyPace} ch / reading day
                              </p>
                            </div>
                            <span className="text-[17px] font-semibold text-foreground">
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
                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4">
                      <span className="text-[12px] font-medium text-foreground-dim">
                        Fixed Plan Schedule
                      </span>
                      <p className="text-[14.5px] font-medium text-foreground">
                        {plan.defaultDailyTarget} Chapters / Day (Fixed
                        Itinerary)
                      </p>
                    </div>
                  )}

                  {/* Compact Weekly Rest Days Selector */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-semibold text-foreground">
                        Weekly Reading Days
                      </label>
                      <span className="text-[11px] font-medium text-foreground-dim">
                        {safeActiveDays.length} active /{" "}
                        {7 - safeActiveDays.length} rest
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-foreground-secondary">
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
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-surface p-2.5 text-[11.5px] text-foreground-secondary">
                        <Coffee className="size-3.5 shrink-0 text-primary" />
                        <span>
                          Rest days pause new readings without streak penalties.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Start Date & Migration Options */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[13.5px] font-semibold text-foreground">
                        Plan Start Date
                      </label>
                      <span className="rounded-md bg-surface border border-border px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary">
                        {isStartDateToday
                          ? "Starts Today"
                          : diffDaysFromToday < 0
                            ? `${Math.abs(diffDaysFromToday)}d ago`
                            : `In ${diffDaysFromToday}d`}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <DatePicker
                        date={startDateStr}
                        onDateChange={(_, dateStr) => setStartDateStr(dateStr)}
                      />
                    </div>

                    {/* Rest Day Alert */}
                    {isStartOnRestDay && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11.5px] text-amber-700 dark:text-amber-400">
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
                      <div className="mt-3 rounded-xl border border-border bg-surface p-3.5">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoCompletePastDays}
                            onChange={(e) =>
                              setAutoCompletePastDays(e.target.checked)
                            }
                            className="mt-0.5 size-4 rounded accent-primary"
                          />
                          <div>
                            <span className="text-[12.5px] font-semibold text-foreground">
                              Mark Previous Sessions as Read
                            </span>
                            <p className="mt-0.5 text-[11px] text-foreground-secondary">
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
                  <div className="space-y-3 rounded-2xl border border-border bg-surface-elevated/40 p-4.5">
                    {/* Note Folder Option */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8.5 items-center justify-center rounded-xl border border-border bg-surface text-foreground">
                          <FolderPlus className="size-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-[13px] font-semibold text-foreground">
                            Study Journal Note Folder
                          </span>
                          <p className="text-[11px] text-foreground-secondary">
                            Group all notes under &ldquo;{plan.title}&rdquo;
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={createNoteFolder}
                        onChange={(e) => setCreateNoteFolder(e.target.checked)}
                        className="size-4 rounded accent-primary"
                      />
                    </label>

                    {/* Reminder Option */}
                    <div className="border-t border-border pt-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8.5 items-center justify-center rounded-xl bg-surface border border-border text-foreground">
                            <Bell className="size-4 text-primary" />
                          </div>
                          <div>
                            <span className="text-[13px] font-semibold text-foreground">
                              Daily Reading Reminder
                            </span>
                            <p className="text-[11px] text-foreground-secondary">
                              Browser reading prompt
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={reminderEnabled}
                          onChange={handleToggleReminder}
                          className="size-4 rounded accent-primary"
                        />
                      </label>

                      {reminderEnabled && (
                        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-surface p-2.5 pl-3.5 border border-border">
                          <span className="text-[12px] text-foreground-secondary">
                            Reminder Time
                          </span>
                          <ReminderTimeSelect
                            value={reminderTime}
                            onChange={setReminderTime}
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
              <div className="rounded-2xl border border-border bg-surface-elevated/70 p-5">
                <span className="text-xs font-semibold text-primary">
                  ENROLLMENT SUMMARY
                </span>
                <h3 className="mt-1 text-[19px] font-semibold text-foreground">
                  {plan.title}
                </h3>

                <div className="mt-4 space-y-2.5 border-t border-border pt-3.5 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">
                      Pacing Mode
                    </span>
                    <span className="font-semibold text-foreground capitalize">
                      {pacingMode === "scheduled"
                        ? "Scheduled Calendar"
                        : "Self-Paced (Flexible)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">
                      Start Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatDateDisplay(selectedStartMidnight)}
                    </span>
                  </div>

                  {pacingMode === "scheduled" ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">
                          Daily Target
                        </span>
                        <span className="font-semibold text-foreground">
                          {paceType === "curated"
                            ? `Curated narrative pace (~${plan.defaultDailyTarget} ch/day avg)`
                            : `${effectiveDailyPace} chapters / reading day (even pace)`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">
                          Active Days
                        </span>
                        <span className="font-semibold text-foreground">
                          {safeActiveDays.length} reading days / week
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground-secondary">
                          Projected Completion
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatDateDisplay(projectedEndDate)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">
                        Total Chapters
                      </span>
                      <span className="font-semibold text-foreground">
                        {plan.totalChapters} chapters (Open-ended)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">
                      Daily Reminder
                    </span>
                    <span className="font-semibold text-foreground">
                      {reminderEnabled ? `At ${reminderTime}` : "Disabled"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">
                      Study Journal Folder
                    </span>
                    <span className="font-semibold text-foreground">
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

                  {!session ? (
                    <Link
                      href={`/signup?redirect=${encodeURIComponent("/plans")}`}
                      className="ui-btn-primary ui-btn-sm gap-2"
                    >
                      <span>Sign Up to Start Plan</span>
                    </Link>
                  ) : (
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
                  )}
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
