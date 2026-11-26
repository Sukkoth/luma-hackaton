import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSettings } from "@/db/schema";

export type GetCachedUserSettingsParams = {
  userId: string;
};

/**
 * Per-request deduplicated lookup for userSettings using React.cache().
 */
export const getCachedUserSettings = cache(
  async ({ userId }: GetCachedUserSettingsParams) => {
    return db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });
  }
);
