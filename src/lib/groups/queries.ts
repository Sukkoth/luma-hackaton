import "server-only";

import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  notExists,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  groups,
  groupMembers,
  groupPlans,
  type GroupRole,
  type GroupMembershipStatus,
} from "@/db/schema";

export type UserGroupSummaryItem = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  inviteCode: string;
  role: GroupRole;
  status: GroupMembershipStatus;
  memberCount: number;
  activePlansCount: number;
};

export type PublicGroupSummaryItem = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  memberCount: number;
  requiresApproval: boolean;
  isEnrolled: boolean;
};

export type GetUserGroupsParams = {
  userId: string;
};

export async function getUserGroups({
  userId,
}: GetUserGroupsParams): Promise<ReadonlyArray<UserGroupSummaryItem>> {
  const userMemberships = await db.query.groupMembers.findMany({
    where: eq(groupMembers.userId, userId),
    with: {
      group: {
        columns: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          inviteCode: true,
        },
      },
    },
    orderBy: [desc(groupMembers.joinedAt)],
  });

  if (userMemberships.length === 0) return [];

  const groupIds = userMemberships.map((m) => m.group.id);

  const [memberCounts, activePlanCounts] = await Promise.all([
    db
      .select({
        groupId: groupMembers.groupId,
        count: sql<number>`count(*)::int`,
      })
      .from(groupMembers)
      .where(
        and(
          inArray(groupMembers.groupId, groupIds),
          eq(groupMembers.status, "active")
        )
      )
      .groupBy(groupMembers.groupId),
    db
      .select({
        groupId: groupPlans.groupId,
        count: sql<number>`count(*)::int`,
      })
      .from(groupPlans)
      .where(
        and(
          inArray(groupPlans.groupId, groupIds),
          eq(groupPlans.status, "active")
        )
      )
      .groupBy(groupPlans.groupId),
  ]);

  const memberCountByGroup = new Map<string, number>(
    memberCounts.map((row) => [row.groupId, Number(row.count)])
  );
  const planCountByGroup = new Map<string, number>(
    activePlanCounts.map((row) => [row.groupId, Number(row.count)])
  );

  return userMemberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    avatarUrl: m.group.avatarUrl,
    inviteCode: m.group.inviteCode,
    role: m.role as GroupRole,
    status: m.status as GroupMembershipStatus,
    memberCount: memberCountByGroup.get(m.group.id) ?? 0,
    activePlansCount: planCountByGroup.get(m.group.id) ?? 0,
  }));
}

export type SearchPublicGroupsQueryParams = {
  userId: string;
  query?: string;
  limit?: number;
};

export async function searchPublicGroups({
  userId,
  query = "",
  limit = 20,
}: SearchPublicGroupsQueryParams): Promise<
  ReadonlyArray<PublicGroupSummaryItem>
> {
  const trimmed = query.trim();
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const notMemberCondition = notExists(
    db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groups.id),
          eq(groupMembers.userId, userId),
          inArray(groupMembers.status, ["active", "pending_approval"])
        )
      )
  );

  const whereCondition = trimmed
    ? and(
        eq(groups.isPrivate, false),
        ilike(groups.name, `%${trimmed}%`),
        notMemberCondition
      )
    : and(eq(groups.isPrivate, false), notMemberCondition);

  const publicGroups = await db.query.groups.findMany({
    where: whereCondition,
    columns: {
      id: true,
      name: true,
      description: true,
      avatarUrl: true,
      requiresApproval: true,
    },
    orderBy: [desc(groups.createdAt)],
    limit: safeLimit,
  });

  if (publicGroups.length === 0) return [];

  const groupIds = publicGroups.map((g) => g.id);
  const memberCounts = await db
    .select({
      groupId: groupMembers.groupId,
      count: sql<number>`count(*)::int`,
    })
    .from(groupMembers)
    .where(
      and(
        inArray(groupMembers.groupId, groupIds),
        eq(groupMembers.status, "active")
      )
    )
    .groupBy(groupMembers.groupId);

  const memberCountByGroup = new Map<string, number>(
    memberCounts.map((row) => [row.groupId, Number(row.count)])
  );

  return publicGroups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    avatarUrl: g.avatarUrl,
    memberCount: memberCountByGroup.get(g.id) ?? 0,
    requiresApproval: g.requiresApproval,
    isEnrolled: false,
  }));
}

export type GetGroupMetadataNameParams = {
  groupId: string;
};

export async function getGroupMetadataName({
  groupId,
}: GetGroupMetadataNameParams): Promise<string | null> {
  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    columns: {
      name: true,
      isPrivate: true,
    },
  });

  if (!group || group.isPrivate) {
    return null;
  }

  return group.name;
}
