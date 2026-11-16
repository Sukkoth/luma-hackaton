import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq, or, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { GroupJoinLandingClient } from "@/components/groups/group-join-landing-client";

export const metadata = {
  title: "Join Fellowship • Luma",
  description: "Accept invitation to join a community Bible reading fellowship.",
};

export const instant = false;

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function GroupJoinPage({ params }: PageProps) {
  const { code } = await params;
  if (!code) notFound();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?callbackUrl=/groups/join/${encodeURIComponent(code)}`);
  }

  // Find group by invite code or by id
  const group = await db.query.groups.findFirst({
    where: or(eq(groups.inviteCode, code), eq(groups.id, code)),
  });

  if (!group) {
    notFound();
  }

  // Check if caller is already an active member
  const existingMembership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, group.id),
      eq(groupMembers.userId, session.user.id)
    ),
  });

  if (existingMembership && existingMembership.status === "active") {
    redirect(`/groups/${group.id}`);
  }

  // Get active member count
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.status, "active"))
    );
  const memberCount = Number(countRes[0]?.count || 0);

  return (
    <GroupJoinLandingClient
      groupId={group.id}
      name={group.name}
      description={group.description}
      avatarUrl={group.avatarUrl}
      inviteCode={group.inviteCode}
      memberCount={memberCount}
      isPrivate={group.isPrivate}
      requiresApproval={group.requiresApproval}
    />
  );
}
