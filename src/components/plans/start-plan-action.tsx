"use client";

import { Sparkles } from "lucide-react";

type StartPlanActionProps = {
  planId?: string;
};

export function StartPlanAction({}: StartPlanActionProps = {}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-black/8 bg-black/5 px-5 py-2 text-[13px] font-medium text-[#777777] shadow-xs cursor-not-allowed sm:mt-0 dark:border-white/10 dark:bg-white/5 dark:text-[#9CA3AF]"
      >
        <Sparkles className="size-3.5 text-[#82ADD4]" />
        <span>Coming Soon</span>
      </button>
    </div>
  );
}
