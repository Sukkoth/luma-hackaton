import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/navigation/app-shell";
import { getUserTrackersData } from "@/actions/trackers";
import { getUserGroupsAction, searchPublicGroupsAction } from "@/actions/groups";
import { syncUserStreak } from "@/lib/streak-service";
import { GroupsHubView } from "@/components/groups/groups-hub-view";

export const metadata = {
  title: "Community Fellowships • Luma",
  description:
    "Collaborative Bible reading groups, synchronized plans, and cohort accountability.",
};

export default async function GroupsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [trackersData, streak, userGroupsRes, publicGroupsRes] =
    await Promise.all([
      getUserTrackersData({ userId: session.user.id }),
      syncUserStreak({ userId: session.user.id }),
      getUserGroupsAction(),
      searchPublicGroupsAction({ limit: 12 }),
    ]);

  const myGroups = userGroupsRes.success && userGroupsRes.groups ? userGroupsRes.groups : [];
  const publicGroups =
    publicGroupsRes.success && publicGroupsRes.groups ? publicGroupsRes.groups : [];

  return (
    <AppShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image || undefined}
      streak={streak}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
    >
      <div className="w-full px-6 sm:px-8 py-4 sm:py-6">
        <main className="mt-1 w-full">
          <GroupsHubView
            myGroups={myGroups}
            initialPublicGroups={publicGroups}
          />
        </main>
      </div>
    </AppShell>
  );
}
