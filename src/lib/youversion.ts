import * as v from "valibot";

const YouVersionVOTDSchema = v.object({
  day: v.number(),
  passage_id: v.string(),
  image_id: v.nullable(v.string()),
});

const YouVersionPassageSchema = v.object({
  id: v.string(),
  content: v.string(),
  reference: v.string(),
});

const YouVersionImageSchema = v.object({
  id: v.optional(v.string()),
  image_url: v.string(),
  attribution: v.optional(v.string()),
});

const BollsVerseSchema = v.array(
  v.object({
    verse: v.number(),
    text: v.string(),
  })
);

export type VerseOfTheDayData = {
  day: number;
  reference: string;
  text: string;
  version: string;
  imageUrl?: string;
  attribution?: string;
};

export type GetVerseOfTheDayParams = {
  dayOfYear?: number;
  bibleId?: number;
};

const FALLBACK_VOTD: VerseOfTheDayData = {
  day: 305,
  reference: "John 1:1",
  text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
  version: "English Standard Version",
  imageUrl:
    "https://cdn.youversion.com/images/base/eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYtMTAtMTgtYSIsIm5vbmNlIjoiNjNjZTA5MTZjYmRmZmFjZTc0ZjM1YWU5In0.cXeWzNBZdIZylrzqFd2AWBKx1Kxlo6sBm0UcG5ZGHDG8W5KxHslGEmErMgQjgO8gWU2O4nSpa5EveYosdWYcpA6NZhnmEQWVlbDataQcTYedpRLwo_NYdbAP3oUtrA2ZcLkKuCXKGYRDVS_fVdl11PYgeNXJrDrSjTS9GToydW_0Gwpo8af9ByV6M7jq9vYrBPmzrf_Oc5TduFHfYTkWqGSQZyyKBf3QxRQ19tPKM0gKDPr4DzFjSJlg_tAzPlW5ZXmTXoAFvJQRImk9PdtY97CSSQIXSDNfo2qZq2uKNO96YohJ7UTruqJWFGI3WObVOUzqAHRUmcqlVjcish9PBT3MZHY5RSqnehyptmoPbA.qIdvmlXw2lNEWo60BNE9tOFwZmBmpjgR3sOvb1mr36GNm5LwVwhJtrwIjJ5h6nWMKQG0x2YMZTDtt552-R7utQ/1280x1280.jpg",
  attribution: "© YouVersion",
};

let inMemoryCache: { data: VerseOfTheDayData; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour memory TTL to protect developer rate limit

/**
 * Calculates the current day of the year (1 - 366).
 */
export function getDayOfYear({ date }: { date?: Date } = {}): number {
  const targetDate = date ?? new Date();
  const start = new Date(targetDate.getFullYear(), 0, 0);
  const diff = targetDate.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

type FetchEsvVerseParams = {
  passageId: string;
};

/**
 * Fetches the verse text in English Standard Version (ESV).
 */
async function fetchEsvVerseText({
  passageId,
}: FetchEsvVerseParams): Promise<string | null> {
  try {
    const parts = passageId.split(".");
    if (parts.length < 3) return null;
    const [book, chapterStr, verseRange] = parts;
    const chapter = parseInt(chapterStr, 10);
    if (Number.isNaN(chapter)) return null;

    const [startStr, endStr] = (verseRange || "1").split("-");
    const startVerse = parseInt(startStr, 10);
    const endVerse = endStr ? parseInt(endStr, 10) : startVerse;

    const url = `https://bolls.life/get-text/ESV/${book}/${chapter}/`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;

    const raw: unknown = await res.json();
    const parsed = v.safeParse(BollsVerseSchema, raw);
    if (!parsed.success) return null;

    const matched = parsed.output.filter(
      (v) => v.verse >= startVerse && v.verse <= endVerse
    );

    if (matched.length === 0) return null;

    const combined = matched
      .map((v) => v.text.replace(/<[^>]+>/g, "").trim())
      .join(" ");

    return combined || null;
  } catch {
    return null;
  }
}

/**
 * Fetches the daily Scripture verse from YouVersion's Platform API.
 * Uses Next.js incremental static revalidation (cached for 1 hour).
 */
export async function getVerseOfTheDay({
  dayOfYear,
  bibleId = 3034, // Berean Standard Bible (fallback)
}: GetVerseOfTheDayParams = {}): Promise<VerseOfTheDayData> {
  const currentDay = dayOfYear ?? getDayOfYear();

  // Return in-memory cached data if fresh (protects against YouVersion 429 rate-limiting)
  if (
    inMemoryCache &&
    inMemoryCache.data.day === currentDay &&
    Date.now() - inMemoryCache.timestamp < CACHE_TTL_MS
  ) {
    return inMemoryCache.data;
  }

  const appKey = process.env.APP_KEY;

  if (!appKey) {
    return {
      ...FALLBACK_VOTD,
      day: currentDay,
    };
  }

  try {
    // 1. Fetch Verse of the Day scheduling from YouVersion
    const votdUrl = `https://api.youversion.com/v1/verse-of-the-days/${currentDay}?language_ranges[]=en`;
    const votdRes = await fetch(votdUrl, {
      headers: {
        "X-YVP-App-Key": appKey,
      },
      next: { revalidate: 3600 },
    });

    if (!votdRes.ok) {
      console.warn(
        `YouVersion VOTD endpoint returned status ${votdRes.status}`
      );
      return inMemoryCache?.data ?? { ...FALLBACK_VOTD, day: currentDay };
    }

    const votdRaw: unknown = await votdRes.json();
    const parsedVotd = v.safeParse(YouVersionVOTDSchema, votdRaw);

    if (!parsedVotd.success) {
      console.warn("YouVersion VOTD response failed validation");
      return inMemoryCache?.data ?? { ...FALLBACK_VOTD, day: currentDay };
    }

    const passageId = parsedVotd.output.passage_id;

    // 2. Resolve passage reference and artwork
    const [passageRes, esvText] = await Promise.all([
      fetch(
        `https://api.youversion.com/v1/bibles/${bibleId}/passages/${passageId}?format=text`,
        {
          headers: {
            "X-YVP-App-Key": appKey,
          },
          next: { revalidate: 3600 },
        }
      ),
      fetchEsvVerseText({ passageId }),
    ]);

    if (!passageRes.ok) {
      console.warn(
        `YouVersion passage endpoint returned status ${passageRes.status}`
      );
      return inMemoryCache?.data ?? { ...FALLBACK_VOTD, day: currentDay };
    }

    const passageRaw: unknown = await passageRes.json();
    const parsedPassage = v.safeParse(YouVersionPassageSchema, passageRaw);

    if (!parsedPassage.success) {
      console.warn("YouVersion passage response failed validation");
      return inMemoryCache?.data ?? { ...FALLBACK_VOTD, day: currentDay };
    }

    let imageUrl: string | undefined;
    let attribution: string | undefined;

    // 3. If verse artwork exists for today, resolve image details
    if (parsedVotd.output.image_id) {
      try {
        const imgUrl = `https://api.youversion.com/v1/images/${parsedVotd.output.image_id}`;
        const imgRes = await fetch(imgUrl, {
          headers: {
            "X-YVP-App-Key": appKey,
          },
          next: { revalidate: 3600 },
        });

        if (imgRes.ok) {
          const imgRaw: unknown = await imgRes.json();
          const parsedImg = v.safeParse(YouVersionImageSchema, imgRaw);
          if (parsedImg.success) {
            imageUrl = parsedImg.output.image_url;
            attribution = parsedImg.output.attribution;
          }
        }
      } catch {
        // Image resolution is non-blocking
      }
    }

    const finalVerseText = esvText ?? parsedPassage.output.content.trim();
    const finalVersion = esvText
      ? "English Standard Version"
      : "Berean Standard Bible";

    const result: VerseOfTheDayData = {
      day: currentDay,
      reference: parsedPassage.output.reference,
      text: finalVerseText,
      version: finalVersion,
      imageUrl,
      attribution,
    };

    inMemoryCache = {
      data: result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error: unknown) {
    console.error("Failed to fetch YouVersion Verse of the Day:", error);
    return (
      inMemoryCache?.data ?? {
        ...FALLBACK_VOTD,
        day: currentDay,
      }
    );
  }
}
