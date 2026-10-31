import { Flame, Trophy, TrendingUp, Clock } from "lucide-react";

export function InsightsKpiCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <Flame className="size-3.5 text-orange-500" />
            <span>Reading Streak</span>
          </span>
          <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
            Active
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
            14 Days
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            Personal best: 42 days
          </p>
        </div>
      </div>

      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <TrendingUp className="size-3.5 text-[#82ADD4]" />
            <span>Bible Complete</span>
          </span>
          <span className="rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            +4.2%
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
            37%
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            443 of 1,189 chapters
          </p>
        </div>
      </div>

      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <Clock className="size-3.5 text-[#82ADD4]" />
            <span>Meditation Time</span>
          </span>
          <span className="rounded-full bg-black/4 px-2 py-0.5 text-[11px] font-normal text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
            +23%
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
            58.4h
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            Avg 28 mins per day
          </p>
        </div>
      </div>

      <div className="glass-panel flex flex-col justify-between rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555] dark:text-[#9CA3AF]">
            <Trophy className="size-3.5 text-[#C9A24B]" />
            <span>Milestones</span>
          </span>
          <span className="rounded-sm bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
            Level 4
          </span>
        </div>
        <div className="mt-3">
          <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px] dark:text-white">
            16 / 24
          </span>
          <p className="mt-1 text-[11px] text-[#777777] dark:text-[#A1A1AA]">
            67% badges unlocked
          </p>
        </div>
      </div>
    </section>
  );
}
