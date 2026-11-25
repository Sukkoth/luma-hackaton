"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Medal,
  Trophy,
  Users,
} from "lucide-react";
import type { LeaderboardEntry } from "@/actions/groups";
import { cn } from "@/lib/utils";

const GroupVisibilityModal = dynamic(
  () =>
    import("@/components/groups/group-visibility-modal").then(
      (mod) => mod.GroupVisibilityModal
    ),
  { ssr: false }
);

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type PlanLeaderboardPanelProps = {
  groupId: string;
  planTitle: string;
  entries: ReadonlyArray<LeaderboardEntry>;
  currentUserHideProgress: boolean;
  currentUserPrivacyUpdatedAt?: string | null;
  isMember: boolean;
  defaultExpanded?: boolean;
};

export function PlanLeaderboardPanel({
  groupId,
  planTitle,
  entries,
  currentUserHideProgress,
  currentUserPrivacyUpdatedAt,
  isMember,
  defaultExpanded = false,
}: PlanLeaderboardPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hideProgress, setHideProgress] = useState(currentUserHideProgress);
  const [privacyUpdatedAt, setPrivacyUpdatedAt] = useState(
    currentUserPrivacyUpdatedAt
  );
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [mountTimestamp] = useState(() => Date.now());

  const isCooldownActive =
    privacyUpdatedAt !== undefined && privacyUpdatedAt !== null
      ? mountTimestamp - new Date(privacyUpdatedAt).getTime() < COOLDOWN_MS
      : false;

  const currentUserIndex = entries.findIndex((m) => m.isCurrentUser);
  const currentUser =
    currentUserIndex >= 0 ? entries[currentUserIndex] : undefined;
  const currentUserRank =
    currentUserIndex >= 0 ? currentUserIndex + 1 : undefined;

  const totalReaders = entries.length;
  const readersReadToday = entries.filter((m) => m.readToday).length;
  const avgCompletion =
    totalReaders > 0
      ? Math.round(
          entries.reduce((acc, m) => acc + m.progressPercent, 0) / totalReaders
        )
      : 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.025] p-4 sm:p-5 space-y-4">
      {/* Header & Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary border border-primary/25">
            <Trophy className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-foreground">
                Plan Leaderboard
              </h4>
              <span className="rounded-md bg-card border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground tabular-nums">
                {totalReaders} {totalReaders === 1 ? "reader" : "readers"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {totalReaders === 0
                ? `No readers enrolled in ${planTitle} yet`
                : `${readersReadToday} read today • ${avgCompletion}% cohort avg${
                    currentUserRank ? ` • You're #${currentUserRank}` : ""
                  }`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isMember && currentUser ? (
            <button
              type="button"
              onClick={() => setIsVisibilityModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer px-3 py-1.5 rounded-xl border border-border bg-card shadow-2xs"
              title={
                isCooldownActive
                  ? "Visibility updated recently (24-hour rate limit active)"
                  : hideProgress
                    ? "Make your reading progress visible to the cohort"
                    : "Hide your reading progress from fellow cohort members"
              }
            >
              {hideProgress ? (
                <>
                  <Eye className="size-3.5 text-primary" />
                  <span>Make Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="size-3.5 text-muted-foreground" />
                  <span>Hide My Progress</span>
                </>
              )}
              {isCooldownActive ? (
                <Clock className="size-3 text-muted-foreground ml-0.5" />
              ) : null}
            </button>
          ) : null}

          {totalReaders > 0 ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer px-3 py-1.5 rounded-xl border border-primary/25 bg-card shadow-2xs"
            >
              <span>{isExpanded ? "Collapse" : "View Standings"}</span>
              {isExpanded ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Anonymity / Non-member Notice */}
      {isExpanded && !isMember && totalReaders > 0 ? (
        <div className="rounded-xl border border-border bg-card/80 p-3 flex items-center gap-2.5 text-xs text-muted-foreground">
          <Users className="size-4 text-primary shrink-0" />
          <span>
            Reader names are anonymized for guests. Join this fellowship to see
            member standings.
          </span>
        </div>
      ) : null}

      {isExpanded && isMember && hideProgress ? (
        <div className="rounded-xl border border-primary/20 bg-card/90 p-3 flex items-center gap-2.5 text-xs text-foreground">
          <EyeOff className="size-4 text-primary shrink-0" />
          <span>
            <strong className="font-semibold">Reciprocal Anonymity:</strong>{" "}
            Your progress is hidden, so fellow readers appear anonymized to you.
          </span>
        </div>
      ) : null}

      {/* Standings List */}
      {isExpanded && totalReaders > 0 ? (
        <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-2xs">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const initials = entry.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={`${entry.userId}-${rank}`}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3 sm:px-4 transition-colors",
                  entry.isCurrentUser
                    ? "bg-primary/[0.04]"
                    : "hover:bg-muted/25"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 shrink-0 flex items-center justify-center">
                    {rank === 1 ? (
                      <Medal className="size-4 text-amber-500" />
                    ) : rank === 2 ? (
                      <Medal className="size-4 text-slate-400" />
                    ) : rank === 3 ? (
                      <Medal className="size-4 text-amber-700" />
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        {rank}
                      </span>
                    )}
                  </div>

                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-[11px] font-bold text-foreground overflow-hidden">
                    {entry.avatarUrl && !entry.isAnonymous ? (
                      <Image
                        src={entry.avatarUrl}
                        alt={entry.name}
                        width={32}
                        height={32}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{entry.isAnonymous ? "?" : initials}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                        {entry.name}
                      </span>
                      {entry.isCurrentUser ? (
                        <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          You
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {entry.completedChapters} / {entry.totalChapters} chapters
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-9 sm:pl-0 sm:w-56 shrink-0">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${entry.progressPercent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-foreground tabular-nums">
                    {entry.progressPercent}%
                  </span>
                  {entry.readToday ? (
                    <span
                      title="Read today"
                      className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </span>
                  ) : (
                    <span className="w-3.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {isVisibilityModalOpen ? (
        <GroupVisibilityModal
          isOpen={isVisibilityModalOpen}
          onClose={() => setIsVisibilityModalOpen(false)}
          groupId={groupId}
          currentHideProgress={hideProgress}
          onSuccess={({
            hideProgress: newHideProgress,
            privacyUpdatedAt: newUpdatedAt,
          }) => {
            setHideProgress(newHideProgress);
            setPrivacyUpdatedAt(newUpdatedAt);
          }}
        />
      ) : null}
    </div>
  );
}
