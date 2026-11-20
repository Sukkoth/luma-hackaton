import * as v from "valibot";

export const MarkAchievementCelebratedSchema = v.object({
  achievementId: v.pipe(
    v.string(),
    v.minLength(1, "Achievement ID is required")
  ),
});

export type MarkAchievementCelebratedInput = v.InferOutput<
  typeof MarkAchievementCelebratedSchema
>;
