import "server-only";

import { jsonSchema, tool } from "ai";
import * as v from "valibot";
import { type BibleCanon, getBibleBooks } from "@/data/bibleData";
import { getBookUsfm } from "@/lib/bible-versions";

const BollsChapterSchema = v.array(
  v.object({
    verse: v.number(),
    text: v.string(),
  })
);

type GetVerseArgs = {
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

const getVerseInputSchema = jsonSchema<GetVerseArgs>({
  type: "object",
  properties: {
    bookId: {
      type: "string",
      description:
        "Exact lowercase bookId from the active canon catalog (e.g. 'rom', 'jhn', 'psa', 'gen').",
    },
    chapter: {
      type: "integer",
      minimum: 1,
      description: "1-based chapter number.",
    },
    startVerse: {
      type: "integer",
      minimum: 1,
      description: "Optional starting verse number.",
    },
    endVerse: {
      type: "integer",
      minimum: 1,
      description: "Optional ending verse number (defaults to startVerse).",
    },
  },
  required: ["bookId", "chapter"],
  additionalProperties: false,
});

function stripVerseHtml({ raw }: { raw: string }): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function createGetVerseTool({ canon }: { canon: BibleCanon }) {
  const books = getBibleBooks(canon);
  const byId = new Map(books.map((b) => [b.id.toLowerCase(), b]));
  const byName = new Map(books.map((b) => [b.name.toLowerCase(), b]));

  return tool({
    description:
      "Fetch real Bible verse or chapter text from the database/API before quoting or citing Scripture. Always verify verse text and references with this tool instead of quoting from memory.",
    inputSchema: getVerseInputSchema,
    execute: async ({ bookId, chapter, startVerse, endVerse }) => {
      const key = bookId.trim().toLowerCase();
      const book = byId.get(key) ?? byName.get(key);
      if (!book) {
        return {
          found: false,
          error: `Unknown book '${bookId}' in ${canon} canon.`,
        };
      }

      if (chapter < 1 || chapter > book.chapters) {
        return {
          found: false,
          error: `${book.name} only has ${book.chapters} chapters (requested ${chapter}).`,
        };
      }

      const usfm = getBookUsfm({ bookId: book.id });
      const resolvedStart =
        startVerse && startVerse >= 1 ? Math.floor(startVerse) : undefined;
      const resolvedEnd =
        resolvedStart !== undefined
          ? endVerse && endVerse >= resolvedStart
            ? Math.floor(endVerse)
            : resolvedStart
          : undefined;

      const query = new URLSearchParams();
      if (resolvedStart !== undefined) {
        query.set("startVerse", String(resolvedStart));
        if (resolvedEnd !== undefined) {
          query.set("endVerse", String(resolvedEnd));
        }
      }
      const queryStr = query.toString();
      const urlPath = `/bible/${book.id}/${chapter}${queryStr ? `?${queryStr}` : ""}`;
      const reference =
        resolvedStart !== undefined
          ? resolvedEnd !== undefined && resolvedEnd !== resolvedStart
            ? `${book.name} ${chapter}:${resolvedStart}-${resolvedEnd}`
            : `${book.name} ${chapter}:${resolvedStart}`
          : `${book.name} ${chapter}`;

      try {
        const res = await fetch(
          `https://bolls.life/get-text/WEB/${encodeURIComponent(usfm)}/${chapter}/`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) {
          return {
            found: false,
            reference,
            url: urlPath,
            error: "Verse lookup service temporarily unavailable.",
          };
        }

        const rawJson: unknown = await res.json();
        const parsed = v.safeParse(BollsChapterSchema, rawJson);
        if (!parsed.success || parsed.output.length === 0) {
          return {
            found: false,
            reference,
            url: urlPath,
            error: "Could not parse passage text.",
          };
        }

        const filtered =
          resolvedStart !== undefined && resolvedEnd !== undefined
            ? parsed.output.filter(
                (item) =>
                  item.verse >= resolvedStart && item.verse <= resolvedEnd
              )
            : parsed.output.slice(0, 15);

        if (filtered.length === 0) {
          return {
            found: false,
            reference,
            url: urlPath,
            error: `Requested verse range does not exist in ${book.name} ${chapter}.`,
          };
        }

        const text = filtered
          .map(
            (item) => `[${item.verse}] ${stripVerseHtml({ raw: item.text })}`
          )
          .join(" ");

        return {
          found: true,
          reference,
          version: "WEB",
          text,
          url: urlPath,
        };
      } catch {
        return {
          found: false,
          reference,
          url: urlPath,
          error: "Network error while looking up verse.",
        };
      }
    },
  });
}
