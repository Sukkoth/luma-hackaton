"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, LogIn } from "lucide-react";
import {
  type ReadingPlanTemplate,
  isPlanCanonCompatible,
} from "@/data/readingPlans";
import type { BibleCanon } from "@/data/bibleData";
import { PlanSetupModal } from "./plan-setup-modal";

type StartPlanActionProps = {
  plan: ReadingPlanTemplate;
  activeTrackerId?: string;
  trackerName?: string;
  trackerCanon?: string;
  isAuthenticated: boolean;
};

export function StartPlanAction({
  plan,
  activeTrackerId,
  trackerName,
  trackerCanon,
  isAuthenticated,
}: StartPlanActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Link
        href={`/auth/sign-in?callbackUrl=/plans/templates/${plan.id}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 sm:mt-0 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        <LogIn className="size-3.5" />
        <span>Sign in to Start Plan</span>
      </Link>
    );
  }

  if (!activeTrackerId) {
    return (
      <button
        type="button"
        disabled
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-black/8 bg-black/5 px-5 py-2 text-[13px] font-medium text-[#777777] shadow-xs cursor-not-allowed sm:mt-0 dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF]"
      >
        <span>No Active Tracker</span>
      </button>
    );
  }

  const isCanonCompatible = isPlanCanonCompatible({
    plan,
    trackerCanon: (trackerCanon as BibleCanon) || "protestant",
  });

  if (!isCanonCompatible) {
    return (
      <button
        type="button"
        disabled
        title="This plan contains books that are outside your active tracker's canon"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-black/8 bg-black/5 px-5 py-2 text-[13px] font-medium text-[#777777] shadow-xs cursor-not-allowed sm:mt-0 dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF]"
      >
        <span>Incompatible Canon</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-all hover:bg-black/85 sm:mt-0 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        <Calendar className="size-3.5" />
        <span>Configure & Start Plan</span>
      </button>

      <PlanSetupModal
        isOpen={isModalOpen}
        onCloseAction={() => setIsModalOpen(false)}
        plan={plan}
        activeTrackerId={activeTrackerId}
        trackerName={trackerName}
      />
    </>
  );
}
