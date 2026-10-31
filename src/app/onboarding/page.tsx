import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { userSettings } from "@/db/schema";
import { OnboardingView } from "@/components/onboarding/onboarding-view";

export const instant = false;

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login?redirect=/onboarding");
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (settings?.hasCompletedOnboarding) {
    redirect("/home");
  }

  const displayName = session.user.name || "Reader";

  return <OnboardingView userName={displayName} />;
}
