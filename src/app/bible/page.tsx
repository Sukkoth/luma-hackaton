import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { BibleLandingPage } from "@/components/bible/bible-landing-page";

export const instant = false;

export default async function BiblePage() {
  unstable_noStore();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/login?redirect=/bible`);
  }

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
  ]);

  const displayName = session.user.name || "Reader";

  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center p-8"><div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" /></div>}>
      <AppShell
        userName={displayName}
        userEmail={session.user.email}
        userImage={session.user.image ?? undefined}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      >
        <div className="w-full max-w-[1440px] mx-auto pb-16">
          <BibleLandingPage />
        </div>
      </AppShell>
    </Suspense>
  );
}