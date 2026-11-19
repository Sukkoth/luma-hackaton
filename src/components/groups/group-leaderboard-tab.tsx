"use client";

import { useState } from "react";
import Image from "next/image";
import { useQueryState, parseAsString } from "nuqs";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Users,
  Trophy,
  Medal,
} from "lucide-react";
import type { GroupPlanSummary, LeaderboardEntry } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupVisibilityModal } from "@/components/groups/group-visibility-modal";
import { cn } from "@/lib/utils";

export type GroupLeaderboardTabProps = {
  groupId: string;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  currentUserHideProgress: boolean;
  currentUserPrivacyUpdatedAt?: string | null;
  isMember?: boolean;
  onOpenScheduleModal?: () => void;
  onCopyInvite?: () => void;
  onSelectPlanForEnroll?: (plan: GroupPlanSummary) => void;
};

export function GroupLeaderboardTab({
  groupId,
  activePlans,
  leaderboardsByPlanId,
  currentUserHideProgress,
  currentUserPrivacyUpdatedAt,
  isMember = false,
  onOpenScheduleModal,
  onCopyInvite,
  onSelectPlanForEnroll,
}: GroupLeaderboardTabProps) {
  const [selectedPlanId, setSelectedPlanId] = useQueryState(
    "plan",
    parseAsString.withDefault(activePlans[0]?.id || "")
  );
  const [hideProgress, setHideProgress] = useState(currentUserHideProgress);
  const [privacyUpdatedAt, setPrivacyUpdatedAt] = useState(
    currentUserPrivacyUpdatedAt
  );
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [mountTimestamp] = useState(() => Date.now());

  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const isCooldownActive =
    privacyUpdatedAt !== undefined && privacyUpdatedAt !== null
      ? mountTimestamp - new Date(privacyUpdatedAt).getTime() < COOLDOWN_MS
      : false;

  // If selectedPlanId is empty or not in activePlans, fallback to first
  const currentPlan =
    activePlans.find((p) => p.id === selectedPlanId) || activePlans[0];
  const leaderboard = currentPlan
    ? leaderboardsByPlanId[currentPlan.id] || []
    : [];

  const currentUserIndex = leaderboard.findIndex((m) => m.isCurrentUser);
  const currentUser =
    currentUserIndex >= 0 ? leaderboard[currentUserIndex] : undefined;
  const currentUserRank =
    currentUserIndex >= 0 ? currentUserIndex + 1 : undefined;

  const totalReaders = leaderboard.length;
  const readersReadToday = leaderboard.filter((m) => m.readToday).length;
  const avgCompletion =
    totalReaders > 0
      ? Math.round(
          leaderboard.reduce((acc, m) => acc + m.progressPercent, 0) /
            totalReaders
        )
      : 0;

  if (activePlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3 shadow-2xs">
          <Trophy className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No Active Leaderboard
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
          Leaderboards are generated when a reading plan is active for this fellowship.
        </p>
        {onOpenScheduleModal && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onOpenScheduleModal}
          >
            Schedule a Plan
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Fellowship Leaderboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time reading progress, milestone tracking, and daily accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Plan Selector if multiple plans exist */}
          {activePlans.length > 1 && currentPlan && (
            <Select
              value={currentPlan.id}
              onValueChange={setSelectedPlanId}
            >
              <SelectTrigger className="h-9 w-[180px] text-xs">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.templateTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Privacy Toggle (Only shown to enrolled cohort members) */}
          {isMember && currentUser && (
            <button
              type="button"
              onClick={() => setIsVisibilityModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer px-3 py-1.5 rounded-xl border border-border bg-card shadow-xs"
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
              {isCooldownActive && (
                <Clock className="size-3 text-muted-foreground ml-0.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Community Momentum Vitals ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="col-span-2 md:col-span-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground block mb-1">
            Active Curriculum
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground line-clamp-1 block leading-snug">
            {currentPlan?.templateTitle}
          </span>
        </div>

        <div className="col-span-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground block mb-1">
            Enrolled Readers
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground block tabular-nums">
            {totalReaders} {totalReaders === 1 ? "reader" : "readers"}
          </span>
        </div>

        <div className="col-span-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground block mb-1">
            Read Today
          </span>
          <span className="text-sm sm:text-base font-bold text-primary block tabular-nums">
            {readersReadToday} of {totalReaders}
          </span>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs font-medium text-muted-foreground block mb-1">
            Average Progress
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground block tabular-nums">
            {avgCompletion}%
          </span>
        </div>
      </div>

      {/* ── Personal Standing Banner (If Current User is Enrolled) ── */}
      {currentUser && (
        <div
          className={cn(
            "rounded-xl border p-4 text-xs transition-all",
            hideProgress
              ? "border-dashed border-border bg-muted/20"
              : "border-primary/20 bg-primary/5 shadow-xs"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "size-2.5 rounded-full shrink-0",
                  hideProgress ? "bg-muted-foreground" : "bg-primary"
                )}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm">
                    {hideProgress
                      ? "Your Progress is Hidden from Cohort"
                      : `Your Standing: #${currentUserRank} of ${totalReaders} readers`}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg border border-border bg-card text-muted-foreground">
                    {hideProgress ? "Private to you" : "Public to cohort"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hideProgress
                    ? "Your progress is hidden from the cohort. While your visibility is hidden, other readers' names and avatars are shown anonymously to you."
                    : `${currentUser.completedChapters} of ${currentPlan?.totalChapters} chapters completed (${currentUser.progressPercent}%).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {currentUser.readToday ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  <span>You read today</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border">
                  <Clock className="size-3.5" />
                  <span>Today pending</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard Table / Roster ── */}
      {totalReaders === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            <Users className="size-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              The Circle is Waiting for Readers
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              No members are currently enrolled in {currentPlan?.templateTitle}. Enroll now or invite fellow readers to begin.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {onSelectPlanForEnroll && currentPlan && !currentPlan.userEnrolledInstanceId && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => onSelectPlanForEnroll(currentPlan)}
              >
                Enroll in this Plan
              </Button>
            )}

            {onCopyInvite && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCopyInvite}
              >
                Invite Members
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs divide-y divide-border/60">
          {/* Table Header Row (Desktop) */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-muted/40 text-xs font-medium text-muted-foreground">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Reader</div>
            <div className="col-span-3">Chapters Read</div>
            <div className="col-span-2 text-right">Progress</div>
            <div className="col-span-1 text-right">Today</div>
          </div>

          {/* Table Rows */}
          {leaderboard.map((member, index) => {
            const isUserHidden = member.isCurrentUser && hideProgress;
            const isOtherHidden =
              !member.isCurrentUser && (member.isAnonymous || hideProgress);
            const initials = member.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const displayName = isOtherHidden
              ? `Anonymous Reader #${index + 1}`
              : member.name;

            const rank = index + 1;

            return (
              <div
                key={member.userId}
                className={cn(
                  "flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:px-6 sm:py-3.5 items-start sm:items-center text-xs sm:text-sm transition-colors",
                  member.isCurrentUser
                    ? "bg-primary/5 font-medium"
                    : "hover:bg-muted/30"
                )}
              >
                {/* Column 1: Rank Badge */}
                <div className="hidden sm:flex col-span-1 justify-center items-center">
                  {isUserHidden ? (
                    <span className="text-muted-foreground">—</span>
                  ) : rank === 1 ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs" title="1st Place">
                      <Medal className="size-3.5 text-amber-600 dark:text-amber-400" />
                    </span>
                  ) : rank === 2 ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-slate-400/10 border border-slate-400/25 text-slate-600 dark:text-slate-300 font-bold text-xs" title="2nd Place">
                      <Medal className="size-3.5 text-slate-500 dark:text-slate-400" />
                    </span>
                  ) : rank === 3 ? (
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-800/10 border border-amber-800/25 text-amber-800 dark:text-amber-500 font-bold text-xs" title="3rd Place">
                      <Medal className="size-3.5 text-amber-700 dark:text-amber-500" />
                    </span>
                  ) : (
                    <span className="font-semibold text-muted-foreground tabular-nums text-xs">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Column 2: Reader Identity */}
                <div className="col-span-5 flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-semibold text-foreground overflow-hidden shadow-2xs">
                    {isUserHidden || isOtherHidden ? (
                      <EyeOff className="size-4 text-muted-foreground" />
                    ) : member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={38}
                        height={38}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <div className="truncate min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground truncate">
                        {displayName}
                      </span>
                      {member.isCurrentUser && (
                        <span className="rounded-md bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                          You
                        </span>
                      )}
                      {isUserHidden && (
                        <span className="text-[10px] text-muted-foreground">
                          (Private)
                        </span>
                      )}
                      {isOtherHidden && !member.isAnonymous && (
                        <span className="text-[10px] text-muted-foreground">
                          (Anonymous to you)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block truncate">
                      {isUserHidden
                        ? "Hidden from cohort"
                        : `${member.completedChapters} of ${member.totalChapters} chapters`}
                    </span>
                  </div>

                  {/* Mobile-only rank badge */}
                  <div className="sm:hidden text-xs font-bold text-muted-foreground shrink-0">
                    {isUserHidden ? "—" : `#${rank}`}
                  </div>
                </div>

                {/* Mobile-Only Progress & Status Row */}
                <div className="sm:hidden w-full space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums font-medium text-foreground">
                      {isUserHidden || isOtherHidden
                        ? "—"
                        : `${member.completedChapters} / ${member.totalChapters} ch`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground tabular-nums">
                        {isUserHidden || isOtherHidden
                          ? "—"
                          : `${member.progressPercent}%`}
                      </span>
                      {member.readToday ? (
                        <span
                          className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          title="Read today"
                        >
                          <CheckCircle2 className="size-3" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center size-5 rounded-full bg-muted text-muted-foreground border border-border"
                          title="Reading pending today"
                        >
                          <Clock className="size-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      style={{
                        width:
                          isUserHidden || isOtherHidden
                            ? "0%"
                            : `${Math.min(
                                100,
                                Math.max(member.progressPercent, 2)
                              )}%`,
                      }}
                      className="h-full rounded-full bg-primary transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Desktop Column 3: Milestone Progress Bar */}
                <div className="hidden sm:block col-span-3 w-full sm:w-auto space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Milestone</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {isUserHidden || isOtherHidden
                        ? "—"
                        : `${member.completedChapters}/${member.totalChapters}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      style={{
                        width: isUserHidden || isOtherHidden
                          ? "0%"
                          : `${Math.min(
                              100,
                              Math.max(member.progressPercent, 2)
                            )}%`,
                      }}
                      className="h-full rounded-full bg-primary transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Desktop Column 4: Percent Completion */}
                <div className="hidden sm:block col-span-2 text-right">
                  <span className="font-bold text-foreground tabular-nums text-xs sm:text-sm">
                    {isUserHidden || isOtherHidden
                      ? "—"
                      : `${member.progressPercent}%`}
                  </span>
                </div>

                {/* Desktop Column 5: Today's Status */}
                <div className="hidden sm:flex col-span-1 justify-end items-center">
                  {member.readToday ? (
                    <span
                      className="inline-flex items-center justify-center size-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      title="Read today"
                    >
                      <CheckCircle2 className="size-4" />
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center size-7 rounded-xl bg-muted/50 text-muted-foreground border border-border/80"
                      title="Reading pending today"
                    >
                      <Clock className="size-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Privacy Cooldown Protection Modal */}
      <GroupVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        groupId={groupId}
        currentHideProgress={hideProgress}
        privacyUpdatedAt={privacyUpdatedAt}
        onSuccess={({ hideProgress: newHide, privacyUpdatedAt: newUpdatedAt }) => {
          setHideProgress(newHide);
          setPrivacyUpdatedAt(newUpdatedAt);
        }}
      />
    </div>
  );
}
