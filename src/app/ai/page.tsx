import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import type { BibleCanon } from "@/data/bibleData";
import { AiStudioModeSchema, type AiStudioMode } from "@/lib/schemas/ai-plans";
import { AppShell } from "@/components/navigation/app-shell";
import { AiPlanStudio } from "@/components/plans/ai-plan-studio";

export const instant = false;

export const metadata: Metadata = {
  title: "Luma AI",
  description:
    "Generate Bible reading plans, explore passages, and prepare group studies with Luma AI.",
  robots: {
    index: false,
    follow: false,
  },
};

type LumaAiPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function LumaAiPage({ searchParams }: LumaAiPageProps) {
  const [session, resolvedSearchParams] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    searchParams,
  ]);

  if (!session) {
    redirect("/login?redirect=/ai");
  }

  const parsedMode = v.safeParse(AiStudioModeSchema, resolvedSearchParams.mode);
  const initialMode: AiStudioMode = parsedMode.success
    ? parsedMode.output
    : "plan";

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
  ]);

  const activeTrackerCanon: BibleCanon =
    (trackersData.activeTracker?.canon as BibleCanon) || "protestant";

  return (
    <AppShell
      userName={session.user.name || "Reader"}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full max-w-[1440px] mx-auto">
        <AiPlanStudio
          activeTrackerCanon={activeTrackerCanon}
          initialMode={initialMode}
        />
      </div>
    </AppShell>
  );
}
