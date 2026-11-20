import * as v from "valibot";

export const UpdateUserSettingsSchema = v.object({
  dailyReminderEnabled: v.optional(v.boolean()),
  dailyReminderTime: v.optional(
    v.pipe(
      v.string(),
      v.regex(
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        "Time must be in 24-hour HH:MM format (e.g., 20:00)."
      )
    )
  ),
});

export type UpdateUserSettingsInput = v.InferInput<
  typeof UpdateUserSettingsSchema
>;
export type UpdateUserSettingsOutput = v.InferOutput<
  typeof UpdateUserSettingsSchema
>;
