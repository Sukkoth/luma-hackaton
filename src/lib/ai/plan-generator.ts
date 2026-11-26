import * as v from "valibot";
import { type BibleCanon, getBibleBooks } from "@/data/bibleData";
import type { AiPlanBlueprint } from "@/lib/schemas/ai-plans";
import {
  CreateCustomPlanTemplateSchema,
  type CreateCustomPlanTemplateInput,
} from "@/lib/schemas/plans";

export function buildAiPlanSystemPrompt({
  canon,
}: {
  canon: BibleCanon;
}): string {
  const books = getBibleBooks(canon);
  const bookCatalog = books
    .map((book) => `${book.id}:${book.name}(${book.chapters})`)
    .join(", ");

  return [
    "You are an expert Bible study curriculum designer.",
    "Return ONLY valid JSON (no markdown, no explanation, no extra keys) matching this exact structure:",
    "{",
    '  "title": "string (concise, 3-8 words)",',
    '  "subtitle": "string (short tagline, max 12 words)",',
    '  "description": "string (1-2 sentences describing the journey)",',
    '  "category": "Thematic | Canonical | Chronological | Gospels | Wisdom | Epistles",',
    '  "targetDays": 30,',
    '  "sections": [',
    "    {",
    '      "title": "string (section/phase name)",',
    '      "subtitle": "string (optional short note)",',
    '      "ranges": [',
    '        { "bookId": "exact bookId from catalog", "startChapter": 1, "endChapter": 50 },',
    '        { "bookId": "exact bookId from catalog", "startChapter": 7, "endChapter": 7, "startVerse": 14, "endVerse": 25 },',
    '        { "bookId": "exact bookId from catalog", "startChapter": 8, "endChapter": 8, "startVerse": 1, "endVerse": 15 }',
    "      ]",
    "    }",
    "  ]",
    "}",
    "",
    `Valid ${canon} canon bookId:Name(maxChapters) catalog:`,
    bookCatalog,
    "",
    "Rules:",
    "- Use ONLY exact bookId values from the catalog above.",
    "- Never exceed maxChapters for any book.",
    "- Ranges support BOTH whole-chapter readings (omit startVerse and endVerse) and verse-level readings (include BOTH integer startVerse and integer endVerse).",
    "- STRICT RANGE RULES: Never use '+' or open-ended verse ranges. If you include startVerse or endVerse on a range, startChapter MUST equal endChapter, and BOTH startVerse and endVerse MUST be provided with endVerse >= startVerse. To span across chapters with verse bounds, emit separate range objects per chapter.",
    '- CRITICAL FOR VERSE-BASED & N-DAY PLANS: Each whole-chapter range expands into (endChapter - startChapter + 1) daily reading items, whereas each single-chapter verse range (startChapter === endChapter with startVerse & endVerse) creates 1 reading item. Therefore, whenever a topic spans fewer chapters than targetDays (e.g. 10 days for the 10 plagues in Exodus 7-12, 7 days in one Gospel chapter, or 14 days in a 4-chapter epistle), you MUST split those chapters into at least targetDays separate verse-range objects in "ranges" (one per event/pericope) using startVerse and endVerse.',
    "- You do NOT need to make every plan strictly chapter-based or strictly verse-based: choose whichever fits best (whole chapters for broad/multi-book/yearly plans; verse ranges for short, meditative, devotional, thematic-event, or long-chapter passages; or mix both).",
    "- If the user explicitly requests verse-based or chapter-based readings, follow their preference strictly.",
    "- Set targetDays (integer between 1 and 365) from the user's requested timeframe (e.g. 1 year = 365, 6 months = 180, 1 month = 30; default to 30 if unspecified).",
    "- Keep sections and ranges focused and accurate to the user's request.",
    "- For a whole-Bible plan, include all books in logical sections.",
    '- If the user is NOT asking for a reading plan (e.g. asking to explain a verse, greeting, or off-topic question), return ONLY: { "notAPlan": true, "message": "I am in Plan Generator mode. Describe a Bible reading plan (books, theme, and timeframe), or switch to Conversational mode to ask questions." }',
  ].join("\n");
}

export type DistributeBlueprintParams = {
  blueprint: AiPlanBlueprint;
  targetDays: number;
  canon: BibleCanon;
};

export type DistributeBlueprintResult =
  | { success: true; plan: CreateCustomPlanTemplateInput }
  | { success: false; error: string };

export function distributeBlueprintToPlan({
  blueprint,
  targetDays,
  canon,
}: DistributeBlueprintParams): DistributeBlueprintResult {
  const books = getBibleBooks(canon);
  const byId = new Map(books.map((book) => [book.id.toLowerCase(), book]));
  const byName = new Map(books.map((book) => [book.name.toLowerCase(), book]));

  const expandedReadings: Array<{
    bookId: string;
    bookName: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    verseRange?: string;
    versesLabel?: string;
    displayText: string;
  }> = [];

  const builtSections: NonNullable<CreateCustomPlanTemplateInput["sections"]> =
    [];

  for (const section of blueprint.sections) {
    let sectionReadingsCount = 0;
    const sectionBookNames = new Set<string>();

    for (const range of section.ranges) {
      const key = range.bookId.trim().toLowerCase();
      const book = byId.get(key) ?? byName.get(key);
      if (!book) continue;

      const rawStart = Math.min(range.startChapter, range.endChapter);
      const rawEnd = Math.max(range.startChapter, range.endChapter);
      const clampedStart = Math.max(1, Math.min(book.chapters, rawStart));
      const clampedEnd = Math.max(1, Math.min(book.chapters, rawEnd));

      for (let ch = clampedStart; ch <= clampedEnd; ch += 1) {
        if (
          clampedStart === clampedEnd &&
          range.startVerse !== undefined &&
          range.endVerse !== undefined
        ) {
          const startVerse = range.startVerse;
          const endVerse = Math.max(startVerse, range.endVerse);
          const verseRange =
            endVerse !== startVerse
              ? `${startVerse}-${endVerse}`
              : `${startVerse}`;
          const versesLabel =
            endVerse !== startVerse
              ? `vv. ${startVerse}-${endVerse}`
              : `v. ${startVerse}`;
          expandedReadings.push({
            bookId: book.id,
            bookName: book.name,
            chapter: ch,
            startVerse,
            endVerse,
            verseRange,
            versesLabel,
            displayText: `${book.name} ${ch}:${verseRange}`,
          });
        } else {
          expandedReadings.push({
            bookId: book.id,
            bookName: book.name,
            chapter: ch,
            displayText: `${book.name} ${ch}`,
          });
        }
        sectionReadingsCount += 1;
      }
      sectionBookNames.add(book.name);
    }

    if (sectionReadingsCount > 0) {
      builtSections.push({
        title: section.title,
        subtitle: section.subtitle,
        chaptersCount: sectionReadingsCount,
        booksDescription: Array.from(sectionBookNames).slice(0, 6).join(", "),
      });
    }
  }

  if (expandedReadings.length === 0) {
    return {
      success: false,
      error:
        "The AI plan did not contain any valid Bible chapters. Try rephrasing your prompt.",
    };
  }

  const totalChapters = expandedReadings.length;
  const clampedTargetDays = Math.max(1, Math.min(365, Math.round(targetDays)));
  const actualDays = Math.min(clampedTargetDays, totalChapters);

  const readings: CreateCustomPlanTemplateInput["readings"] =
    expandedReadings.map((item, idx) => {
      const dayNumber = Math.floor((idx * actualDays) / totalChapters) + 1;
      return {
        bookId: item.bookId,
        bookName: item.bookName,
        chapter: item.chapter,
        ...(item.startVerse !== undefined
          ? { startVerse: item.startVerse }
          : {}),
        ...(item.endVerse !== undefined ? { endVerse: item.endVerse } : {}),
        ...(item.verseRange ? { verseRange: item.verseRange } : {}),
        ...(item.versesLabel ? { versesLabel: item.versesLabel } : {}),
        displayText: item.displayText,
        dayNumber,
        order: idx + 1,
      };
    });

  const defaultDailyTarget = Math.max(1, Math.ceil(totalChapters / actualDays));

  const candidatePlan: CreateCustomPlanTemplateInput = {
    title: blueprint.title,
    subtitle: blueprint.subtitle ?? `${actualDays}-day guided reading plan`,
    description:
      blueprint.description ??
      `Custom ${actualDays}-day Bible reading plan covering ${totalChapters} chapters.`,
    category: blueprint.category ?? "Thematic",
    icon: "Sparkles",
    totalChapters,
    defaultDailyTarget,
    targetDays: actualDays,
    canonCompatibility: canon,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: builtSections,
    readings,
  };

  const validated = v.safeParse(CreateCustomPlanTemplateSchema, candidatePlan);
  if (!validated.success) {
    return {
      success: false,
      error:
        validated.issues[0]?.message ?? "Generated plan failed validation.",
    };
  }

  return { success: true, plan: validated.output };
}
