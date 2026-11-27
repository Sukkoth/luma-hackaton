"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, desc, inArray, gte, sql } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { generateRandomInviteCode } from "@/lib/tokens";
import {
  computeGroupPlanEndDate,
  GROUP_PLAN_GRACE_MS,
} from "@/lib/plans/group-plan-schedule";
import {
  groups,
  groupMembers,
  groupPlans,
  groupMemberEnrollments,
  groupActivities,
  notes,
  planInstances,
  planInstanceReadings,
  planTemplates,
  user,
  readingTrackers,
  type GroupRole,
  type GroupPlanStatus,
  type GroupLateJoinPolicy,
  type GroupMembershipStatus,
} from "@/db/schema";
import {
  getUserGroups,
  searchPublicGroups,
} from "@/lib/groups/queries";
import { createNotificationAction } from "@/actions/notifications";
import { evaluateAndUnlockAchievementsAction } from "@/actions/achievements";
import {
  CreateGroupSchema,
  UpdateGroupSettingsSchema,
  JoinGroupSchema,
  ScheduleGroupPlanSchema,
  EnrollInGroupPlanSchema,
  UpdateMemberRoleSchema,
  RemoveMemberSchema,
  ApproveMemberSchema,
  ToggleLeaderboardPrivacySchema,
  ShareNoteWithCommunitySchema,
  LeaveGroupSchema,
  LeaveGroupPlanSchema,
  SetGroupPinnedNoticeSchema,
  ClearGroupPinnedNoticeSchema,
  DeleteGroupSchema,
  TransferGroupOwnershipSchema,
  UpdateGroupPlanStatusSchema,
  DeleteGroupPlanSchema,
} from "@/lib/schemas/groups";
import { startPlanAction, ensurePlanTemplateInDb } from "@/actions/plans";

export type GroupMemberSummary = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: GroupRole;
  status: GroupMembershipStatus;
  hideProgress: boolean;
  joinedAt: Date;
};

export type GroupPlanSummary = {
  id: string;
  planTemplateId: string;
  templateTitle: string;
  scheduledStartDate: Date;
  status: GroupPlanStatus;
  lateJoinPolicy: GroupLateJoinPolicy;
  dailyChapterTarget: number;
  activeWeekdaysMask: string;
  totalChapters: number;
  userEnrolledInstanceId: string | null;
  enrolledMembersCount: number;
  expectedEndDate: Date;
  createdAt: Date;
};

export type GroupPinnedNotice = {
  title: string | null;
  content: string;
  expiresAt: string;
  updatedAt: string;
  authorId: string | null;
  authorName: string | null;
};

export type GroupDetails = {
  id: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  inviteCode: string;
  ownerId: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  currentUserRole: GroupRole | null;
  currentUserMembershipStatus: GroupMembershipStatus | null;
  currentUserHideProgress: boolean;
  currentUserPrivacyUpdatedAt: string | null;
  pinnedNotice: GroupPinnedNotice | null;
  memberCount: number;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  scheduledPlans: ReadonlyArray<GroupPlanSummary>;
  completedPlans: ReadonlyArray<GroupPlanSummary>;
};

export type LeaderboardEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  isCurrentUser: boolean;
  isAnonymous: boolean;
  isPrivate?: boolean;
  completedChapters: number;
  totalChapters: number;
  progressPercent: number;
  readToday: boolean;
};

export type GroupSessionNote = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  title: string;
  bodyHtml: string;
  plainTextSnippet: string;
  updatedAt: Date;
};

// ---------------------------------------------------------------------------
// Group CRUD
// ---------------------------------------------------------------------------

export type CreateGroupParams = {
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
};

export async function createGroupAction({
  name,
  description = "",
  avatarUrl,
  isPrivate = true,
  requiresApproval = false,
}: CreateGroupParams): Promise<{
  success: boolean;
  groupId?: string;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(CreateGroupSchema, {
    name,
    description,
    avatarUrl,
    isPrivate,
    requiresApproval,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid group parameters.",
    };
  }

  const input = parsed.output;
  const inviteCode = generateRandomInviteCode({ length: 10 });

  try {
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: input.name,
        description: input.description ?? "",
        avatarUrl: input.avatarUrl || null,
        inviteCode,
        ownerId: session.user.id,
        isPrivate: input.isPrivate ?? true,
        requiresApproval: input.requiresApproval ?? false,
      })
      .returning();

    if (!newGroup) {
      return { success: false, error: "Failed to create group." };
    }

    // Add owner as active member with owner role
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: session.user.id,
      role: "owner",
      status: "active",
      hideProgress: false,
    });

    // Notify creator of group creation
    await createNotificationAction({
      userId: session.user.id,
      input: {
        type: "group_activity",
        title: "Group Created",
        body: `You created "${newGroup.name}". Share invite code ${newGroup.inviteCode} to invite members.`,
        actionUrl: `/groups/${newGroup.id}`,
      },
    });

    await evaluateAndUnlockAchievementsAction({ userId: session.user.id });

    revalidatePath("/groups");
    return { success: true, groupId: newGroup.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create group.";
    return { success: false, error: message };
  }
}

export type GetGroupDetailsParams = {
  groupId: string;
};

export async function getGroupDetailsAction({
  groupId,
}: GetGroupDetailsParams): Promise<{
  success: boolean;
  group?: GroupDetails;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!groupRecord) {
      return { success: false, error: "Group not found." };
    }

    // Check caller membership
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    // If private group and user is not an active member, deny access
    if (
      groupRecord.isPrivate &&
      (!membership || membership.status !== "active")
    ) {
      return {
        success: false,
        error: "This group is private. You must join via invite code.",
      };
    }

    // Auto-activate any scheduled plans whose start date is <= today
    const now = new Date();
    const scheduledToActivate = await db.query.groupPlans.findMany({
      where: and(
        eq(groupPlans.groupId, groupId),
        eq(groupPlans.status, "scheduled")
      ),
    });

    const duePlanIds = scheduledToActivate
      .filter((p) => new Date(p.scheduledStartDate) <= now)
      .map((p) => p.id);

    if (duePlanIds.length > 0) {
      await db
        .update(groupPlans)
        .set({ status: "active", activatedAt: now })
        .where(inArray(groupPlans.id, duePlanIds));
    }

    // Count active members
    const membersCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.status, "active")
        )
      );
    const memberCount = Number(membersCountRes[0]?.count || 0);

    // Fetch all group plans without loading every enrollment row into memory
    const allPlans = await db.query.groupPlans.findMany({
      where: eq(groupPlans.groupId, groupId),
      with: {
        template: true,
      },
      orderBy: [desc(groupPlans.createdAt)],
    });

    // Lazy on-read lifecycle transition: auto-complete active plans
    // 7 days after their scheduled end date (respecting recent Reopen via updatedAt)
    const graceCompletedIds: string[] = [];
    const expectedEndByPlanId = new Map<string, Date>();

    for (const p of allPlans) {
      const totalChapters = p.template?.totalChapters || 0;
      const expectedEndDate = computeGroupPlanEndDate({
        scheduledStartDate: p.scheduledStartDate,
        totalChapters,
        dailyChapterTarget: p.dailyChapterTarget,
        activeWeekdaysMask: p.activeWeekdaysMask,
      });
      expectedEndByPlanId.set(p.id, expectedEndDate);

      if (
        p.status === "active" &&
        totalChapters > 0 &&
        now.getTime() >= expectedEndDate.getTime() + GROUP_PLAN_GRACE_MS &&
        now.getTime() - new Date(p.updatedAt).getTime() >= GROUP_PLAN_GRACE_MS
      ) {
        graceCompletedIds.push(p.id);
      }
    }

    if (graceCompletedIds.length > 0) {
      await db
        .update(groupPlans)
        .set({ status: "completed", completedAt: now })
        .where(inArray(groupPlans.id, graceCompletedIds));
    }

    const graceCompletedSet = new Set(graceCompletedIds);
    const planIds = allPlans.map((p) => p.id);
    const [enrollmentCounts, userEnrollments] =
      planIds.length > 0
        ? await Promise.all([
            db
              .select({
                groupPlanId: groupMemberEnrollments.groupPlanId,
                count: sql<number>`count(*)`,
              })
              .from(groupMemberEnrollments)
              .where(inArray(groupMemberEnrollments.groupPlanId, planIds))
              .groupBy(groupMemberEnrollments.groupPlanId),
            db
              .select({
                groupPlanId: groupMemberEnrollments.groupPlanId,
                planInstanceId: groupMemberEnrollments.planInstanceId,
              })
              .from(groupMemberEnrollments)
              .where(
                and(
                  inArray(groupMemberEnrollments.groupPlanId, planIds),
                  eq(groupMemberEnrollments.userId, session.user.id)
                )
              ),
          ])
        : [[], []];

    const enrollmentCountByPlan = new Map(
      enrollmentCounts.map((row) => [row.groupPlanId, Number(row.count || 0)])
    );
    const userInstanceByPlan = new Map(
      userEnrollments.map((row) => [row.groupPlanId, row.planInstanceId])
    );

    const activePlans: GroupPlanSummary[] = [];
    const scheduledPlans: GroupPlanSummary[] = [];
    const completedPlans: GroupPlanSummary[] = [];

    for (const p of allPlans) {
      const effectiveStatus = (
        graceCompletedSet.has(p.id) ? "completed" : p.status
      ) as GroupPlanStatus;
      const expectedEndDate =
        expectedEndByPlanId.get(p.id) ?? p.scheduledStartDate;

      const summary: GroupPlanSummary = {
        id: p.id,
        planTemplateId: p.planTemplateId,
        templateTitle: p.template?.title || "Reading Plan",
        scheduledStartDate: p.scheduledStartDate,
        status: effectiveStatus,
        lateJoinPolicy: p.lateJoinPolicy as GroupLateJoinPolicy,
        dailyChapterTarget: p.dailyChapterTarget,
        activeWeekdaysMask: p.activeWeekdaysMask,
        totalChapters: p.template?.totalChapters || 0,
        userEnrolledInstanceId: userInstanceByPlan.get(p.id) || null,
        enrolledMembersCount: enrollmentCountByPlan.get(p.id) || 0,
        expectedEndDate,
        createdAt: p.createdAt,
      };

      if (effectiveStatus === "active") activePlans.push(summary);
      else if (effectiveStatus === "scheduled") scheduledPlans.push(summary);
      else if (
        effectiveStatus === "completed" ||
        effectiveStatus === "cancelled"
      )
        completedPlans.push(summary);
    }

    let pinnedNotice: GroupPinnedNotice | null = null;
    if (
      groupRecord.pinnedNoticeContent &&
      groupRecord.pinnedNoticeExpiresAt &&
      new Date(groupRecord.pinnedNoticeExpiresAt) > now
    ) {
      let authorName: string | null = null;
      if (groupRecord.pinnedNoticeAuthorId) {
        const authorUser = await db.query.user.findFirst({
          where: eq(user.id, groupRecord.pinnedNoticeAuthorId),
          columns: { name: true },
        });
        authorName = authorUser?.name || null;
      }
      pinnedNotice = {
        title: groupRecord.pinnedNoticeTitle,
        content: groupRecord.pinnedNoticeContent,
        expiresAt: groupRecord.pinnedNoticeExpiresAt.toISOString(),
        updatedAt: (
          groupRecord.pinnedNoticeUpdatedAt || groupRecord.updatedAt
        ).toISOString(),
        authorId: groupRecord.pinnedNoticeAuthorId,
        authorName,
      };
    }

    const isGroupAdmin =
      membership?.role === "admin" ||
      membership?.role === "owner" ||
      groupRecord.ownerId === session.user.id;
    const canInvite = !groupRecord.isPrivate || isGroupAdmin;

    return {
      success: true,
      group: {
        id: groupRecord.id,
        name: groupRecord.name,
        description: groupRecord.description,
        avatarUrl: groupRecord.avatarUrl,
        inviteCode: canInvite ? groupRecord.inviteCode : "",
        ownerId: groupRecord.ownerId,
        isPrivate: groupRecord.isPrivate,
        requiresApproval: groupRecord.requiresApproval,
        currentUserRole: (membership?.role as GroupRole) || null,
        currentUserMembershipStatus:
          (membership?.status as GroupMembershipStatus) || null,
        currentUserHideProgress: membership?.hideProgress ?? false,
        currentUserPrivacyUpdatedAt:
          membership?.privacyUpdatedAt?.toISOString() ?? null,
        pinnedNotice,
        memberCount,
        activePlans,
        scheduledPlans,
        completedPlans,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load group details.";
    return { success: false, error: message };
  }
}

export type UpdateGroupSettingsParams = {
  groupId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
};

export async function updateGroupSettingsAction({
  groupId,
  name,
  description = "",
  avatarUrl,
  isPrivate = true,
  requiresApproval = false,
}: UpdateGroupSettingsParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdateGroupSettingsSchema, {
    groupId,
    name,
    description,
    avatarUrl,
    isPrivate,
    requiresApproval,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid settings.",
    };
  }

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        inArray(groupMembers.role, ["owner", "admin"])
      ),
    });

    if (!caller) {
      return {
        success: false,
        error: "Only admins or owners can update fellowship settings.",
      };
    }

    await db
      .update(groups)
      .set({
        name: parsed.output.name,
        description: parsed.output.description ?? "",
        avatarUrl: parsed.output.avatarUrl || null,
        isPrivate: parsed.output.isPrivate ?? true,
        requiresApproval: parsed.output.requiresApproval ?? false,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId));

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update group settings.";
    return { success: false, error: message };
  }
}

export type RegenerateInviteCodeParams = {
  groupId: string;
};

export async function regenerateInviteCodeAction({
  groupId,
}: RegenerateInviteCodeParams): Promise<{
  success: boolean;
  newInviteCode?: string;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        inArray(groupMembers.role, ["owner", "admin"])
      ),
    });

    if (!caller) {
      return {
        success: false,
        error:
          "Only admins or owners can regenerate fellowship invitation links.",
      };
    }

    const newInviteCode = generateRandomInviteCode({ length: 10 });
    await db
      .update(groups)
      .set({
        inviteCode: newInviteCode,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId));

    revalidatePath(`/groups/${groupId}`);
    return { success: true, newInviteCode };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to regenerate invite code.";
    return { success: false, error: message };
  }
}

export type DeleteGroupParams = {
  groupId: string;
  confirmGroupName: string;
};

export async function deleteGroupAction({
  groupId,
  confirmGroupName,
}: DeleteGroupParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeleteGroupSchema, {
    groupId,
    confirmGroupName,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid parameters.",
    };
  }

  try {
    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!groupRecord) {
      return { success: false, error: "Group not found." };
    }

    if (groupRecord.ownerId !== session.user.id) {
      return {
        success: false,
        error: "Only the group owner can delete the fellowship.",
      };
    }

    if (
      groupRecord.name.trim().toLowerCase() !==
      parsed.output.confirmGroupName.trim().toLowerCase()
    ) {
      return {
        success: false,
        error: `Confirmation name does not match "${groupRecord.name}".`,
      };
    }

    await db.delete(groups).where(eq(groups.id, groupId));

    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete group.";
    return { success: false, error: message };
  }
}

export type UserGroupSummary = {
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

export async function getUserGroupsAction(): Promise<{
  success: boolean;
  groups?: ReadonlyArray<UserGroupSummary>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const list = await getUserGroups({ userId: session.user.id });
    return { success: true, groups: list };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch user groups.";
    return { success: false, error: message };
  }
}

export type SearchPublicGroupsParams = {
  query?: string;
  limit?: number;
};

export async function searchPublicGroupsAction({
  query = "",
  limit = 20,
}: SearchPublicGroupsParams): Promise<{
  success: boolean;
  groups?: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    avatarUrl: string | null;
    memberCount: number;
    requiresApproval: boolean;
    isEnrolled: boolean;
  }>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const result = await searchPublicGroups({
      userId: session.user.id,
      query,
      limit,
    });
    return { success: true, groups: result };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to search public groups.";
    return { success: false, error: message };
  }
}

export type JoinGroupParams = {
  inviteCode: string;
};

export async function joinGroupAction({
  inviteCode,
}: JoinGroupParams): Promise<{
  success: boolean;
  groupId?: string;
  status?: GroupMembershipStatus;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(JoinGroupSchema, { inviteCode });
  if (!parsed.success) {
    return { success: false, error: "Invalid invite code format." };
  }

  try {
    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.inviteCode, parsed.output.inviteCode.trim()),
    });

    if (!groupRecord) {
      return { success: false, error: "No group found with this invite code." };
    }

    const existingMember = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupRecord.id),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (existingMember) {
      if (existingMember.status === "pending_approval") {
        return {
          success: true,
          groupId: groupRecord.id,
          status: "pending_approval",
          error: "Your request to join this group is pending admin approval.",
        };
      }
      return {
        success: true,
        groupId: groupRecord.id,
        status: "active",
      };
    }

    const status: GroupMembershipStatus = groupRecord.requiresApproval
      ? "pending_approval"
      : "active";

    await db.insert(groupMembers).values({
      groupId: groupRecord.id,
      userId: session.user.id,
      role: "member",
      status,
      hideProgress: false,
    });

    if (status === "active") {
      // 1. Post to fellowship notice board (Fan-out on Read: 1 single write for all 1000+ members, including owner)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existingRecentActivity = await db.query.groupActivities.findFirst({
        where: and(
          eq(groupActivities.groupId, groupRecord.id),
          eq(groupActivities.actorId, session.user.id),
          eq(groupActivities.type, "member_joined"),
          gte(groupActivities.createdAt, tenMinutesAgo)
        ),
        columns: { id: true },
      });

      if (!existingRecentActivity) {
        await db.insert(groupActivities).values({
          groupId: groupRecord.id,
          actorId: session.user.id,
          type: "member_joined",
          title: "New Group Member",
          body: `${session.user.name || "A new member"} joined "${groupRecord.name}".`,
          actionUrl: `/groups/${groupRecord.id}`,
        });
      }

      // 2. Personal welcome notification for joining user
      await createNotificationAction({
        userId: session.user.id,
        input: {
          type: "group_activity",
          title: "Joined Group",
          body: `Welcome to "${groupRecord.name}"! You are now an active member.`,
          actionUrl: `/groups/${groupRecord.id}`,
        },
      });
    } else {
      // 1. Notify applicant
      await createNotificationAction({
        userId: session.user.id,
        input: {
          type: "group_activity",
          title: "Join Request Sent",
          body: `Your request to join "${groupRecord.name}" is pending admin approval.`,
          actionUrl: `/groups/${groupRecord.id}`,
        },
      });

      // 2. Notify group owner
      if (groupRecord.ownerId !== session.user.id) {
        const joinerName = session.user.name || "Someone";
        await createNotificationAction({
          userId: groupRecord.ownerId,
          input: {
            type: "group_activity",
            title: "New Join Request",
            body: `${joinerName} requested to join "${groupRecord.name}". Tap to review.`,
            actionUrl: `/groups/${groupRecord.id}`,
          },
        });
      }
    }

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupRecord.id}`);

    return { success: true, groupId: groupRecord.id, status };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to join group.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Member Directory & Role Management
// ---------------------------------------------------------------------------

export type GetGroupMembersParams = {
  groupId: string;
};

export async function getGroupMembersAction({
  groupId,
}: GetGroupMembersParams): Promise<{
  success: boolean;
  members?: ReadonlyArray<GroupMemberSummary>;
  pendingMembers?: ReadonlyArray<GroupMemberSummary>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const callerMembership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!callerMembership || callerMembership.status !== "active") {
      return {
        success: false,
        error: "You are not an active member of this group.",
      };
    }

    const isCallerAdmin =
      callerMembership.role === "owner" || callerMembership.role === "admin";

    const membersRecords = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        name: user.name,
        email: user.email,
        image: user.image,
        role: groupMembers.role,
        status: groupMembers.status,
        hideProgress: groupMembers.hideProgress,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(user, eq(groupMembers.userId, user.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(desc(groupMembers.joinedAt));

    const members: GroupMemberSummary[] = [];
    const pendingMembers: GroupMemberSummary[] = [];

    for (const m of membersRecords) {
      const canSeeEmail = isCallerAdmin || m.userId === session.user.id;
      const summary: GroupMemberSummary = {
        id: m.id,
        userId: m.userId,
        name: m.name || "Reader",
        email: canSeeEmail ? m.email || "" : "",
        image: m.image || null,
        role: m.role as GroupRole,
        status: m.status as GroupMembershipStatus,
        hideProgress: m.hideProgress,
        joinedAt: m.joinedAt,
      };

      if (m.status === "active") members.push(summary);
      else if (isCallerAdmin && m.status === "pending_approval")
        pendingMembers.push(summary);
    }

    return { success: true, members, pendingMembers };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch members.";
    return { success: false, error: message };
  }
}

export type ApproveMemberParams = {
  groupId: string;
  targetUserId: string;
};

export async function approveMemberAction({
  groupId,
  targetUserId,
}: ApproveMemberParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ApproveMemberSchema, { groupId, targetUserId });
  if (!parsed.success) return { success: false, error: "Invalid parameters." };

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        inArray(groupMembers.role, ["owner", "admin"])
      ),
    });

    if (!caller) {
      return {
        success: false,
        error: "Only admins or owners can approve members.",
      };
    }

    await db
      .update(groupMembers)
      .set({ status: "active", updatedAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });

    await createNotificationAction({
      userId: targetUserId,
      input: {
        type: "group_activity",
        title: "Join Request Approved",
        body: `Your request to join "${groupRecord?.name || "the group"}" was approved!`,
        actionUrl: `/groups/${groupId}`,
      },
    });

    // Post to fellowship notice board (Fan-out on Read)
    await db.insert(groupActivities).values({
      groupId,
      actorId: targetUserId,
      type: "member_joined",
      title: "New Fellowship Member",
      body: `A new member was approved to join "${groupRecord?.name || "the group"}".`,
      actionUrl: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to approve member.";
    return { success: false, error: message };
  }
}

export type RejectMemberParams = {
  groupId: string;
  targetUserId: string;
};

export async function rejectMemberAction({
  groupId,
  targetUserId,
}: RejectMemberParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ApproveMemberSchema, { groupId, targetUserId });
  if (!parsed.success) return { success: false, error: "Invalid parameters." };

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        inArray(groupMembers.role, ["owner", "admin"])
      ),
    });

    if (!caller) {
      return {
        success: false,
        error: "Only admins or owners can reject members.",
      };
    }

    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });

    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    await createNotificationAction({
      userId: targetUserId,
      input: {
        type: "group_activity",
        title: "Join Request Declined",
        body: `Your request to join "${groupRecord?.name || "the group"}" was declined.`,
      },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reject member.";
    return { success: false, error: message };
  }
}

export type UpdateMemberRoleParams = {
  groupId: string;
  targetUserId: string;
  newRole: GroupRole;
};

export async function updateMemberRoleAction({
  groupId,
  targetUserId,
  newRole,
}: UpdateMemberRoleParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdateMemberRoleSchema, {
    groupId,
    targetUserId,
    newRole,
  });
  if (!parsed.success) return { success: false, error: "Invalid role update." };

  try {
    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });
    if (!groupRecord) return { success: false, error: "Group not found." };

    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      return {
        success: false,
        error: "Only admins or the owner can update roles.",
      };
    }

    // Only owner can promote someone to owner or transfer ownership
    if (newRole === "owner") {
      if (caller.role !== "owner") {
        return {
          success: false,
          error: "Only the group owner can transfer ownership.",
        };
      }
      // Transfer ownership: promote target to owner, demote caller to admin
      await db
        .update(groups)
        .set({ ownerId: targetUserId, updatedAt: new Date() })
        .where(eq(groups.id, groupId));

      await db
        .update(groupMembers)
        .set({ role: "admin", updatedAt: new Date() })
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, session.user.id)
          )
        );

      await db
        .update(groupMembers)
        .set({ role: "owner", updatedAt: new Date() })
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, targetUserId)
          )
        );

      revalidatePath(`/groups/${groupId}`);
      return { success: true };
    }

    // Admins cannot change role of other admins or owner
    const targetMember = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId)
      ),
    });

    if (!targetMember)
      return { success: false, error: "Target member not found." };

    if (caller.role === "admin" && targetMember.role !== "member") {
      return {
        success: false,
        error: "Admins can only promote or demote regular members.",
      };
    }

    await db
      .update(groupMembers)
      .set({ role: newRole, updatedAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update member role.";
    return { success: false, error: message };
  }
}

export type RemoveMemberParams = {
  groupId: string;
  targetUserId: string;
};

export async function removeMemberAction({
  groupId,
  targetUserId,
}: RemoveMemberParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(RemoveMemberSchema, { groupId, targetUserId });
  if (!parsed.success) return { success: false, error: "Invalid parameters." };

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!caller) return { success: false, error: "Caller not found." };

    const isSelf = session.user.id === targetUserId;

    // A member can leave the group themselves
    if (!isSelf) {
      if (!["owner", "admin"].includes(caller.role)) {
        return {
          success: false,
          error: "Only admins or owners can remove members.",
        };
      }
      // Target check
      const targetMember = await db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        ),
      });

      if (!targetMember) return { success: false, error: "Member not found." };
      if (targetMember.role === "owner") {
        return { success: false, error: "The group owner cannot be removed." };
      }
      if (caller.role === "admin" && targetMember.role === "admin") {
        return { success: false, error: "Admins cannot remove other admins." };
      }
    } else {
      if (caller.role === "owner") {
        return {
          success: false,
          error: "You are the group owner. Transfer ownership before leaving.",
        };
      }
    }

    // Clean up all plan enrollments and unbind instance links for this group
    const groupPlanList = await db.query.groupPlans.findMany({
      where: eq(groupPlans.groupId, groupId),
      columns: { id: true },
    });

    if (groupPlanList.length > 0) {
      const planIds = groupPlanList.map((p) => p.id);
      await db
        .delete(groupMemberEnrollments)
        .where(
          and(
            inArray(groupMemberEnrollments.groupPlanId, planIds),
            eq(groupMemberEnrollments.userId, targetUserId)
          )
        );

      await db
        .update(planInstances)
        .set({ groupPlanId: null })
        .where(
          and(
            inArray(planInstances.groupPlanId, planIds),
            eq(planInstances.userId, targetUserId)
          )
        );
    }

    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });

    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    await createNotificationAction({
      userId: targetUserId,
      input: {
        type: "group_activity",
        title: "Removed from Group",
        body: `You have been removed from "${groupRecord?.name || "the group"}".`,
      },
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to remove member.";
    return { success: false, error: message };
  }
}

export type LeaveGroupParams = {
  groupId: string;
};

export async function leaveGroupAction({
  groupId,
}: LeaveGroupParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(LeaveGroupSchema, { groupId });
  if (!parsed.success) return { success: false, error: "Invalid group ID." };

  return removeMemberAction({
    groupId: parsed.output.groupId,
    targetUserId: session.user.id,
  });
}

export type LeaveGroupPlanParams = {
  groupPlanId: string;
};

export async function leaveGroupPlanAction({
  groupPlanId,
}: LeaveGroupPlanParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(LeaveGroupPlanSchema, { groupPlanId });
  if (!parsed.success) return { success: false, error: "Invalid plan ID." };

  try {
    const enrollment = await db.query.groupMemberEnrollments.findFirst({
      where: and(
        eq(groupMemberEnrollments.groupPlanId, parsed.output.groupPlanId),
        eq(groupMemberEnrollments.userId, session.user.id)
      ),
      with: {
        groupPlan: true,
      },
    });

    if (!enrollment) {
      return { success: false, error: "You are not enrolled in this plan." };
    }

    // Delete enrollment mapping
    await db
      .delete(groupMemberEnrollments)
      .where(
        and(
          eq(groupMemberEnrollments.groupPlanId, parsed.output.groupPlanId),
          eq(groupMemberEnrollments.userId, session.user.id)
        )
      );

    // Unlink the groupPlanId from their personal plan instance so it doesn't dangle
    if (enrollment.planInstanceId) {
      await db
        .update(planInstances)
        .set({ groupPlanId: null })
        .where(eq(planInstances.id, enrollment.planInstanceId));
      revalidatePath(`/plans/${enrollment.planInstanceId}`);
    }

    if (enrollment.groupPlan?.groupId) {
      revalidatePath(`/groups/${enrollment.groupPlan.groupId}`);
    }
    revalidatePath("/plans");

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to leave group plan.";
    return { success: false, error: message };
  }
}

export type ToggleLeaderboardPrivacyParams = {
  groupId: string;
  hideProgress: boolean;
};

export async function toggleLeaderboardPrivacyAction({
  groupId,
  hideProgress,
}: ToggleLeaderboardPrivacyParams): Promise<{
  success: boolean;
  error?: string;
  privacyUpdatedAt?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ToggleLeaderboardPrivacySchema, {
    groupId,
    hideProgress,
  });
  if (!parsed.success) return { success: false, error: "Invalid parameters." };

  try {
    const member = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id)
      ),
    });

    if (!member) {
      return { success: false, error: "Membership not found." };
    }

    // 24-hour rate limit verification
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    if (member.privacyUpdatedAt) {
      const now = Date.now();
      const lastUpdated = new Date(member.privacyUpdatedAt).getTime();
      const elapsed = now - lastUpdated;

      if (elapsed < COOLDOWN_MS) {
        const remainingMs = COOLDOWN_MS - elapsed;
        const hoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutesLeft = Math.max(
          1,
          Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
        );
        return {
          success: false,
          error: `Visibility can only be updated once every 24 hours. Please wait ${hoursLeft}h ${minutesLeft}m before changing it again.`,
        };
      }
    }

    const now = new Date();
    await db
      .update(groupMembers)
      .set({
        hideProgress: parsed.output.hideProgress,
        privacyUpdatedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.user.id)
        )
      );

    revalidatePath(`/groups/${groupId}`);
    return { success: true, privacyUpdatedAt: now.toISOString() };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update leaderboard privacy.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Group Plans Scheduling & Enrollment
// ---------------------------------------------------------------------------

export type ScheduleGroupPlanParams = {
  groupId: string;
  planTemplateId: string;
  scheduledStartDate: string;
  dailyChapterTarget?: number;
  activeWeekdaysMask?: string;
  lateJoinPolicy?: GroupLateJoinPolicy;
};

export async function scheduleGroupPlanAction({
  groupId,
  planTemplateId,
  scheduledStartDate,
  dailyChapterTarget = 3,
  activeWeekdaysMask = "1111111",
  lateJoinPolicy = "skip_ahead",
}: ScheduleGroupPlanParams): Promise<{
  success: boolean;
  groupPlanId?: string;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ScheduleGroupPlanSchema, {
    groupId,
    planTemplateId,
    scheduledStartDate,
    dailyChapterTarget,
    activeWeekdaysMask,
    lateJoinPolicy,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid plan parameters.",
    };
  }

  const input = parsed.output;

  try {
    const caller = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        inArray(groupMembers.role, ["owner", "admin"])
      ),
    });

    if (!caller) {
      return {
        success: false,
        error: "Only admins or owners can schedule plans.",
      };
    }

    // Ensure template exists in database (auto-sync static curated template from READING_PLANS if not yet in DB)
    await ensurePlanTemplateInDb({ templateId: input.planTemplateId });

    const template = await db.query.planTemplates.findFirst({
      where: eq(planTemplates.id, input.planTemplateId),
    });
    if (!template) {
      return {
        success: false,
        error: "Selected plan template does not exist.",
      };
    }

    const parts = input.scheduledStartDate.split("-").map(Number);
    const startDateObj = new Date(
      parts[0] || 2026,
      (parts[1] || 1) - 1,
      parts[2] || 1,
      0,
      0,
      0,
      0
    );

    const now = new Date();
    const isAlreadyStarted = startDateObj <= now;
    const initialStatus: GroupPlanStatus = isAlreadyStarted
      ? "active"
      : "scheduled";

    const [newPlan] = await db
      .insert(groupPlans)
      .values({
        groupId,
        planTemplateId: input.planTemplateId,
        scheduledStartDate: startDateObj,
        status: initialStatus,
        lateJoinPolicy: input.lateJoinPolicy ?? "skip_ahead",
        dailyChapterTarget: input.dailyChapterTarget ?? 3,
        activeWeekdaysMask: input.activeWeekdaysMask ?? "1111111",
        createdBy: session.user.id,
        activatedAt: isAlreadyStarted ? now : null,
      })
      .returning();

    if (!newPlan) {
      return { success: false, error: "Failed to schedule group plan." };
    }

    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      columns: { name: true },
    });

    // Post to fellowship notice board (Fan-out on Read: 1 single write for all 1000+ members)
    await db.insert(groupActivities).values({
      groupId,
      actorId: session.user.id,
      type: "plan_scheduled",
      title: "New Fellowship Plan",
      body: `"${template.title}" was scheduled in "${groupRecord?.name || "your group"}". Tap to join.`,
      actionUrl: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, groupPlanId: newPlan.id };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to schedule plan.";
    return { success: false, error: message };
  }
}

export type EnrollInGroupPlanParams = {
  groupPlanId: string;
  trackerId: string;
};

export async function enrollInGroupPlanAction({
  groupPlanId,
  trackerId,
}: EnrollInGroupPlanParams): Promise<{
  success: boolean;
  planInstanceId?: string;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(EnrollInGroupPlanSchema, {
    groupPlanId,
    trackerId,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid enrollment parameters.",
    };
  }

  try {
    const groupPlan = await db.query.groupPlans.findFirst({
      where: eq(groupPlans.id, groupPlanId),
      with: {
        template: true,
      },
    });

    if (!groupPlan) {
      return { success: false, error: "Group plan not found." };
    }

    if (!["active", "scheduled"].includes(groupPlan.status)) {
      return {
        success: false,
        error: "This group plan is no longer open for enrollment.",
      };
    }

    // Verify caller is active group member
    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupPlan.groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      ),
    });

    if (!membership) {
      return {
        success: false,
        error: "You must be an active group member to enroll.",
      };
    }

    // Verify if already enrolled
    const existingEnrollment = await db.query.groupMemberEnrollments.findFirst({
      where: and(
        eq(groupMemberEnrollments.groupPlanId, groupPlanId),
        eq(groupMemberEnrollments.userId, session.user.id)
      ),
    });

    if (existingEnrollment) {
      return {
        success: true,
        planInstanceId: existingEnrollment.planInstanceId,
      };
    }

    // Verify tracker ownership
    const tracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, trackerId),
        eq(readingTrackers.userId, session.user.id)
      ),
    });

    if (!tracker) {
      return {
        success: false,
        error: "Selected reading tracker was not found.",
      };
    }

    const now = new Date();
    const scheduledStart = new Date(groupPlan.scheduledStartDate);
    const hasAlreadyStarted = scheduledStart < now;

    // Check Late-Join policy if plan already started
    if (hasAlreadyStarted && groupPlan.lateJoinPolicy === "strict_locked") {
      return {
        success: false,
        error: "Enrollment for this plan closed once the schedule began.",
      };
    }

    // Format start date string
    const startDateStr = scheduledStart.toISOString().slice(0, 10);

    // Call startPlanAction with groupPlanId - never auto-complete items on enrollment
    const startResult = await startPlanAction({
      templateId: groupPlan.planTemplateId,
      trackerId,
      mode: "scheduled",
      paceType: "by_daily_target",
      startDate: startDateStr,
      dailyTarget: groupPlan.dailyChapterTarget,
      activeDaysMask: groupPlan.activeWeekdaysMask,
      groupPlanId: groupPlan.id,
      autoCompletePastDays: false,
    });

    if (!startResult.success) {
      return {
        success: false,
        error: startResult.error,
      };
    }

    // Record enrollment mapping
    await db.insert(groupMemberEnrollments).values({
      groupPlanId,
      userId: session.user.id,
      planInstanceId: startResult.instanceId,
    });

    await evaluateAndUnlockAchievementsAction({ userId: session.user.id });

    revalidatePath(`/groups/${groupPlan.groupId}`);
    revalidatePath("/plans");

    return { success: true, planInstanceId: startResult.instanceId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to enroll in group plan.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Leaderboard & Cohort Progress
// ---------------------------------------------------------------------------

export type GetGroupLeaderboardParams = {
  groupPlanId: string;
};

export async function getGroupLeaderboardAction({
  groupPlanId,
}: GetGroupLeaderboardParams): Promise<{
  success: boolean;
  leaderboard?: ReadonlyArray<LeaderboardEntry>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const groupPlan = await db.query.groupPlans.findFirst({
      where: eq(groupPlans.id, groupPlanId),
    });
    if (!groupPlan) return { success: false, error: "Group plan not found." };

    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupPlan.groupId),
      columns: { isPrivate: true },
    });
    if (!groupRecord) return { success: false, error: "Group not found." };

    // Fetch members to check hideProgress flag & caller membership
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupPlan.groupId),
    });
    const callerMembership = members.find((m) => m.userId === session.user.id);
    const isCallerMember = Boolean(
      callerMembership && callerMembership.status === "active"
    );

    if (groupRecord.isPrivate && !isCallerMember) {
      return {
        success: false,
        error:
          "This group is private. You must be an active member to view the leaderboard.",
      };
    }

    const enrollments = await db
      .select({
        enrollmentId: groupMemberEnrollments.id,
        userId: groupMemberEnrollments.userId,
        planInstanceId: groupMemberEnrollments.planInstanceId,
        name: user.name,
        image: user.image,
        totalChapters: planInstances.totalChapters,
      })
      .from(groupMemberEnrollments)
      .innerJoin(user, eq(groupMemberEnrollments.userId, user.id))
      .innerJoin(
        planInstances,
        eq(groupMemberEnrollments.planInstanceId, planInstances.id)
      )
      .where(eq(groupMemberEnrollments.groupPlanId, groupPlanId));

    const instanceIds = enrollments.map((e) => e.planInstanceId);
    const readings =
      instanceIds.length > 0
        ? await db
            .select({
              instanceId: planInstanceReadings.instanceId,
              completedAt: planInstanceReadings.completedAt,
            })
            .from(planInstanceReadings)
            .where(inArray(planInstanceReadings.instanceId, instanceIds))
        : [];

    type ReadingRow = (typeof readings)[number];
    const readingsByInstance = new Map<string, ReadingRow[]>();
    for (const r of readings) {
      const list = readingsByInstance.get(r.instanceId) || [];
      list.push(r);
      readingsByInstance.set(r.instanceId, list);
    }

    // Reuse members fetched above to check hideProgress flag
    const hideProgressMap = new Map<string, boolean>();
    members.forEach((m) => hideProgressMap.set(m.userId, m.hideProgress));

    const currentUserHideProgress =
      hideProgressMap.get(session.user.id) ?? false;

    const todayStr = new Date().toISOString().slice(0, 10);

    const entries: LeaderboardEntry[] = enrollments.map((e) => {
      const isCurrentUser = e.userId === session.user.id;
      const isHidden = hideProgressMap.get(e.userId) ?? false;
      // Non-members cannot see names of cohort members.
      // If a member hides their own visibility, reciprocal anonymity applies.
      const shouldAnonymize =
        !isCallerMember ||
        (!isCurrentUser && (isHidden || currentUserHideProgress));

      const userReadings = readingsByInstance.get(e.planInstanceId) || [];
      const totalChapters = e.totalChapters || 1;
      const completedCount = userReadings.length;
      const progressPercent = Math.min(
        100,
        Math.round((completedCount / totalChapters) * 100)
      );

      // Check if user read today
      const readToday = userReadings.some((r) => {
        if (!r.completedAt) return false;
        return new Date(r.completedAt).toISOString().slice(0, 10) === todayStr;
      });

      return {
        userId: shouldAnonymize ? `anon-${e.userId.slice(0, 8)}` : e.userId,
        name: shouldAnonymize
          ? !isCallerMember
            ? "Fellowship Member"
            : "Anonymous Reader"
          : e.name || "Reader",
        avatarUrl: shouldAnonymize ? null : e.image || null,
        isCurrentUser,
        isAnonymous: shouldAnonymize,
        isPrivate: isHidden,
        completedChapters: completedCount,
        totalChapters,
        progressPercent,
        readToday,
      };
    });

    // Sort by progress descending, then by readToday
    entries.sort((a, b) => {
      if (b.progressPercent !== a.progressPercent) {
        return b.progressPercent - a.progressPercent;
      }
      return (b.readToday ? 1 : 0) - (a.readToday ? 1 : 0);
    });

    return { success: true, leaderboard: entries };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to calculate leaderboard.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Community Reflections & Notes Integration
// ---------------------------------------------------------------------------

export type ShareNoteWithCommunityParams = {
  noteId: string;
  isSharedWithCommunity: boolean;
};

export async function shareNoteWithCommunityAction({
  noteId,
  isSharedWithCommunity,
}: ShareNoteWithCommunityParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ShareNoteWithCommunitySchema, {
    noteId,
    isSharedWithCommunity,
  });
  if (!parsed.success) return { success: false, error: "Invalid parameters." };

  try {
    const noteRecord = await db.query.notes.findFirst({
      where: and(eq(notes.id, noteId), eq(notes.userId, session.user.id)),
    });

    if (!noteRecord) {
      return { success: false, error: "Note not found or unauthorized." };
    }

    await db
      .update(notes)
      .set({
        isSharedWithCommunity: parsed.output.isSharedWithCommunity,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    if (noteRecord.planInstanceId) {
      revalidatePath(`/plans/${noteRecord.planInstanceId}`);
    }

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update note sharing.";
    return { success: false, error: message };
  }
}

export type GetGroupSessionNotesParams = {
  groupPlanId: string;
  sessionIndex: number;
};

export async function getGroupSessionNotesAction({
  groupPlanId,
  sessionIndex,
}: GetGroupSessionNotesParams): Promise<{
  success: boolean;
  notes?: ReadonlyArray<GroupSessionNote>;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const groupPlan = await db.query.groupPlans.findFirst({
      where: eq(groupPlans.id, groupPlanId),
      columns: { id: true, groupId: true },
    });
    if (!groupPlan) {
      return { success: false, error: "Group plan not found." };
    }

    const [groupRecord, callerMembership] = await Promise.all([
      db.query.groups.findFirst({
        where: eq(groups.id, groupPlan.groupId),
        columns: { isPrivate: true },
      }),
      db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, groupPlan.groupId),
          eq(groupMembers.userId, session.user.id)
        ),
        columns: { status: true },
      }),
    ]);

    if (!groupRecord) {
      return { success: false, error: "Group not found." };
    }

    if (
      groupRecord.isPrivate &&
      (!callerMembership || callerMembership.status !== "active")
    ) {
      return {
        success: false,
        error:
          "This group is private. You must be an active member to view shared reflections.",
      };
    }

    // 1. Get all plan instances enrolled in this group plan
    const enrollments = await db.query.groupMemberEnrollments.findMany({
      where: eq(groupMemberEnrollments.groupPlanId, groupPlanId),
    });

    if (enrollments.length === 0) {
      return { success: true, notes: [] };
    }

    const instanceIds = enrollments.map((e) => e.planInstanceId);

    // 2. Query shared notes for this session index
    const sharedNotes = await db
      .select({
        id: notes.id,
        userId: notes.userId,
        userName: user.name,
        userAvatar: user.image,
        title: notes.title,
        bodyHtml: notes.bodyHtml,
        plainTextSnippet: notes.plainTextSnippet,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .innerJoin(user, eq(notes.userId, user.id))
      .where(
        and(
          inArray(notes.planInstanceId, instanceIds),
          eq(notes.planDayNumber, sessionIndex),
          eq(notes.isSharedWithCommunity, true),
          eq(notes.isArchived, false)
        )
      )
      .orderBy(desc(notes.updatedAt));

    const result: GroupSessionNote[] = sharedNotes.map((n) => ({
      id: n.id,
      userId: n.userId,
      userName: n.userName || "Reader",
      userAvatar: n.userAvatar || null,
      title: n.title,
      bodyHtml: n.bodyHtml,
      plainTextSnippet: n.plainTextSnippet,
      updatedAt: n.updatedAt,
    }));

    return { success: true, notes: result };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to load group session notes.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Pinned Notice (Bulletin Board)
// ---------------------------------------------------------------------------

export type SetGroupPinnedNoticeParams = {
  groupId: string;
  title?: string;
  content: string;
  expiresAt: string;
};

export async function setGroupPinnedNoticeAction({
  groupId,
  title,
  content,
  expiresAt,
}: SetGroupPinnedNoticeParams): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(SetGroupPinnedNoticeSchema, {
    groupId,
    title,
    content,
    expiresAt,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid notice parameters.",
    };
  }

  const expDate = new Date(parsed.output.expiresAt);
  if (isNaN(expDate.getTime()) || expDate <= new Date()) {
    return {
      success: false,
      error: "Expiration date must be in the future.",
    };
  }

  const groupRecord = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    columns: { ownerId: true, name: true },
  });

  if (!groupRecord) {
    return { success: false, error: "Group not found." };
  }

  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, session.user.id),
      eq(groupMembers.status, "active")
    ),
  });

  const isOwner = groupRecord.ownerId === session.user.id;
  const isAdmin = membership?.role === "admin" || isOwner;

  if (!isAdmin) {
    return {
      success: false,
      error: "Only admins and group owners can pin announcements.",
    };
  }

  try {
    await db
      .update(groups)
      .set({
        pinnedNoticeTitle: parsed.output.title
          ? parsed.output.title.trim()
          : null,
        pinnedNoticeContent: parsed.output.content.trim(),
        pinnedNoticeExpiresAt: expDate,
        pinnedNoticeAuthorId: session.user.id,
        pinnedNoticeUpdatedAt: new Date(),
      })
      .where(eq(groups.id, groupId));

    const noticeTitle = parsed.output.title
      ? parsed.output.title.trim()
      : "Announcement";

    // Post to fellowship notice board (Fan-out on Read: 1 single write for all 1000+ members)
    await db.insert(groupActivities).values({
      groupId,
      actorId: session.user.id,
      type: "notice_pinned",
      title: `Announcement: "${groupRecord.name}"`,
      body: `${noticeTitle}: ${parsed.output.content.trim().slice(0, 100)}`,
      actionUrl: `/groups/${groupId}`,
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save pinned notice.";
    return { success: false, error: message };
  }
}

export type ClearGroupPinnedNoticeParams = {
  groupId: string;
};

export async function clearGroupPinnedNoticeAction({
  groupId,
}: ClearGroupPinnedNoticeParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(ClearGroupPinnedNoticeSchema, { groupId });
  if (!parsed.success) {
    return { success: false, error: "Invalid group ID." };
  }

  const groupRecord = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
    columns: { ownerId: true, name: true },
  });

  if (!groupRecord) {
    return { success: false, error: "Group not found." };
  }

  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, groupId),
      eq(groupMembers.userId, session.user.id),
      eq(groupMembers.status, "active")
    ),
  });

  const isOwner = groupRecord.ownerId === session.user.id;
  const isAdmin = membership?.role === "admin" || isOwner;

  if (!isAdmin) {
    return {
      success: false,
      error: "Only admins and group owners can remove pinned announcements.",
    };
  }

  try {
    await db
      .update(groups)
      .set({
        pinnedNoticeTitle: null,
        pinnedNoticeContent: null,
        pinnedNoticeExpiresAt: null,
        pinnedNoticeAuthorId: null,
        pinnedNoticeUpdatedAt: null,
      })
      .where(eq(groups.id, groupId));

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to clear pinned notice.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Transfer Ownership
// ---------------------------------------------------------------------------

export type TransferGroupOwnershipParams = {
  groupId: string;
  newOwnerUserId: string;
  confirmGroupName: string;
};

export async function transferGroupOwnershipAction({
  groupId,
  newOwnerUserId,
  confirmGroupName,
}: TransferGroupOwnershipParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(TransferGroupOwnershipSchema, {
    groupId,
    newOwnerUserId,
    confirmGroupName,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid parameters.",
    };
  }

  if (newOwnerUserId === session.user.id) {
    return {
      success: false,
      error: "You are already the owner of this fellowship.",
    };
  }

  try {
    const groupRecord = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
    });

    if (!groupRecord) {
      return { success: false, error: "Group not found." };
    }

    if (groupRecord.ownerId !== session.user.id) {
      return {
        success: false,
        error: "Only the current fellowship owner can transfer ownership.",
      };
    }

    if (
      groupRecord.name.trim().toLowerCase() !==
      parsed.output.confirmGroupName.trim().toLowerCase()
    ) {
      return {
        success: false,
        error: `Confirmation name does not match "${groupRecord.name}".`,
      };
    }

    // Verify target user is an active member of this group
    const targetMember = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, newOwnerUserId),
        eq(groupMembers.status, "active")
      ),
    });

    if (!targetMember) {
      return {
        success: false,
        error: "The chosen member is not an active member of this fellowship.",
      };
    }

    const now = new Date();

    // Use transaction to atomically update group owner and member roles
    await db.transaction(async (tx) => {
      // 1. Demote current owner to admin in groupMembers
      await tx
        .update(groupMembers)
        .set({
          role: "admin",
          updatedAt: now,
        })
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, session.user.id)
          )
        );

      // 2. Promote target member to owner in groupMembers
      await tx
        .update(groupMembers)
        .set({
          role: "owner",
          updatedAt: now,
        })
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, newOwnerUserId)
          )
        );

      // 3. Update ownerId in groups table
      await tx
        .update(groups)
        .set({
          ownerId: newOwnerUserId,
          updatedAt: now,
        })
        .where(eq(groups.id, groupId));
    });

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to transfer fellowship ownership.";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Group Plan Lifecycle
// ---------------------------------------------------------------------------

export type UpdateGroupPlanStatusParams = {
  groupPlanId: string;
  status: GroupPlanStatus;
};

export async function updateGroupPlanStatusAction({
  groupPlanId,
  status,
}: UpdateGroupPlanStatusParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(UpdateGroupPlanStatusSchema, {
    groupPlanId,
    status,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.issues[0]?.message || "Invalid parameters.",
    };
  }

  try {
    const plan = await db.query.groupPlans.findFirst({
      where: eq(groupPlans.id, groupPlanId),
      with: { group: true },
    });

    if (!plan) {
      return { success: false, error: "Group plan not found." };
    }

    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, plan.groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      ),
    });

    const isOwner = plan.group?.ownerId === session.user.id;
    const isAdmin = membership?.role === "admin" || isOwner;

    if (!isAdmin) {
      return {
        success: false,
        error: "Only fellowship leaders can change plan status.",
      };
    }

    const now = new Date();
    const updates: Partial<typeof groupPlans.$inferInsert> = {
      status,
      updatedAt: now,
    };

    if (status === "active") {
      updates.activatedAt = plan.activatedAt || now;
      updates.completedAt = null;
    } else if (status === "completed") {
      updates.completedAt = now;
    } else if (status === "cancelled") {
      updates.completedAt = null;
    } else if (status === "scheduled") {
      updates.activatedAt = null;
      updates.completedAt = null;
    }

    await db
      .update(groupPlans)
      .set(updates)
      .where(eq(groupPlans.id, groupPlanId));

    revalidatePath(`/groups/${plan.groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update group plan status.";
    return { success: false, error: message };
  }
}

export type DeleteGroupPlanParams = {
  groupPlanId: string;
};

export async function deleteGroupPlanAction({
  groupPlanId,
}: DeleteGroupPlanParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = v.safeParse(DeleteGroupPlanSchema, { groupPlanId });
  if (!parsed.success) {
    return { success: false, error: "Invalid group plan ID." };
  }

  try {
    const plan = await db.query.groupPlans.findFirst({
      where: eq(groupPlans.id, groupPlanId),
      with: { group: true },
    });

    if (!plan) {
      return { success: false, error: "Group plan not found." };
    }

    const membership = await db.query.groupMembers.findFirst({
      where: and(
        eq(groupMembers.groupId, plan.groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      ),
    });

    const isOwner = plan.group?.ownerId === session.user.id;
    const isAdmin = membership?.role === "admin" || isOwner;

    if (!isAdmin) {
      return {
        success: false,
        error: "Only fellowship leaders can delete a group plan.",
      };
    }

    await db.delete(groupPlans).where(eq(groupPlans.id, groupPlanId));

    revalidatePath(`/groups/${plan.groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete group plan.";
    return { success: false, error: message };
  }
}
