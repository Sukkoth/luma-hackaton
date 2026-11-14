"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { BibleReaderPage } from "@/components/bible/bible-reader-page";
import { AppShell } from "@/components/navigation/app-shell";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import type { UserTrackerSummary } from "@/actions/trackers";

interface PlanReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  displayText?: string | null;
  isCompleted: boolean;
  order: number;
}

interface FlattenedReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
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

  const [planContext, setPlanContext] = useState<BibleReaderPlanContext | null>(null);
  const [trackersData, setTrackersData] = useState<{ trackers: readonly UserTrackerSummary[]; activeTracker?: UserTrackerSummary | null }>({ trackers: [] });
  const [streak, setStreak] = useState<StreakData | undefined>(undefined);
  const [mounted, setMounted] = useState(() => typeof window !== "undefined");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;
    if (sessionPending) return;
    if (!session) {
      router.replace(`/login?redirect=${window.location.pathname}${window.location.search}`);
      return;
    }
    // Use a callback to avoid synchronous setState
    const timer = setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [mounted, session, sessionPending, router]);

  useEffect(() => {
    if (!mounted || sessionPending || !session) return;

    const planId = searchParams.get("plan");
    const readingId = searchParams.get("readingId");

    async function fetchPlanContext() {
      if (!planId || !readingId) {
        setPlanContext(null);
        return;
      }

      try {
        const response = await fetch(`/api/bible/plan-context?planId=${planId}&readingId=${readingId}`);
        if (!response.ok) {
          setPlanContext(null);
          return;
        }
        const data: PlanContextResponse = await response.json();
        setPlanContext(data as BibleReaderPlanContext);
      } catch {
        setPlanContext(null);
      }
    }

    fetchPlanContext();
  }, [mounted, session, sessionPending, searchParams]);

  useEffect(() => {
    if (!mounted || sessionPending || !session || !planContext) return;

    async function fetchUserData() {
      try {
        const response = await fetch("/api/bible/user-data");
        if (!response.ok) return;
        const data: UserDataResponse = await response.json();
        setTrackersData({ trackers: data.trackers, activeTracker: data.activeTracker });
        setStreak(data.streak);
      } catch {
        // Ignore errors
      }
    }

    fetchUserData();
  }, [mounted, session, sessionPending, planContext]);

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

  const versionId = versionParam ? Number.parseInt(versionParam, 10) : undefined;
  const startVerse = startVerseParam ? Number.parseInt(startVerseParam, 10) : undefined;
  const endVerse = endVerseParam ? Number.parseInt(endVerseParam, 10) : undefined;

  return (
    <AppShell
      userName={planContext?.plan ? session.user.name || "Reader" : session.user.name || "Reader"}
      userEmail={session.user.email}
      userImage={session.user.image ?? undefined}
      streak={planContext?.plan ? streak : undefined}
      trackers={planContext?.plan ? trackersData.trackers : undefined}
      activeTrackerId={planContext?.plan ? trackersData.activeTracker?.id : undefined}
    >
      <div className="w-full h-full">
        <BibleReaderPage
          bookId={bookId}
          chapter={chapter}
          startVerse={startVerse}
          endVerse={endVerse}
          versionId={versionId}
          planContext={planContext}
        />
      </div>
    </AppShell>
  );
}

interface PlanReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  displayText?: string | null;
  isCompleted: boolean;
  order: number;
}

interface FlattenedReadingItem {
  id: string;
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
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
    sessionIndex: number;
    sessionTitle: string;
  };
  flattenedReadings: readonly FlattenedReadingItem[];
}