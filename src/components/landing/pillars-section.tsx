import { Compass, Cpu, Flame, Users } from "lucide-react";

export function PillarsSection() {
  return (
    <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Pillar 1 */}
      <div className="rounded-[20px] border border-black/8 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#3b6d94] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
          <Compass className="size-5" />
        </div>
        <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
          Multi-Tracker Isolation
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
          Run personal devotions, Bible in a year, and small group studies in
          parallel without cross-contaminating completion matrices.
        </p>
      </div>

      {/* Pillar 2 */}
      <div className="rounded-[20px] border border-black/8 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#DDFD2C]/20 text-black dark:bg-[#DDFD2C]/15 dark:text-[#DDFD2C]">
          <Cpu className="size-5" />
        </div>
        <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
          AI Study Companion
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
          Generate 2-paragraph cultural context summaries and Socratic
          comprehension quizzes with instant grading and constructive feedback.
        </p>
      </div>

      {/* Pillar 3 */}
      <div className="rounded-[20px] border border-black/8 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
          <Flame className="size-5" />
        </div>
        <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
          Grace-Filled Streak Engine
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
          Life happens. Automatic streak freezes and catch-up rebalancing ensure
          a missed day never causes guilt or breaks your momentum.
        </p>
      </div>

      {/* Pillar 4 */}
      <div className="rounded-[20px] border border-black/8 bg-white/70 p-6 shadow-xs backdrop-blur-md dark:border-white/10 dark:bg-white/3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
          <Users className="size-5" />
        </div>
        <h3 className="mt-4 text-[16px] font-medium text-black dark:text-white">
          Cohort Reading Groups
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
          Read together with private invite links, synchronized start dates, and
          an intuitive 2-tab suite keeping reader views distraction-free.
        </p>
      </div>
    </section>
  );
}
