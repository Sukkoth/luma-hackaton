import { Flame, Trophy, TrendingUp, Clock, Award } from "lucide-react";
import { TopNavbar } from "@/components/callivio/top-navbar";

type Milestone = {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
  date?: string;
  progressText: string;
};

const MILESTONES: ReadonlyArray<Milestone> = [
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
    progressText: "443 / 500 chapters (88%)",
  },
  {
    id: "epistles_deep_dive",
    title: "Apostolic Letters",
    description:
      "Complete all Pauline and General Epistles from Romans to Jude.",
    category: "New Testament",
    unlocked: false,
    progressText: "54 / 122 chapters (44%)",
  },
];

export default function InsightsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar userName="James" />

      <main className="mt-4 space-y-4">
        {/* Header Banner */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center gap-2">
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              Analytics
            </span>
            <span className="text-[12px] text-[#777777]">
              Scripture Tracker Intelligence
            </span>
          </div>
          <h1 className="mt-2 text-[26px] font-normal tracking-tight text-black sm:text-[30px]">
            Insights & Analytics
          </h1>
          <p className="mt-1 text-[13px] text-[#666666]">
            In-depth reading statistics, velocity, streaks, and canonical coverage breakdown.
          </p>
        </section>

        {/* Top Metric Cards - Callivio Frosted Panels */}
        <section className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="glass-panel flex flex-col justify-between rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555]">
                <Flame className="h-3.5 w-3.5 text-[#C9856A]" />
                <span>Reading Streak</span>
              </span>
              <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                Active
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px]">
                14 Days
              </span>
              <p className="mt-1 text-[11px] text-[#777777]">
                Personal best: 42 days
              </p>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555]">
                <TrendingUp className="h-3.5 w-3.5 text-[#82ADD4]" />
                <span>Bible Complete</span>
              </span>
              <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-normal text-[#555555]">
                +4.2%
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px]">
                37%
              </span>
              <p className="mt-1 text-[11px] text-[#777777]">
                443 of 1,189 chapters
              </p>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555]">
                <Clock className="h-3.5 w-3.5 text-[#82ADD4]" />
                <span>Meditation Time</span>
              </span>
              <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-normal text-[#555555]">
                +23%
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px]">
                58.4h
              </span>
              <p className="mt-1 text-[11px] text-[#777777]">
                Avg 28 mins per day
              </p>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[13px] font-normal text-[#555555]">
                <Trophy className="h-3.5 w-3.5 text-[#C9A24B]" />
                <span>Milestones</span>
              </span>
              <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                Level 4
              </span>
            </div>
            <div className="mt-3">
              <span className="text-[38px] leading-none font-light tracking-tight text-black sm:text-[42px]">
                16 / 24
              </span>
              <p className="mt-1 text-[11px] text-[#777777]">
                67% badges unlocked
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: Canonical Distribution & Velocity */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex flex-col gap-1 border-b border-black/[0.04] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[18px] font-normal tracking-tight text-black">
                Canon Coverage & Reading Velocity
              </h2>
              <p className="text-[13px] text-[#777777]">
                Progress broken down by scripture sections for active tracker.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-[6px] bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-normal text-[#555555]">
                Protestant Standard 66
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  Law & Pentateuch
                </span>
                <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                  100%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Genesis to Deuteronomy</span>
                <span className="font-light text-black">187 / 187 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "100%" }}
                  className="h-full rounded-full bg-[#DDFD2C]"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  The Four Gospels
                </span>
                <span className="rounded-[4px] bg-[#DDFD2C] px-1.5 py-0.5 text-[11px] font-medium text-black">
                  100%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Matthew to John</span>
                <span className="font-light text-black">89 / 89 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "100%" }}
                  className="h-full rounded-full bg-[#DDFD2C]"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  Historical Books
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6]">
                  50%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Joshua to Esther</span>
                <span className="font-light text-black">124 / 249 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "50%" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  Poetry & Wisdom
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6]">
                  31%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Job to Song of Solomon</span>
                <span className="font-light text-black">76 / 243 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "31%" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  Epistles & Letters
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6]">
                  44%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Romans to Jude</span>
                <span className="font-light text-black">54 / 122 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "44%" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
                />
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.08] bg-white/75 p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-black">
                  Prophets & Apocalypse
                </span>
                <span className="rounded-[4px] bg-[#82ADD4]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#507ea6]">
                  22%
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] text-[#777777]">
                <span>Major/Minor & Revelation</span>
                <span className="font-light text-black">68 / 307 ch</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05]">
                <div
                  style={{ width: "22%" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#82ADD4] to-[#6894BC]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Milestones & Badges Grid */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-black/[0.04] pb-4">
            <div>
              <h2 className="text-[18px] font-normal tracking-tight text-black">
                Reading Milestones & Badges
              </h2>
              <p className="text-[13px] text-[#777777]">
                Achievements unlocked through consistent Bible reading.
              </p>
            </div>
            <span className="rounded-[6px] bg-[#DDFD2C] px-2 py-0.5 text-[11px] font-medium text-black">
              16 Unlocked
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MILESTONES.map((m) => (
              <div
                key={m.id}
                className="flex flex-col justify-between rounded-[20px] border border-black/[0.08] bg-white/75 p-5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-[6px] bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-[#555555]">
                      {m.category}
                    </span>
                    {m.unlocked ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-2xs">
                        <Award className="h-3 w-3 stroke-[2.5]" />
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#888888]">
                        In Progress
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-[16px] font-medium text-black">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-[12px] leading-snug text-[#666666]">
                    {m.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] pt-3 text-[11px] text-[#777777]">
                  <span>{m.progressText}</span>
                  {m.date && (
                    <span className="font-medium text-black">{m.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
