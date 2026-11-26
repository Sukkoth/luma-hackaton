import * as v from "valibot";

export const AiStudioModeSchema = v.picklist(["plan", "chat"]);
export type AiStudioMode = v.InferOutput<typeof AiStudioModeSchema>;

export const AiChatMessageSchema = v.object({
  role: v.picklist(["user", "assistant"]),
  content: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32000)),
});

export const AiChatRequestSchema = v.object({
  mode: v.optional(v.literal("chat"), "chat"),
  messages: v.pipe(
    v.array(AiChatMessageSchema),
    v.minLength(1),
    v.maxLength(16)
  ),
  canon: v.optional(
    v.picklist([
      "protestant",
      "catholic",
      "eastern_orthodox",
      "ethiopian_orthodox",
    ]),
    "protestant"
  ),
});

export type AiChatRequestInput = v.InferOutput<typeof AiChatRequestSchema>;

export const GenerateAiPlanRequestSchema = v.object({
  prompt: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(5, "Describe the plan you want (at least 5 characters)"),
    v.maxLength(600, "Prompt cannot exceed 600 characters")
  ),
  targetDays: v.optional(
    v.pipe(
      v.number(),
      v.integer("Duration must be a whole number of days"),
      v.minValue(1, "Duration must be at least 1 day"),
      v.maxValue(365, "Duration cannot exceed 365 days (1 year)")
    )
  ),
  canon: v.optional(
    v.picklist([
      "protestant",
      "catholic",
      "eastern_orthodox",
      "ethiopian_orthodox",
    ]),
    "protestant"
  ),
  previousContext: v.optional(v.pipe(v.string(), v.maxLength(2000))),
});

export type GenerateAiPlanRequestInput = v.InferOutput<
  typeof GenerateAiPlanRequestSchema
>;

export const AiBlueprintRangeSchema = v.pipe(
  v.object({
    bookId: v.pipe(v.string(), v.trim(), v.minLength(1)),
    startChapter: v.pipe(v.number(), v.integer(), v.minValue(1)),
    endChapter: v.pipe(v.number(), v.integer(), v.minValue(1)),
    startVerse: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
    endVerse: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  }),
  v.check(
    (range) => range.endChapter >= range.startChapter,
    "endChapter must be greater than or equal to startChapter"
  ),
  v.check((range) => {
    const hasStart = range.startVerse !== undefined;
    const hasEnd = range.endVerse !== undefined;
    if (!hasStart && !hasEnd) return true;
    return (
      hasStart &&
      hasEnd &&
      range.startChapter === range.endChapter &&
      (range.endVerse as number) >= (range.startVerse as number)
    );
  }, "Verse-level ranges must have startChapter === endChapter and both startVerse and endVerse (endVerse >= startVerse)")
);

export const AiBlueprintSectionSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  subtitle: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
  ranges: v.pipe(v.array(AiBlueprintRangeSchema), v.minLength(1)),
});

export const AiPlanBlueprintSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120)),
  subtitle: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(180))),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500))),
  category: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(40))),
  targetDays: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(365))
  ),
  sections: v.pipe(v.array(AiBlueprintSectionSchema), v.minLength(1)),
});

export type AiPlanBlueprint = v.InferOutput<typeof AiPlanBlueprintSchema>;
