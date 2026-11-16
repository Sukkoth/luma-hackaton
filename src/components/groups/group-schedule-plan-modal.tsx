"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Sliders, Shield } from "lucide-react";
import * as v from "valibot";
import { READING_PLANS } from "@/data/readingPlans";
import { ScheduleGroupPlanSchema } from "@/lib/schemas/groups";
import { scheduleGroupPlanAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupSchedulePlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
};

const WEEKDAYS = [
  { index: 0, label: "M" },
  { index: 1, label: "T" },
  { index: 2, label: "W" },
  { index: 3, label: "T" },
  { index: 4, label: "F" },
  { index: 5, label: "S" },
  { index: 6, label: "S" },
];

export function GroupSchedulePlanModal({
  isOpen,
  onClose,
  groupId,
}: GroupSchedulePlanModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeWeekdays, setActiveWeekdays] = useState<boolean[]>([
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
  const [lateJoinPolicy, setLateJoinPolicy] = useState<
    "strict_locked" | "skip_ahead" | "backfill"
  >("skip_ahead");

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().slice(0, 10);

  function toggleWeekday(idx: number) {
    const updated = [...activeWeekdays];
    updated[idx] = !updated[idx];
    if (updated.some(Boolean)) {
      setActiveWeekdays(updated);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const planTemplateId = String(formData.get("planTemplateId") || "").trim();
    const scheduledStartDate = String(
      formData.get("scheduledStartDate") || ""
    ).trim();
    const dailyChapterTarget = Number(formData.get("dailyChapterTarget") || 3);

    const mask = activeWeekdays.map((b) => (b ? "1" : "0")).join("");

    const parsed = v.safeParse(ScheduleGroupPlanSchema, {
      groupId,
      planTemplateId,
      scheduledStartDate,
      dailyChapterTarget,
      activeWeekdaysMask: mask,
      lateJoinPolicy,
    });

    if (!parsed.success) {
      setError(parsed.issues[0]?.message || "Invalid schedule parameters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await scheduleGroupPlanAction({
        groupId,
        planTemplateId: parsed.output.planTemplateId,
        scheduledStartDate: parsed.output.scheduledStartDate,
        dailyChapterTarget: parsed.output.dailyChapterTarget,
        activeWeekdaysMask: parsed.output.activeWeekdaysMask,
        lateJoinPolicy: parsed.output.lateJoinPolicy,
      });

      if (!res.success) {
        setError(res.error || "Failed to schedule group plan.");
        setIsSubmitting(false);
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule plan.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="ui-card relative w-full max-w-lg p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-plan-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-surface-elevated text-foreground border border-border">
              <Calendar className="size-5" />
            </div>
            <div>
              <h2
                id="schedule-plan-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Schedule Fellowship Plan
              </h2>
              <p className="text-xs text-foreground-dim">
                Assign a synchronized reading curriculum for all cohort members.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-foreground-dim hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Plan Template Selector */}
          <div>
            <label
              htmlFor="plan-template"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Curated Plan Template <span className="text-destructive">*</span>
            </label>
            <select
              id="plan-template"
              name="planTemplateId"
              required
              className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            >
              {READING_PLANS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.totalChapters} chapters • {p.recommendedDays} days)
                </option>
              ))}
            </select>
          </div>

          {/* Grid: Start Date & Daily Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="start-date"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Scheduled Start Date
              </label>
              <input
                id="start-date"
                name="scheduledStartDate"
                type="date"
                defaultValue={todayStr}
                required
                className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="daily-target"
                className="block text-xs font-medium text-foreground mb-1.5"
              >
                Daily Chapters Target
              </label>
              <input
                id="daily-target"
                name="dailyChapterTarget"
                type="number"
                min={1}
                max={30}
                defaultValue={3}
                required
                className="w-full rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Active Weekdays Mask */}
          <div>
            <span className="block text-xs font-medium text-foreground mb-1.5">
              Reading Days Schedule
            </span>
            <div className="flex items-center gap-1.5">
              {WEEKDAYS.map((day) => {
                const isActive = activeWeekdays[day.index];
                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => toggleWeekday(day.index)}
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-surface-elevated text-foreground-dim border-border hover:text-foreground"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Late-Join Policy */}
          <div>
            <span className="block text-xs font-medium text-foreground mb-1.5">
              Late-Join Policy (for members enrolling mid-plan)
            </span>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setLateJoinPolicy("skip_ahead")}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lateJoinPolicy === "skip_ahead"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Skip Ahead (Recommended)
                  </span>
                  <span className="text-[11px] text-foreground-dim leading-snug block">
                    Members start on today&apos;s active session; previous chapters are omitted so they read alongside the cohort.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLateJoinPolicy("backfill")}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lateJoinPolicy === "backfill"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Backfill from Day 1
                  </span>
                  <span className="text-[11px] text-foreground-dim leading-snug block">
                    Members receive the full plan from Day 1 and start in a &quot;behind&quot; state with catch-up pacing.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLateJoinPolicy("strict_locked")}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  lateJoinPolicy === "strict_locked"
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-surface-elevated/40 text-foreground-dim hover:text-foreground"
                }`}
              >
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Strict Locked
                  </span>
                  <span className="text-[11px] text-foreground-dim leading-snug block">
                    Enrollment locks as soon as the scheduled start date begins.
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Schedule Plan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
