"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, desc, ilike, inArray, sql } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import {
  groups,
  groupMembers,
  groupPlans,
  groupMemberEnrollments,
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
} from "@/lib/schemas/groups";
import { startPlanAction } from "@/actions/plans";

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
  createdAt: Date;
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

function generateInviteCode({ groupName }: { groupName: string }): string {
  const clean = groupName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 16)
    .replace(/^-|-$/g, "");
  const randomSuffix = Math.random().toString(36).slice(2, 6);
  return `${clean || "group"}-${randomSuffix}`;
}

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
  const inviteCode = generateInviteCode({ groupName: input.name });

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

    revalidatePath("/groups");
    return { success: true, groupId: newGroup.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create group.";
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

    for (const p of scheduledToActivate) {
      if (new Date(p.scheduledStartDate) <= now) {
        await db
          .update(groupPlans)
          .set({ status: "active", activatedAt: now })
          .where(eq(groupPlans.id, p.id));
      }
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

    // Fetch all group plans
    const allPlans = await db.query.groupPlans.findMany({
      where: eq(groupPlans.groupId, groupId),
      with: {
        template: true,
        enrollments: true,
      },
      orderBy: [desc(groupPlans.createdAt)],
    });

    const activePlans: GroupPlanSummary[] = [];
    const scheduledPlans: GroupPlanSummary[] = [];
    const completedPlans: GroupPlanSummary[] = [];

    for (const p of allPlans) {
      const userEnrollment = p.enrollments.find(
        (e) => e.userId === session.user.id
      );

      const summary: GroupPlanSummary = {
        id: p.id,
        planTemplateId: p.planTemplateId,
        templateTitle: p.template?.title || "Reading Plan",
        scheduledStartDate: p.scheduledStartDate,
        status: p.status as GroupPlanStatus,
        lateJoinPolicy: p.lateJoinPolicy as GroupLateJoinPolicy,
        dailyChapterTarget: p.dailyChapterTarget,
        activeWeekdaysMask: p.activeWeekdaysMask,
        totalChapters: p.template?.totalChapters || 0,
        userEnrolledInstanceId: userEnrollment?.planInstanceId || null,
        enrolledMembersCount: p.enrollments.length,
        createdAt: p.createdAt,
      };

      if (p.status === "active") activePlans.push(summary);
      else if (p.status === "scheduled") scheduledPlans.push(summary);
      else if (p.status === "completed") completedPlans.push(summary);
    }

    return {
      success: true,
      group: {
        id: groupRecord.id,
        name: groupRecord.name,
        description: groupRecord.description,
        avatarUrl: groupRecord.avatarUrl,
        inviteCode: groupRecord.inviteCode,
        ownerId: groupRecord.ownerId,
        isPrivate: groupRecord.isPrivate,
        requiresApproval: groupRecord.requiresApproval,
        currentUserRole: (membership?.role as GroupRole) || null,
        currentUserMembershipStatus:
          (membership?.status as GroupMembershipStatus) || null,
        currentUserHideProgress: membership?.hideProgress ?? false,
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
    const userMemberships = await db.query.groupMembers.findMany({
      where: eq(groupMembers.userId, session.user.id),
      with: {
        group: {
          with: {
            members: true,
            plans: true,
          },
        },
      },
      orderBy: [desc(groupMembers.joinedAt)],
    });

    const list: UserGroupSummary[] = userMemberships.map((m) => {
      const activeMembers = m.group.members.filter((gm) => gm.status === "active");
      const activePlans = m.group.plans.filter((gp) => gp.status === "active");

      return {
        id: m.group.id,
        name: m.group.name,
        description: m.group.description,
        avatarUrl: m.group.avatarUrl,
        inviteCode: m.group.inviteCode,
        role: m.role as GroupRole,
        status: m.status as GroupMembershipStatus,
        memberCount: activeMembers.length,
        activePlansCount: activePlans.length,
      };
    });

    return { success: true, groups: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch user groups.";
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
    const trimmed = query.trim();
    const condition = trimmed
      ? and(
          eq(groups.isPrivate, false),
          ilike(groups.name, `%${trimmed}%`)
        )
      : eq(groups.isPrivate, false);

    const publicGroups = await db.query.groups.findMany({
      where: condition,
      with: {
        members: true,
      },
      limit,
      orderBy: [desc(groups.createdAt)],
    });

    const result = publicGroups.map((g) => {
      const activeMembers = g.members.filter((m) => m.status === "active");
      const isEnrolled = g.members.some(
        (m) => m.userId === session.user.id && m.status === "active"
      );

      return {
        id: g.id,
        name: g.name,
        description: g.description,
        avatarUrl: g.avatarUrl,
        memberCount: activeMembers.length,
        requiresApproval: g.requiresApproval,
        isEnrolled,
      };
    });

    return { success: true, groups: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to search public groups.";
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

    revalidatePath("/groups");
    revalidatePath(`/groups/${groupRecord.id}`);

    return { success: true, groupId: groupRecord.id, status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to join group.";
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
      return { success: false, error: "You are not an active member of this group." };
    }

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
      const summary: GroupMemberSummary = {
        id: m.id,
        userId: m.userId,
        name: m.name || "Reader",
        email: m.email || "",
        image: m.image || null,
        role: m.role as GroupRole,
        status: m.status as GroupMembershipStatus,
        hideProgress: m.hideProgress,
        joinedAt: m.joinedAt,
      };

      if (m.status === "active") members.push(summary);
      else if (m.status === "pending_approval") pendingMembers.push(summary);
    }

    return { success: true, members, pendingMembers };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch members.";
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
      return { success: false, error: "Only admins or owners can approve members." };
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

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve member.";
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
      return { success: false, error: "Only admins or owners can reject members." };
    }

    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reject member.";
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
      return { success: false, error: "Only admins or the owner can update roles." };
    }

    // Only owner can promote someone to owner or transfer ownership
    if (newRole === "owner") {
      if (caller.role !== "owner") {
        return { success: false, error: "Only the group owner can transfer ownership." };
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

    if (!targetMember) return { success: false, error: "Target member not found." };

    if (caller.role === "admin" && targetMember.role !== "member") {
      return { success: false, error: "Admins can only promote or demote regular members." };
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
    const message = err instanceof Error ? err.message : "Failed to update member role.";
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
        return { success: false, error: "Only admins or owners can remove members." };
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

    await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId)
        )
      );

    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove member.";
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
    await db
      .update(groupMembers)
      .set({ hideProgress: parsed.output.hideProgress, updatedAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.user.id)
        )
      );

    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update leaderboard privacy.";
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
      return { success: false, error: "Only admins or owners can schedule plans." };
    }

    const template = await db.query.planTemplates.findFirst({
      where: eq(planTemplates.id, input.planTemplateId),
    });
    if (!template) {
      return { success: false, error: "Selected plan template does not exist." };
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

    revalidatePath(`/groups/${groupId}`);
    return { success: true, groupPlanId: newPlan.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to schedule plan.";
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
      return { success: false, error: "This group plan is no longer open for enrollment." };
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
      return { success: false, error: "You must be an active group member to enroll." };
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
      return { success: false, error: "Selected reading tracker was not found." };
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

    // Call startPlanAction with groupPlanId
    const startResult = await startPlanAction({
      templateId: groupPlan.planTemplateId,
      trackerId,
      mode: "scheduled",
      paceType: "by_daily_target",
      startDate: startDateStr,
      dailyTarget: groupPlan.dailyChapterTarget,
      activeDaysMask: groupPlan.activeWeekdaysMask,
      groupPlanId: groupPlan.id,
      autoCompletePastDays: groupPlan.lateJoinPolicy === "skip_ahead",
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

    revalidatePath(`/groups/${groupPlan.groupId}`);
    revalidatePath("/plans");

    return { success: true, planInstanceId: startResult.instanceId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enroll in group plan.";
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

    // Fetch members to check hideProgress flag
    const members = await db.query.groupMembers.findMany({
      where: eq(groupMembers.groupId, groupPlan.groupId),
    });
    const hideProgressMap = new Map<string, boolean>();
    members.forEach((m) => hideProgressMap.set(m.userId, m.hideProgress));

    const todayStr = new Date().toISOString().slice(0, 10);

    const entries: LeaderboardEntry[] = enrollments.map((e) => {
      const isCurrentUser = e.userId === session.user.id;
      const isHidden = hideProgressMap.get(e.userId) ?? false;
      const shouldAnonymize = isHidden && !isCurrentUser;

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
        userId: e.userId,
        name: shouldAnonymize ? "Anonymous Reader" : e.name || "Reader",
        avatarUrl: shouldAnonymize ? null : e.image || null,
        isCurrentUser,
        isAnonymous: shouldAnonymize,
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
    const message = err instanceof Error ? err.message : "Failed to calculate leaderboard.";
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
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, session.user.id)
      ),
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
    const message = err instanceof Error ? err.message : "Failed to update note sharing.";
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
      err instanceof Error ? err.message : "Failed to load group session notes.";
    return { success: false, error: message };
  }
}
