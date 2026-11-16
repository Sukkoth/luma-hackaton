import * as v from "valibot";

export const GroupRoleEnumSchema = v.picklist(["owner", "admin", "member"]);
export const GroupPlanStatusEnumSchema = v.picklist([
  "scheduled",
  "active",
  "completed",
  "cancelled",
]);
export const GroupLateJoinPolicyEnumSchema = v.picklist([
  "strict_locked",
  "skip_ahead",
  "backfill",
]);

export const CreateGroupSchema = v.object({
  name: v.pipe(
    v.string("Group name is required."),
    v.trim(),
    v.minLength(3, "Group name must be at least 3 characters."),
    v.maxLength(100, "Group name must be at most 100 characters.")
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(500, "Description must be at most 500 characters.")
    ),
    ""
  ),
  avatarUrl: v.optional(v.pipe(v.string(), v.trim())),
  isPrivate: v.optional(v.boolean(), true),
  requiresApproval: v.optional(v.boolean(), false),
});

export const UpdateGroupSettingsSchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1, "Group ID is required.")),
  name: v.pipe(
    v.string("Group name is required."),
    v.trim(),
    v.minLength(3, "Group name must be at least 3 characters."),
    v.maxLength(100, "Group name must be at most 100 characters.")
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(500, "Description must be at most 500 characters.")
    ),
    ""
  ),
  avatarUrl: v.optional(v.pipe(v.string(), v.trim())),
  isPrivate: v.optional(v.boolean(), true),
  requiresApproval: v.optional(v.boolean(), false),
});

export const JoinGroupSchema = v.object({
  inviteCode: v.pipe(
    v.string("Invite code is required."),
    v.trim(),
    v.minLength(4, "Invalid invite code.")
  ),
});

export const ScheduleGroupPlanSchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1, "Group ID is required.")),
  planTemplateId: v.pipe(
    v.string("Plan template ID is required."),
    v.trim(),
    v.minLength(1)
  ),
  scheduledStartDate: v.pipe(
    v.string("Start date is required."),
    v.trim(),
    v.minLength(10, "Format must be YYYY-MM-DD")
  ),
  dailyChapterTarget: v.optional(
    v.pipe(v.number(), v.minValue(1), v.maxValue(50)),
    3
  ),
  activeWeekdaysMask: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.regex(/^[01]{7}$/, "Mask must be exactly 7 digits of 0 or 1.")
    ),
    "1111111"
  ),
  lateJoinPolicy: v.optional(GroupLateJoinPolicyEnumSchema, "skip_ahead"),
});

export const EnrollInGroupPlanSchema = v.object({
  groupPlanId: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Group Plan ID is required.")
  ),
  trackerId: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Reading Tracker ID is required.")
  ),
});

export const UpdateMemberRoleSchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  targetUserId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  newRole: GroupRoleEnumSchema,
});

export const RemoveMemberSchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  targetUserId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export const ApproveMemberSchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  targetUserId: v.pipe(v.string(), v.trim(), v.minLength(1)),
});

export const ToggleLeaderboardPrivacySchema = v.object({
  groupId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  hideProgress: v.boolean(),
});

export const ShareNoteWithCommunitySchema = v.object({
  noteId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  isSharedWithCommunity: v.boolean(),
});

export type CreateGroupInput = v.InferOutput<typeof CreateGroupSchema>;
export type UpdateGroupSettingsInput = v.InferOutput<
  typeof UpdateGroupSettingsSchema
>;
export type ScheduleGroupPlanInput = v.InferOutput<
  typeof ScheduleGroupPlanSchema
>;
export type EnrollInGroupPlanInput = v.InferOutput<
  typeof EnrollInGroupPlanSchema
>;
