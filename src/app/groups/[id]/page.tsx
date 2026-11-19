import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";
import {
  getGroupDetailsAction,
  getGroupMembersAction,
  getGroupLeaderboardAction,
  type LeaderboardEntry,
} from "@/actions/groups";
import { GroupWorkspaceView } from "@/components/groups/group-workspace-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getGroupDetailsAction({ groupId: id });
  return {
    title: res.success && res.group ? `${res.group.name} • Fellowship` : "Fellowship • Luma",
  };
}

export const instant = false;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GroupPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?callbackUrl=/groups/${encodeURIComponent(id)}`);
  }

  const [groupRes, membersRes, trackersData, streak] = await Promise.all([
    getGroupDetailsAction({ groupId: id }),
    getGroupMembersAction({ groupId: id }),
    getUserTrackersData({ userId: session.user.id }),
    syncUserStreak({ userId: session.user.id }),
  ]);

  if (!groupRes.success || !groupRes.group) {
    notFound();
  }

  const group = groupRes.group;
  const members = membersRes.success && membersRes.members ? membersRes.members : [];
  const pendingMembers =
    membersRes.success && membersRes.pendingMembers ? membersRes.pendingMembers : [];

  // Fetch leaderboards for all active plans in parallel
  const leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>> = {};
  if (group.activePlans.length > 0) {
    const leaderboardResults = await Promise.all(
      group.activePlans.map(async (p) => {
        const lbRes = await getGroupLeaderboardAction({ groupPlanId: p.id });
        return {
          planId: p.id,
          entries: lbRes.success && lbRes.leaderboard ? lbRes.leaderboard : [],
        };
      })
    );

    for (const res of leaderboardResults) {
      leaderboardsByPlanId[res.planId] = res.entries;
    }
  }

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image || undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full max-w-[1440px] mx-auto">
        <Suspense fallback={null}>
          <GroupWorkspaceView
            group={group}
            members={members}
            pendingMembers={pendingMembers}
            leaderboardsByPlanId={leaderboardsByPlanId}
            trackers={trackersData.trackers}
            activeTrackerId={trackersData.activeTracker?.id}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
