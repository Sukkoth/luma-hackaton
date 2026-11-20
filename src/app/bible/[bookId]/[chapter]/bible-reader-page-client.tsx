"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { BibleReaderPage } from "@/components/bible/bible-reader-page";
import { AppShell } from "@/components/navigation/app-shell";
import { togglePlanReadingItemAction } from "@/actions/plans";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { UserTrackerSummary } from "@/actions/trackers";

interface FlattenedReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  isCompleted: boolean;
  sessionIndex: number;
  sessionTitle: string;
}

interface BibleReaderPlanContext {
  plan: { id: string; title: string };
  reading: {
    id: string;
    bookId: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    isCompleted: boolean;
    sessionIndex: number;
    sessionTitle: string;
  };
  flattenedReadings: readonly FlattenedReadingItem[];
}

interface PlanContextResponse {
  plan: { id: string; title: string };
  reading: {
    id: string;
    bookId: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    isCompleted: boolean;
    sessionIndex: number;
    sessionTitle: string;
  };
  flattenedReadings: readonly FlattenedReadingItem[];
}

interface UserDataResponse {
  trackers: readonly UserTrackerSummary[];
  activeTracker: UserTrackerSummary | null;
  streak: StreakData | undefined;
}

export function BibleReaderPageClient() {
  const params = useParams<{ bookId: string; chapter: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [planContext, setPlanContext] = useState<BibleReaderPlanContext | null>(
    null
  );
  const [trackersData, setTrackersData] = useState<{
    trackers: readonly UserTrackerSummary[];
    activeTracker?: UserTrackerSummary | null;
  }>({ trackers: [] });
  const [streak, setStreak] = useState<StreakData | undefined>(undefined);
  const [mounted] = useState(() => typeof window !== "undefined");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;
    if (sessionPending) return;
    if (!session) {
      router.replace(
        `/login?redirect=${window.location.pathname}${window.location.search}`
      );
      return;
    }
    // Use a callback to avoid synchronous setState
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [mounted, session, sessionPending, router]);

  const planId = searchParams.get("plan");
  const readingId = searchParams.get("readingId");

  useEffect(() => {
    if (!mounted || sessionPending || !session) return;
    if (!planId || !readingId) {
      const timer = setTimeout(() => {
        setPlanContext(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isCancelled = false;

    async function fetchPlanContext() {
      try {
        const response = await fetch(
          `/api/bible/plan-context?planId=${planId}&readingId=${readingId}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          if (response.status === 403) {
            router.replace(`/plans/${planId}`);
            return;
          }
          if (!isCancelled) setPlanContext(null);
          return;
        }
        const data: PlanContextResponse = await response.json();
        if (!isCancelled) {
          setPlanContext(data as BibleReaderPlanContext);
        }
      } catch {
        if (!isCancelled) setPlanContext(null);
      }
    }

    fetchPlanContext();

    return () => {
      isCancelled = true;
    };
  }, [mounted, session, sessionPending, planId, readingId, router]);

  useEffect(() => {
    if (!mounted || sessionPending || !session || !planId) return;

    async function fetchUserData() {
      try {
        const response = await fetch("/api/bible/user-data", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data: UserDataResponse = await response.json();
        setTrackersData({
          trackers: data.trackers,
          activeTracker: data.activeTracker,
        });
        setStreak(data.streak);
      } catch {
        // Ignore errors
      }
    }

    fetchUserData();
  }, [mounted, session, sessionPending, planId]);

  // Handle Mark as Read toggle directly in this component (since we're on a separate page)
  const handleToggleReading = async (readingId: string) => {
    if (!planContext || !session) return;

    const targetReading = planContext.flattenedReadings.find(
      (r) => r.id === readingId
    );
    const currentStatus = targetReading
      ? Boolean(targetReading.isCompleted)
      : Boolean(planContext.reading.isCompleted);
    const nextStatus = !currentStatus;

    // Optimistic update
    setPlanContext((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        reading:
          prev.reading.id === readingId
            ? { ...prev.reading, isCompleted: nextStatus }
            : prev.reading,
        flattenedReadings: prev.flattenedReadings.map((r) =>
          r.id === readingId ? { ...r, isCompleted: nextStatus } : r
        ),
      };
    });

    try {
      const res = await togglePlanReadingItemAction({
        instanceId: planContext.plan.id,
        readingItemId: readingId,
      });

      if (!res.success) {
        // Rollback on failure
        setPlanContext((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            reading:
              prev.reading.id === readingId
                ? { ...prev.reading, isCompleted: currentStatus }
                : prev.reading,
            flattenedReadings: prev.flattenedReadings.map((r) =>
              r.id === readingId ? { ...r, isCompleted: currentStatus } : r
            ),
          };
        });
      }
    } catch {
      // Rollback on error
      setPlanContext((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          reading:
            prev.reading.id === readingId
              ? { ...prev.reading, isCompleted: currentStatus }
              : prev.reading,
          flattenedReadings: prev.flattenedReadings.map((r) =>
            r.id === readingId ? { ...r, isCompleted: currentStatus } : r
          ),
        };
      });
    }
  };

  if (!mounted || sessionPending || loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-black/10 border-t-black dark:border-white/10 dark:border-t-white" />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return null;
  }

  const bookId = params.bookId;
  const chapter = Number.parseInt(params.chapter, 10);
  const versionParam = searchParams.get("v");
  const startVerseParam = searchParams.get("startVerse");
  const endVerseParam = searchParams.get("endVerse");

  if (!Number.isFinite(chapter) || chapter < 1) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <p className="text-foreground-dim">Chapter not found</p>
        </div>
      </AppShell>
    );
  }

  const versionId = versionParam
    ? Number.parseInt(versionParam, 10)
    : undefined;
  const startVerse = startVerseParam
    ? Number.parseInt(startVerseParam, 10)
    : undefined;
  const endVerse = endVerseParam
    ? Number.parseInt(endVerseParam, 10)
    : undefined;

  return (
    <AppShell
      userName={
        planContext?.plan
          ? session.user.name || "Reader"
          : session.user.name || "Reader"
      }
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={planContext?.plan ? streak : undefined}
      trackers={planContext?.plan ? trackersData.trackers : undefined}
      activeTrackerId={
        planContext?.plan ? trackersData.activeTracker?.id : undefined
      }
    >
      <div className="w-full h-full">
        <BibleReaderPage
          bookId={bookId}
          chapter={chapter}
          startVerse={startVerse}
          endVerse={endVerse}
          versionId={versionId}
          planContext={planContext}
          onToggleReading={handleToggleReading}
        />
      </div>
    </AppShell>
  );
}

interface FlattenedReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  isCompleted: boolean;
  sessionIndex: number;
  sessionTitle: string;
}

interface BibleReaderPlanContext {
  plan: { id: string; title: string };
  reading: {
    id: string;
    bookId: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    isCompleted: boolean;
    sessionIndex: number;
    sessionTitle: string;
  };
  flattenedReadings: readonly FlattenedReadingItem[];
}

interface PlanContextResponse {
  plan: { id: string; title: string };
  reading: {
    id: string;
    bookId: string;
    chapter: number;
    startVerse?: number;
    endVerse?: number;
    isCompleted: boolean;
    sessionIndex: number;
    sessionTitle: string;
  };
  flattenedReadings: readonly FlattenedReadingItem[];
}
