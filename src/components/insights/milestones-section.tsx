import { Award } from "lucide-react";

export type Milestone = {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
  date?: string;
  progressText: string;
};

export const MILESTONES: ReadonlyArray<Milestone> = [
  {
    id: "gospels_complete",
    title: "Gospel Pioneer",
    description: "Read all 89 chapters of Matthew, Mark, Luke, and John.",
    category: "New Testament",
    unlocked: true,
    date: "Unlocked Nov 14",
    progressText: "89 / 89 chapters",
  },
  {
    id: "torah_complete",
    title: "Law & Covenant",
    description:
      "Completed the foundational books of Moses (Genesis & Exodus).",
    category: "Old Testament",
    unlocked: true,
    date: "Unlocked Nov 02",
    progressText: "90 / 90 chapters",
  },
  {
    id: "forty_day_streak",
    title: "Steadfast Devotion",
    description: "Maintained a reading streak of 14 consecutive active days.",
    category: "Daily Consistency",
    unlocked: true,
    date: "Active Streak",
    progressText: "14 / 14 days",
  },
  {
    id: "proverbs_mastery",
    title: "Wisdom of Solomon",
    description: "Read all 31 chapters of Proverbs across a calendar month.",
    category: "Poetry & Wisdom",
    unlocked: true,
    date: "Unlocked Oct 28",
    progressText: "31 / 31 chapters",
  },
  {
    id: "centurion_milestone",
    title: "Centurion Reader",
    description:
      "Reach 500 total unique chapters read across the entire Bible.",
    category: "Milestones",
    unlocked: false,
    progressText: "443 / 500 chapters",
  },
  {
    id: "whole_bible_year",
    title: "Canonical Finisher",
    description: "Complete all 1,189 chapters of the canonical Scriptures.",
    category: "Whole Bible",
    unlocked: false,
    progressText: "443 / 1,189 chapters",
  },
];

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
        <span className="rounded-md bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
          16 Unlocked
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONES.map((m) => (
          <div
            key={m.id}
            className="flex flex-col justify-between rounded-[20px] border border-black/8 bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:bg-white hover:shadow-md dark:border-white/8 dark:bg-white/4 dark:shadow-none dark:hover:border-white/16 dark:hover:bg-white/[0.07]"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-black/4 px-2 py-0.5 text-[11px] font-medium text-[#555555] dark:bg-white/6 dark:text-[#9CA3AF]">
                  {m.category}
                </span>
                {m.unlocked ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-2xs">
                    <Award className="size-3" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className="text-[11px] text-[#888888] dark:text-[#A1A1AA]">
                    In Progress
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-[16px] font-medium text-black dark:text-white">
                {m.title}
              </h3>
              <p className="mt-1 text-[12px] leading-snug text-[#666666] dark:text-[#9CA3AF]">
                {m.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-black/4 pt-3 text-[11px] text-[#777777] dark:border-white/6 dark:text-[#A1A1AA]">
              <span>{m.progressText}</span>
              {m.date && (
                <span className="font-medium text-black dark:text-white">
                  {m.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
