import { Maximize2, CheckCircle2, Bookmark } from "lucide-react";

export function DistributionCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Left Card: Scripture Distribution */}
      <div className="glass-panel flex flex-col justify-between rounded-[28px] p-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
              Scripture Distribution
            </h4>
            <button
              type="button"
              aria-label="Expand distribution"
              className="text-[#888888] transition-colors hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Breakdown items */}
          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#82ADD4]" />
                <span>Pentateuch & Law</span>
              </span>
              <span className="text-[16px] font-light text-black dark:text-white">
                4 057
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A3C4E2]" />
                <span>Historical Books</span>
              </span>
              <span className="text-[16px] font-light text-black dark:text-white">
                3 167
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C2D9EE]" />
                <span>Poetry & Wisdom</span>
              </span>
              <span className="text-[16px] font-light text-black dark:text-white">
                2 546
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white" />
                <span>Gospels & Epistles</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  1 287
                </span>
                <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black shadow-2xs">
                  13%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Active Plans & Rest Schedule */}
      <div className="glass-panel flex flex-col justify-between rounded-[28px] p-6">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-normal tracking-tight text-black dark:text-white">
              Active Plans Status
            </h4>
            <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/[0.06] dark:text-[#9CA3AF]">
              4 Active
            </span>
          </div>

          <div className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/50 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#82ADD4] text-white">
                  <Bookmark className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-black dark:text-white">
                    Bible in a Year
                  </p>
                  <p className="text-[11px] text-[#888888] dark:text-[#9CA3AF]">
                    Day 212 • On Track
                  </p>
                </div>
              </div>
              <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                94%
              </span>
            </div>

            <div className="flex items-center justify-between px-1 text-[13px]">
              <span className="flex items-center gap-2 text-[#555555] dark:text-[#9CA3AF]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#82ADD4]" />
                <span>Planned Rest Days</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-light text-black dark:text-white">
                  135 ch buffer
                </span>
                <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                  0.12%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
