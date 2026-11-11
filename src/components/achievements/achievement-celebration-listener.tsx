"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import type { SerializableAchievement } from "@/data/achievements";
import {
  getPendingCelebrationsAction,
  markAchievementCelebratedAction,
} from "@/actions/achievements";
import { AchievementToastBanner } from "./achievement-toast-banner";

export function AchievementCelebrationListener() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<ReadonlyArray<SerializableAchievement>>(
    []
  );
  const activeIdsRef = useRef<Set<string>>(new Set());

  // 1. Check for pending uncelebrated achievements on mount and route changes
  useEffect(() => {
    let isCancelled = false;

    async function checkPendingCelebrations() {
      try {
        const res = await getPendingCelebrationsAction();
        if (!isCancelled && res.pending.length > 0) {
          setQueue((prev) => {
            const newItems = res.pending.filter(
              (item) =>
                !activeIdsRef.current.has(item.id) &&
                !prev.some((p) => p.id === item.id)
            );
            for (const item of newItems) {
              activeIdsRef.current.add(item.id);
            }
            return [...prev, ...newItems];
          });
        }
      } catch (err) {
        console.warn("Failed to check pending achievement celebrations:", err);
      }
    }

    void checkPendingCelebrations();

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  // 2. Listen for live achievement-unlocked custom event
  useEffect(() => {
    function handleLiveUnlocked(event: Event) {
      const customEvent = event as CustomEvent<
        ReadonlyArray<SerializableAchievement> | SerializableAchievement
      >;
      const detail = customEvent.detail;
      if (!detail) return;

      const items = Array.isArray(detail) ? detail : [detail];
      if (items.length === 0) return;

      setQueue((prev) => {
        const newItems = items.filter(
          (item) =>
            !activeIdsRef.current.has(item.id) &&
            !prev.some((p) => p.id === item.id)
        );
        for (const item of newItems) {
          activeIdsRef.current.add(item.id);
        }
        return [...prev, ...newItems];
      });
    }

    window.addEventListener("achievement-unlocked", handleLiveUnlocked);
    return () => {
      window.removeEventListener("achievement-unlocked", handleLiveUnlocked);
    };
  }, []);

  // 3. Dismissal handler: marks as celebrated in database and removes from queue
  const handleDismiss = useCallback(
    ({ achievementId }: { achievementId: string }) => {
      setQueue((prev) => prev.filter((a) => a.id !== achievementId));
      void markAchievementCelebratedAction({ achievementId });
    },
    []
  );

  return (
    <AchievementToastBanner queue={queue} onDismissAction={handleDismiss} />
  );
}
