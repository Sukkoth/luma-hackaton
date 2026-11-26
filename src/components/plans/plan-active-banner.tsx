"use client";

import Link from "next/link";
import { Compass, LogIn, Play, Plus, Upload } from "lucide-react";
import { LumaIcon } from "@/components/ui/luma-icon";
import type { useSession } from "@/lib/auth-client";
import { READING_PLANS } from "@/data/readingPlans";
import {
  HeaderActions,
  HeaderActionButton,
} from "@/components/ui/header-action-button";

export type ActivePlanInstance = {
  id: string;
  templateId: string;
  title: string;
  currentPassage: string;
  dayText: string;
  progressPercent: number;
  readChapters: number;
  totalChapters: number;
  status: "On Track" | "Rest Buffer" | "Flexible" | "Paused" | "Finished";
  statusColor: string;
  completedAt?: string | null;
};

type SessionData = ReturnType<typeof useSession>["data"];

type Props = {
  session: SessionData;
  activePlanInstances: ReadonlyArray<ActivePlanInstance>;
  onBrowseCatalog?: () => void;
  onCreateCustom?: () => void;
  onImportPlan?: () => void;
};

export function PlanActiveBanner({
  session,
  activePlanInstances,
  onCreateCustom,
  onImportPlan,
}: Props) {
  const activePlan = activePlanInstances[0];

  return (
    <div className="w-full space-y-6">
      {/* ── Unboxed Editorial Masthead ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>
              {!session
                ? "Bible Plans Catalog • Curated Journeys"
                : "Guided Reading & Structured Journeys"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {!session
              ? "Explore Structured Scripture Plans"
              : "Chart your path through the Living Word."}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {!session
              ? "From 7-day topical deep-dives to comprehensive year-long canonical schedules across 4 Christian traditions. Preview reading outlines freely or sign in to begin your journey."
              : "Follow tailored canonical chronologies, thematic devotions, or design your own personalized multi-track reading plan."}
          </p>
        </div>

        <HeaderActions>
          {!session ? (
            <HeaderActionButton
              type="primary"
              href="/login?redirect=/plans"
              icon={<LogIn className="size-4" />}
              label="Sign In to Start Plan"
            />
          ) : (
            <>
              <HeaderActionButton
                type="secondary"
                href="/ai?mode=plan"
                testId="open-ai-plan-generator-btn"
                icon={<LumaIcon className="size-4" size={16} />}
                label="Luma AI"
              />
              {onImportPlan && (
                <HeaderActionButton
                  type="secondary"
                  onClick={onImportPlan}
                  testId="open-import-plan-modal-btn"
                  icon={<Upload className="size-4" />}
                  label="Import Plan"
                />
              )}
              {onCreateCustom && (
                <HeaderActionButton
                  type="primary"
                  onClick={onCreateCustom}
                  testId="open-custom-plan-wizard-btn"
                  icon={<Plus className="size-4" />}
                  label="Create Custom"
                />
              )}
            </>
          )}
        </HeaderActions>
      </section>

      {/* ── Signature Horizon Ribbon (Hidden on mobile) ── */}
      <section
        suppressHydrationWarning
        className="hidden md:block rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Column 1: Active Journey or Public Callout */}
          <div className="pr-0 md:pr-8 space-y-3">
            {!session ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Curated Journeys
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {READING_PLANS.length} Curated Plans
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                      4
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      Christian Traditions Supported
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Preview reading outlines freely across Protestant, Catholic,
                    Orthodox, and Ethiopian traditions.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Sign in to activate plans & track daily checkoffs</span>
                  <Link
                    href="/login?redirect=/plans"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Log In to Track Progress →
                  </Link>
                </div>
              </>
            ) : activePlan ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Active Reading Journey
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {activePlan.progressPercent}% Complete
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground line-clamp-1">
                      {activePlan.title}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground shrink-0 tabular-nums">
                      {activePlan.readChapters} / {activePlan.totalChapters} ch
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Today:{" "}
                    <span className="font-semibold text-foreground">
                      {activePlan.currentPassage}
                    </span>{" "}
                    • {activePlan.dayText}
                  </p>
                </div>

                {/* Rhythm / Progress bar */}
                <div className="space-y-1 pt-0.5">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, activePlan.progressPercent))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="font-medium text-muted-foreground">
                      {activePlan.status}
                    </span>
                    <Link
                      href={`/plans/${activePlan.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                    >
                      <Play className="size-3 fill-current" />
                      <span>Resume Reading</span>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-primary" />
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Personal Reading Track
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Ready to Start
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                      0
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      Active Plans Running
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You don&apos;t have any active plans running yet. Select any
                    curriculum from the catalog below to begin.
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{READING_PLANS.length} blueprints available below</span>
                  <span className="text-xs font-semibold text-primary">
                    Select a plan below to start ↓
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Column 2: Blueprint Architecture */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Curated Architecture
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {activePlanInstances.length} Active
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {READING_PLANS.length}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Curated Catalog Templates
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fixed cadence, self-paced, or custom multi-track journeys
                spanning Protestant, Catholic, Orthodox, and Ethiopian canons.
              </p>
            </div>

            {/* Canon Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Protestant (66)
              </span>
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Catholic (73)
              </span>
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Orthodox (78)
              </span>
              <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Ethiopian (81)
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
