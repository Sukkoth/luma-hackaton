import { headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { getUserAchievementsForUser } from "@/lib/achievements/queries";
import { AchievementsView } from "@/components/achievements/achievements-view";

export const instant = false;

type AchievementsPageProps = {
  searchParams?: Promise<{
    status?: string;
    category?: string;
  }>;
};

export default async function AchievementsPage({}: AchievementsPageProps) {
  await connection();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/achievements");
  }

  const [trackersData, achievementsData] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    getUserAchievementsForUser({ userId: session.user.id }),
  ]);
  const streak = achievementsData.streak;

  const userFirstName = session.user.name?.split(" ")[0] || "Reader";

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        {/* ── Unboxed Editorial Masthead ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>Badges &amp; Faithful Milestones</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Scripture Achievements &amp; Milestones
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Welcome back, {userFirstName}. Track your spiritual endurance,
              daily habits, and scripture milestones.
            </p>
          </div>
        </section>

        {/* ── Dedicated Achievements View ── */}
        <AchievementsView
          achievements={achievementsData.achievements}
          stats={achievementsData.stats}
        />
      </div>
    </AppShell>
  );
}
