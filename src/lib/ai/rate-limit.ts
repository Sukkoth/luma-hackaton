import "server-only";

import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiRateLimits } from "@/db/schema";

export type AiRateLimitKind = "plan" | "chat";

export type CheckAiRateLimitParams = {
  userId: string;
  kind: AiRateLimitKind;
};

export type CheckAiRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; message: string };

const LIMITS: Record<
  AiRateLimitKind,
  { perMinute: number; perDay: number; label: string }
> = {
  plan: { perMinute: 8, perDay: 15, label: "plan generations" },
  chat: { perMinute: 12, perDay: 50, label: "conversational turns" },
};

async function incrementBucket({
  userId,
  bucketKey,
  expiresAt,
}: {
  userId: string;
  bucketKey: string;
  expiresAt: Date;
}): Promise<number> {
  const [row] = await db
    .insert(aiRateLimits)
    .values({
      userId,
      bucketKey,
      count: 1,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [aiRateLimits.userId, aiRateLimits.bucketKey],
      set: {
        count: sql`${aiRateLimits.count} + 1`,
      },
    })
    .returning({ count: aiRateLimits.count });

  return row?.count ?? 1;
}

export async function checkAiRateLimit({
  userId,
  kind,
}: CheckAiRateLimitParams): Promise<CheckAiRateLimitResult> {
  if (process.env.DISABLE_RATE_LIMIT === "true") {
    return { allowed: true };
  }

  const now = new Date();
  const cfg = LIMITS[kind];

  const minuteSlot = Math.floor(now.getTime() / 60_000);
  const minuteBucket = `${kind}:m:${minuteSlot}`;
  const minuteExpiresAt = new Date((minuteSlot + 2) * 60_000);

  const daySlot = now.toISOString().slice(0, 10);
  const dayBucket = `${kind}:d:${daySlot}`;
  const dayExpiresAt = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const [minuteCount, dayCount] = await Promise.all([
    incrementBucket({
      userId,
      bucketKey: minuteBucket,
      expiresAt: minuteExpiresAt,
    }),
    incrementBucket({
      userId,
      bucketKey: dayBucket,
      expiresAt: dayExpiresAt,
    }),
  ]);

  // Opportunistic cleanup of expired buckets (~5% of requests)
  if (Math.random() < 0.05) {
    void db.delete(aiRateLimits).where(lt(aiRateLimits.expiresAt, now));
  }

  if (minuteCount > cfg.perMinute) {
    const secondsIntoMinute = Math.floor((now.getTime() % 60_000) / 1000);
    const retryAfterSeconds = Math.max(5, 60 - secondsIntoMinute);
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Too many requests. Please wait ${retryAfterSeconds}s before sending another prompt.`,
    };
  }

  if (dayCount > cfg.perDay) {
    const endOfDayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0
    );
    const retryAfterSeconds = Math.max(
      60,
      Math.ceil((endOfDayUtc - now.getTime()) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      message: `Daily limit of ${cfg.perDay} ${cfg.label} reached. Please try again tomorrow.`,
    };
  }

  return { allowed: true };
}
