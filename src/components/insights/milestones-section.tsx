import { Award, Sparkles } from "lucide-react";

export function MilestonesSection() {
  return (
    <section className="glass-panel rounded-[28px] p-6 sm:p-7">
      <div className="flex items-center justify-between border-b border-black/4 pb-4 dark:border-white/6">
        <div>
          <h2 className="text-[18px] font-normal tracking-tight text-black dark:text-white">
            Reading Milestones & Badges
          </h2>
          <p className="text-[13px] text-[#777777] dark:text-[#A1A1AA]">
            Achievements unlocked through consistent Bible reading.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-[#777777] dark:bg-white/10 dark:text-[#9CA3AF]">
          <Sparkles className="size-3 text-[#82ADD4]" />
          <span>Coming Soon</span>
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center rounded-[22px] border border-dashed border-black/10 bg-black/[0.01] py-14 text-center dark:border-white/10 dark:bg-white/[0.01]">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#507ea6] shadow-2xs dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
          <Award className="size-7" strokeWidth={1.75} />
        </div>
        <h3 className="mt-4 text-[17px] font-medium text-black dark:text-white">
          Achievements & Badges Arriving Soon
        </h3>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
          Milestone tracking, canon achievement badges, and reading streak
          accolades will be dynamically awarded as you complete books and
          chapters.
        </p>
      </div>
    </section>
  );
}
