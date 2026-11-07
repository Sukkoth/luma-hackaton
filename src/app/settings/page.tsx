import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsView } from "@/components/settings/settings-view";
import { getUserTrackersData } from "@/actions/trackers";
import { syncUserStreak } from "@/lib/streak-service";

export const instant = false;

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/settings");
  }

  const { user } = session;

  const [trackersData, streak] = await Promise.all([
    getUserTrackersData({ userId: user.id }),
    syncUserStreak({ userId: user.id }),
  ]);

  return (
    <SettingsView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerifiedAt: (user as { emailVerifiedAt?: Date | string | null })
          .emailVerifiedAt,
      }}
      trackers={trackersData.trackers}
      activeTrackerId={trackersData.activeTracker?.id}
      streak={streak}
    />
  );
}
