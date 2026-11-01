import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { BookOpen, Sparkles, Folder, PenTool, Link2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { TopNavbar } from "@/components/luma/top-navbar";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";

export const instant = false;

export default async function NotesPage() {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/notes");
  }

  const displayName =
    session.user.name?.split(" ")[0] || session.user.name || "Reader";

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
  ]);

  return (
    <div className="mx-auto min-h-screen max-w-350 px-4 py-3 sm:px-6 md:px-8 md:py-4">
      {/* Top Navbar */}
      <TopNavbar
        userName={displayName}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      />

      <main className="mt-4 space-y-4">
        {/* Main Coming Soon Hero Panel */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/4 pb-5 dark:border-white/6">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-[10px] bg-[#82ADD4]/20 text-[#6894BC]">
                  <BookOpen className="size-3.5" />
                </span>
                <h1 className="text-[24px] font-normal tracking-tight text-black sm:text-[28px] dark:text-white">
                  Study Journal & Notes
                </h1>
              </div>
              <p className="mt-1 text-[13px] text-[#777777] dark:text-[#9CA3AF]">
                Capture reflections, cross-references, and personal devotions as
                you read.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-[12px] font-medium text-[#777777] dark:bg-white/10 dark:text-[#9CA3AF]">
                <Sparkles className="size-3.5 text-[#82ADD4]" />
                <span>Coming Soon</span>
              </span>
            </div>
          </div>

          {/* Centered Message Card */}
          <div className="mt-8 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-black/[0.01] py-14 px-4 text-center dark:border-white/10 dark:bg-white/[0.01]">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#82ADD4]/15 text-[#507ea6] shadow-2xs dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
              <PenTool className="size-7" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-[20px] font-medium tracking-tight text-black sm:text-[22px] dark:text-white">
              Devotional Journaling is on the Horizon
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-[#666666] dark:text-[#9CA3AF]">
              We are finalizing the interactive Markdown editor and
              passage-linking engine. Soon you will be able to jot down notes
              directly attached to any chapter or reading plan.
            </p>

            {/* Feature Highlights Grid */}
            <div className="mt-8 grid w-full max-w-2xl gap-4 text-left sm:grid-cols-3">
              <div className="rounded-2xl border border-black/6 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                  <Link2 className="size-4" />
                </div>
                <h3 className="mt-3 text-[14px] font-medium text-black dark:text-white">
                  Scripture Linking
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-[#777777] dark:text-[#9CA3AF]">
                  Anchor notes to specific biblical chapters, verses, or plan
                  days.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                  <PenTool className="size-4" />
                </div>
                <h3 className="mt-3 text-[14px] font-medium text-black dark:text-white">
                  Markdown Editor
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-[#777777] dark:text-[#9CA3AF]">
                  Distraction-free rich formatting for reflections, prayers, and
                  study.
                </p>
              </div>

              <div className="rounded-2xl border border-black/6 bg-white/70 p-4 shadow-2xs backdrop-blur-md dark:border-white/8 dark:bg-white/4">
                <div className="flex size-8 items-center justify-center rounded-xl bg-[#82ADD4]/15 text-[#507ea6] dark:bg-[#82ADD4]/20 dark:text-[#82ADD4]">
                  <Folder className="size-4" />
                </div>
                <h3 className="mt-3 text-[14px] font-medium text-black dark:text-white">
                  Notebook Folders
                </h3>
                <p className="mt-1 text-[12px] leading-snug text-[#777777] dark:text-[#9CA3AF]">
                  Organize entries by study themes, plan reflections, or sermon
                  notes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
