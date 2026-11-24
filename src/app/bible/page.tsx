import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import { BibleWorkspace } from "@/components/bible/bible-workspace";

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
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center p-8">
          <div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
        </div>
      }
    >
      <AppShell
        userName={displayName}
        userEmail={session.user.email}
        userImage={session.user.image ?? undefined}
        streak={streak}
        trackers={trackersData.trackers}
        activeTrackerId={trackersData.activeTracker?.id}
      >
        <div className="w-full max-w-[1440px] mx-auto">
          <Suspense
            fallback={
              <div className="flex h-[calc(100dvh-10.5rem)] lg:h-[calc(100dvh-6.75rem)] items-center justify-center rounded-2xl border border-border/80 bg-surface">
                <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            }
          >
            <BibleWorkspace />
          </Suspense>
        </div>
      </AppShell>
    </Suspense>
  );
}
