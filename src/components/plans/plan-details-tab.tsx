"use client";

import {
  Trophy,
  CheckCircle2,
  Calendar,
  BookOpen,
  Bookmark,
  Layers,
  Sparkles,
  FileText,
  Trash2,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanInstanceDetail } from "@/actions/plans";
import { deletePlanInstanceAction } from "@/actions/plans";
import { celebratePlanCompletion } from "@/lib/confetti";

type PlanDetailsTabProps = {
  plan: PlanInstanceDetail;
};

function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recorded";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recorded";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PlanDetailsTab({ plan }: PlanDetailsTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeletePlan = () => {
    startTransition(async () => {
      const res = await deletePlanInstanceAction({ instanceId: plan.id });
      if (res.success) {
        router.push("/plans");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Journey Completed Hero Card */}
      <div className="glass-panel rounded-[26px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#DDFD2C] text-black shadow-xs">
              <Trophy className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#82ADD4]">
                  Finished Plan
                </span>
                <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10.5px] font-medium text-black dark:bg-white/10 dark:text-white">
                  100% Completed
                </span>
              </div>
              <h3 className="mt-1 text-[20px] font-medium tracking-tight text-black dark:text-white">
                {plan.title}
              </h3>
              {plan.subtitle && (
                <p className="mt-0.5 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
                  {plan.subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => celebratePlanCompletion()}
            className="flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-xl border border-black/10 bg-black px-4 py-2 text-[12.5px] font-medium text-white shadow-xs transition-all hover:bg-black/85 dark:border-white/12 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            <Sparkles className="size-3.5" />
            <span>Celebrate 🎉</span>
          </button>
        </div>

        {plan.description && (
          <p className="border-t border-black/5 pt-4 text-[13px] leading-relaxed text-[#777777] dark:border-white/6 dark:text-[#A1A1AA]">
            {plan.description}
          </p>
        )}
      </div>

      {/* 2. Detailed Journey Specifications */}
      <div className="glass-panel rounded-[26px] p-6 space-y-4">
        <h4 className="text-[15px] font-semibold tracking-tight text-black dark:text-white">
          Plan Overview & Statistics
        </h4>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <BookOpen className="size-3.5 text-[#82ADD4]" />
              <span>Chapters</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-black dark:text-white">
              {plan.totalChapters} Chapters
            </p>
            <p className="text-[11px] text-[#888888] dark:text-[#71717A]">
              100% finished
            </p>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <Layers className="size-3.5 text-[#82ADD4]" />
              <span>Sessions & Parts</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-black dark:text-white">
              {plan.sessions.length} Sessions
            </p>
            <p className="text-[11px] text-[#888888] dark:text-[#71717A]">
              Across {plan.parts.length} part
              {plan.parts.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <Bookmark className="size-3.5 text-[#82ADD4]" />
              <span>Reading Tracker</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-black truncate dark:text-white">
              {plan.tracker.name}
            </p>
            <p className="text-[11px] text-[#888888] capitalize dark:text-[#71717A]">
              {plan.tracker.canon} canon
            </p>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <Calendar className="size-3.5 text-[#82ADD4]" />
              <span>Started On</span>
            </span>
            <p className="mt-1 text-[14px] font-medium text-black dark:text-white">
              {formatDisplayDate(plan.startDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <Trophy className="size-3.5 text-[#82ADD4]" />
              <span>Completed</span>
            </span>
            <p className="mt-1 text-[14px] font-medium text-black dark:text-white">
              {formatDisplayDate(plan.completedAt || plan.targetEndDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-black/6 bg-white/70 p-3.5 dark:border-white/8 dark:bg-white/3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#777777] uppercase tracking-wider dark:text-[#A1A1AA]">
              <FileText className="size-3.5 text-[#82ADD4]" />
              <span>Study Notes</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-black dark:text-white">
              {plan.notesCount} Note{plan.notesCount === 1 ? "" : "s"}
            </p>
            <p className="text-[11px] text-[#888888] dark:text-[#71717A]">
              In study journal
            </p>
          </div>
        </div>
      </div>

      {/* 3. Conquered Curriculum Breakdown */}
      <div className="glass-panel rounded-[26px] p-6 space-y-4">
        <h4 className="text-[15px] font-semibold tracking-tight text-black dark:text-white">
          Completed Curriculum Structure
        </h4>

        <div className="space-y-2.5">
          {plan.parts.map((part) => (
            <div
              key={part.partIndex}
              className="flex items-center justify-between rounded-xl border border-black/5 bg-white/60 p-3.5 dark:border-white/6 dark:bg-white/3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-black/5 text-black dark:bg-white/10 dark:text-white">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h5 className="text-[13.5px] font-medium text-black dark:text-white">
                    {part.title}
                  </h5>
                  <p className="text-[11.5px] text-[#777777] dark:text-[#9CA3AF]">
                    {part.subtitle}
                  </p>
                </div>
              </div>

              <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/8 dark:text-[#9CA3AF]">
                {part.totalSessions} Sessions
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Plan Record Management (Clean leave option without pacing controls) */}
      <div className="rounded-[24px] border border-black/6 bg-black/[0.02] p-5 dark:border-white/6 dark:bg-white/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h5 className="text-[13.5px] font-medium text-black dark:text-white">
              Plan Record Management
            </h5>
            <p className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
              This plan has finished. You can keep it as part of your completed
              reading history, or remove it.
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
          >
            <Trash2 className="size-3.5" />
            <span>Remove Finished Plan</span>
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
            <h6 className="text-[13px] font-semibold text-red-700 dark:text-red-300">
              Remove this completed plan record?
            </h6>
            <p className="mt-0.5 text-[12px] text-red-600 dark:text-red-400">
              This will remove the completed plan from your finished plans tab.
              Your read chapters in your tracker will remain intact.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleDeletePlan}
                className="rounded-lg bg-red-600 px-3.5 py-1 text-[12px] font-medium text-white hover:bg-red-700"
              >
                Yes, Remove Record
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-black/10 bg-white/80 px-3.5 py-1 text-[12px] font-medium text-black hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
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
