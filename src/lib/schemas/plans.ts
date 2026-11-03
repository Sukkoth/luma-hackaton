import * as v from "valibot";

export const StartPlanSchema = v.object({
  templateId: v.pipe(v.string(), v.minLength(1, "Template ID is required")),
  trackerId: v.pipe(v.string(), v.minLength(1, "Tracker ID is required")),
  mode: v.picklist(
    ["scheduled", "flexible"],
    "Mode must be scheduled or flexible"
  ),
  paceType: v.picklist(
    ["by_daily_target", "by_end_date", "self_paced"],
    "Invalid pace type"
  ),
  startDate: v.pipe(v.string(), v.minLength(1, "Start date is required")),
  dailyTarget: v.pipe(
    v.number(),
    v.minValue(1, "Daily target must be at least 1"),
    v.maxValue(50, "Daily target cannot exceed 50")
  ),
  targetEndDate: v.optional(v.string()),
  activeDaysMask: v.pipe(
    v.string(),
    v.regex(/^[01]{7}$/, "Active days mask must be 7 binary digits (Sun-Sat)")
  ),
  autoCompletePastDays: v.optional(v.boolean()),
  reminderEnabled: v.optional(v.boolean()),
  reminderTime: v.optional(v.string()),
  createNoteFolder: v.optional(v.boolean()),
});

export type StartPlanInput = v.InferOutput<typeof StartPlanSchema>;

export const TogglePlanReadingSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
  readingItemId: v.pipe(
    v.string(),
    v.minLength(1, "Reading item ID is required")
  ),
});
export type TogglePlanReadingInput = v.InferOutput<
  typeof TogglePlanReadingSchema
>;

export const UpdatePlanSettingsSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
  status: v.optional(v.picklist(["active", "paused", "archived"])),
  mode: v.optional(v.picklist(["scheduled", "flexible"])),
  paceType: v.optional(
    v.picklist(["by_daily_target", "by_end_date", "self_paced"])
  ),
  dailyTarget: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(50))),
  targetEndDate: v.optional(v.string()),
  activeDaysMask: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^[01]{7}$/, "Active days mask must be 7 binary digits (Sun-Sat)")
    )
  ),
  reminderEnabled: v.optional(v.boolean()),
  reminderTime: v.optional(v.string()),
  shiftScheduleOnResume: v.optional(v.boolean()),
});
export type UpdatePlanSettingsInput = v.InferOutput<
  typeof UpdatePlanSettingsSchema
>;

export const DeletePlanInstanceSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
});
export type DeletePlanInstanceInput = v.InferOutput<
  typeof DeletePlanInstanceSchema
>;

export const CatchUpShiftSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
});
export type CatchUpShiftInput = v.InferOutput<typeof CatchUpShiftSchema>;

export const CatchUpIncreasePaceSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
  newDailyTarget: v.pipe(
    v.number(),
    v.minValue(1, "Daily target must be at least 1"),
    v.maxValue(50, "Daily target cannot exceed 50")
  ),
});
export type CatchUpIncreasePaceInput = v.InferOutput<
  typeof CatchUpIncreasePaceSchema
>;

export const PausePlanSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
});
export type PausePlanInput = v.InferOutput<typeof PausePlanSchema>;

export const ResumePlanSchema = v.object({
  instanceId: v.pipe(v.string(), v.minLength(1, "Instance ID is required")),
});
export type ResumePlanInput = v.InferOutput<typeof ResumePlanSchema>;
