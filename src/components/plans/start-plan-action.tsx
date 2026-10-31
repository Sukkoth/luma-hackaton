"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, LogIn } from "lucide-react";
import { useSession } from "@/lib/auth-client";

type StartPlanActionProps = {
  planId: string;
};

export function StartPlanAction({ planId }: StartPlanActionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleStart = () => {
    if (session) {
      router.push(`/plans/${planId}-instance`);
    } else {
      setShowPrompt(true);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleStart}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 sm:mt-0 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
      >
        <span>Create & Start Plan</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </button>

      {showPrompt && !session && (
        <div
          role="dialog"
          aria-labelledby="auth-plan-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <div className="glass-panel relative w-full max-w-sm rounded-[24px] border border-white/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16161b]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#82ADD4]/20 text-[#507ea6] dark:bg-[#82ADD4]/30 dark:text-[#82ADD4]">
              <Lock className="h-5 w-5" />
            </div>
            <h3
              id="auth-plan-modal-title"
              className="mt-3 text-[18px] font-medium text-black dark:text-white"
            >
              Sign In to Start Plan
            </h3>
            <p className="mt-1 text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              Creating an active schedule and tracking daily milestones requires
              an account.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(`/login?redirect=/plans/templates/${planId}`)
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[12px] bg-black py-2 text-[12px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="rounded-[12px] border border-black/10 bg-black/5 px-4 py-2 text-[12px] font-medium text-black hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
