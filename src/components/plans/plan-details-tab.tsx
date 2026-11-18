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
  ExternalLink,
  Plus,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
      <div className="ui-card space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary bg-primary text-primary-foreground shadow-xs">
              <Trophy className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary">
                  100% Completed
                </span>
              </div>
              <h3 className="mt-1 text-[20px] font-bold tracking-tight text-foreground">
                {plan.title}
              </h3>
              {plan.subtitle && (
                <p className="mt-0.5 text-[13px] text-foreground-dim">
                  {plan.subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => celebratePlanCompletion()}
            className="ui-btn-primary ui-btn-sm self-start sm:self-auto gap-1.5"
          >
            <Sparkles className="size-3.5" />
            <span>Celebrate 🎉</span>
          </button>
        </div>

        {plan.description && (
          <p className="border-t border-border pt-4 text-[13px] leading-relaxed text-foreground-secondary">
            {plan.description}
          </p>
        )}
      </div>

      {/* 2. Detailed Journey Specifications */}
      <div className="ui-card space-y-4 p-6">
        <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
          Plan Overview & Statistics
        </h4>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
              <BookOpen className="size-3.5 text-primary" />
              <span>Chapters</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {plan.totalChapters} Chapters
            </p>
            <p className="text-[11px] text-foreground-dim">
              100% finished
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
              <Layers className="size-3.5 text-primary" />
              <span>Sessions & Parts</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {plan.sessions.length} Sessions
            </p>
            <p className="text-[11px] text-foreground-dim">
              Across {plan.parts.length} part
              {plan.parts.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
              <Bookmark className="size-3.5 text-primary" />
              <span>Reading Tracker</span>
            </span>
            <p className="mt-1 text-[16px] font-semibold text-foreground truncate">
              {plan.tracker.name}
            </p>
            <p className="text-[11px] text-foreground-dim capitalize">
              {plan.tracker.canon} canon
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
              <Calendar className="size-3.5 text-primary" />
              <span>Started On</span>
            </span>
            <p className="mt-1 text-[14px] font-medium text-foreground">
              {formatDisplayDate(plan.startDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-elevated/60 p-3.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-foreground-secondary">
              <Trophy className="size-3.5 text-primary" />
              <span>Completed</span>
            </span>
            <p className="mt-1 text-[14px] font-medium text-foreground">
              {formatDisplayDate(plan.completedAt || plan.targetEndDate)}
            </p>
          </div>

          <Link
            href={`/notes?planId=${plan.id}`}
            className="group block rounded-2xl border border-border bg-surface-elevated/60 p-3.5 hover:border-primary/40 hover:bg-surface-elevated transition-all"
          >
            <span className="flex items-center justify-between text-xs font-medium text-foreground-secondary">
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Study Notes</span>
              </span>
              <ExternalLink className="size-3 text-foreground-dim group-hover:text-primary transition-colors" />
            </span>
            <p className="mt-1 text-[16px] font-semibold text-foreground">
              {plan.notesCount} Note{plan.notesCount === 1 ? "" : "s"}
            </p>
            <p className="text-[11px] text-foreground-dim">
              View in study journal →
            </p>
          </Link>
        </div>
      </div>

      {/* 3. Completed Plan Study Reflections */}
      <div className="ui-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold tracking-tight text-foreground">
              Plan Study Reflections
            </h4>
            <span className="rounded-full bg-surface-elevated border border-border px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary">
              {plan.notes.length}
            </span>
          </div>

          <Link
            href={`/notes?planId=${plan.id}`}
            className="ui-btn-secondary ui-btn-sm gap-1.5"
          >
            <ExternalLink className="size-3.5" />
            <span>Open in Journal</span>
          </Link>
        </div>

        {plan.notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes?noteId=${note.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface-elevated/50 p-3.5 hover:border-primary/40 hover:bg-surface-elevated transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-[10.5px] text-foreground-dim">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="size-3" />
                      <span>{formatDisplayDate(note.createdAt)}</span>
                    </span>
                    {note.planSessionId && (
                      <span className="rounded-md bg-surface border border-border px-1.5 py-0.2 text-[9.5px] text-foreground-secondary">
                        Session {note.planSessionId}
                      </span>
                    )}
                  </div>
                  <h5 className="mt-1.5 text-[13.5px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {note.title}
                  </h5>
                  <p className="mt-1 text-[12px] leading-relaxed text-foreground-secondary line-clamp-2">
                    {note.plainTextSnippet || "No preview recorded."}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-foreground-dim">
                  <span>View full note</span>
                  <span className="font-medium group-hover:translate-x-0.5 transition-transform text-foreground">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-[12.5px] text-foreground-secondary">
              No notes were recorded during this plan. You can still add
              reflections anytime.
            </p>
            <Link
              href={`/notes?planId=${plan.id}`}
              className="ui-btn-primary ui-btn-sm mt-3 gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Write Reflection in Journal</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Conquered Curriculum Breakdown */}
      <div className="ui-card p-6 space-y-4">
        <h4 className="text-[15px] font-bold tracking-tight text-foreground">
          Completed Curriculum Structure
        </h4>

        <div className="space-y-2.5">
          {plan.parts.map((part) => (
            <div
              key={part.partIndex}
              className="flex items-center justify-between rounded-xl border border-border bg-surface-elevated/40 p-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h5 className="text-[13.5px] font-medium text-foreground">
                    {part.title}
                  </h5>
                  <p className="text-[11.5px] text-foreground-dim">
                    {part.subtitle}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-surface-elevated border border-border px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary">
                {part.totalSessions} Sessions
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Plan Record Management (Clean leave option without pacing controls) */}
      <div className="ui-card-elevated p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h5 className="text-[13.5px] font-medium text-foreground">
              Plan Record Management
            </h5>
            <p className="text-[12px] text-foreground-dim">
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
                className="ui-btn-destructive ui-btn-sm"
              >
                Yes, Remove Record
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
