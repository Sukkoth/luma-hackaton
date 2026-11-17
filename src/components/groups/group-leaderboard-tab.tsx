"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Users,
  Trophy,
} from "lucide-react";
import type { GroupPlanSummary, LeaderboardEntry } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { GroupVisibilityModal } from "@/components/groups/group-visibility-modal";

export type GroupLeaderboardTabProps = {
  groupId: string;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  currentUserHideProgress: boolean;
  currentUserPrivacyUpdatedAt?: string | null;
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
  onOpenScheduleModal,
  onCopyInvite,
  onSelectPlanForEnroll,
}: GroupLeaderboardTabProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return activePlans[0]?.id || "";
  });
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-surface-elevated text-foreground border border-border mb-3 shadow-2xs">
          <Trophy className="size-5" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No Active Leaderboard
        </h3>
        <p className="text-xs sm:text-sm text-foreground-secondary max-w-sm mb-5 leading-relaxed">
          Leaderboards are generated when a reading plan is active for this fellowship.
        </p>
        {onOpenScheduleModal && (
          <Button
            type="button"
            variant="primary"
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
          <h2 className="text-lg font-bold text-foreground">
            Fellowship Leaderboard
          </h2>
          <p className="text-xs text-foreground-dim mt-0.5">
            Real-time reading progress, milestone tracking, and daily accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Plan Selector if multiple plans exist */}
          {activePlans.length > 1 && (
            <select
              value={currentPlan?.id}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-medium text-foreground focus:outline-hidden"
            >
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.templateTitle}
                </option>
              ))}
            </select>
          )}

          {/* Privacy Toggle (Opens 24h Cooldown Protected Modal) */}
          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-surface-elevated transition-colors cursor-pointer px-3 py-2 rounded-xl border border-border bg-surface shadow-2xs"
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
                <Eye className="size-3.5 text-foreground" />
                <span>Make Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="size-3.5 text-foreground-dim" />
                <span>Hide My Progress</span>
              </>
            )}
            {isCooldownActive && (
              <Clock className="size-3 text-foreground-dim ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Community Momentum Vitals (Using Width Efficiently) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="col-span-2 md:col-span-1 rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-foreground-dim block mb-1">
            Active Curriculum
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground line-clamp-2 block leading-snug">
            {currentPlan?.templateTitle}
          </span>
        </div>

        <div className="col-span-1 rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-foreground-dim block mb-1">
            Enrolled Readers
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground block tabular-nums">
            {totalReaders} {totalReaders === 1 ? "reader" : "readers"}
          </span>
        </div>

        <div className="col-span-1 rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-foreground-dim block mb-1">
            Read Today
          </span>
          <span className="text-sm sm:text-base font-bold text-foreground block tabular-nums">
            {readersReadToday} of {totalReaders}
          </span>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-2xs">
          <span className="text-[11px] font-medium text-foreground-dim block mb-1">
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
          className={`rounded-2xl border p-4 text-xs transition-all ${
            hideProgress
              ? "border-dashed border-border bg-surface-elevated/40"
              : "border-border bg-surface shadow-2xs"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`size-2.5 rounded-full shrink-0 ${
                  hideProgress ? "bg-foreground-dim" : "bg-foreground"
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm">
                    {hideProgress
                      ? "Your Progress is Hidden from Cohort"
                      : `Your Standing: #${currentUserRank} of ${totalReaders} readers`}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-border bg-surface-elevated text-foreground-secondary uppercase">
                    {hideProgress ? "Private to you" : "Public to cohort"}
                  </span>
                </div>
                <p className="text-xs text-foreground-dim mt-0.5">
                  {hideProgress
                    ? "Your progress is hidden from the cohort. While your visibility is hidden, other readers' names and avatars are shown anonymously to you."
                    : `${currentUser.completedChapters} of ${currentPlan?.totalChapters} chapters completed (${currentUser.progressPercent}%).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {currentUser.readToday ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-foreground border border-border">
                  <CheckCircle2 className="size-3.5 text-foreground" />
                  <span>You read today</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated/50 px-3 py-1.5 text-xs font-medium text-foreground-dim border border-border">
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
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-foreground shadow-2xs">
            <Users className="size-6 text-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              The Circle is Waiting for Readers
            </h3>
            <p className="text-xs sm:text-sm text-foreground-dim max-w-sm leading-relaxed">
              No members are currently enrolled in {currentPlan?.templateTitle}. Enroll now or invite fellow readers to begin.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            {onSelectPlanForEnroll && currentPlan && !currentPlan.userEnrolledInstanceId && (
              <Button
                type="button"
                variant="primary"
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
        <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-2xs divide-y divide-border">
          {/* Table Header Row */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-surface-elevated/40 text-[11px] font-semibold text-foreground-dim uppercase tracking-wider">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Reader</div>
            <div className="col-span-3">Chapters Read</div>
            <div className="col-span-2 text-right">Progress</div>
            <div className="col-span-1 text-right">Today</div>
          </div>

          {/* Table Rows */}
          {leaderboard.map((member, index) => {
            const isUserHidden = member.isCurrentUser && hideProgress;
            // If the user has hidden their own visibility, they see everyone else anonymously
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

            return (
              <div
                key={member.userId}
                className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 sm:px-6 sm:py-4 items-start sm:items-center text-xs sm:text-sm transition-colors ${
                  member.isCurrentUser
                    ? "bg-surface-elevated/50 font-medium"
                    : "hover:bg-surface-elevated/30"
                }`}
              >
                {/* Column 1: Rank */}
                <div className="hidden sm:block col-span-1 text-center font-bold text-foreground-dim tabular-nums">
                  {isUserHidden ? "—" : `#${index + 1}`}
                </div>

                {/* Column 2: Reader Identity */}
                <div className="col-span-5 flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-border text-xs font-semibold text-foreground overflow-hidden shadow-2xs">
                    {isUserHidden || isOtherHidden ? (
                      <EyeOff className="size-4 text-foreground-dim" />
                    ) : member.avatarUrl ? (
                      <Image
                        src={member.avatarUrl}
                        alt={member.name}
                        width={40}
                        height={40}
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
                        <span className="rounded-sm bg-foreground text-background px-1.5 py-0.2 text-[9px] font-bold">
                          YOU
                        </span>
                      )}
                      {isUserHidden && (
                        <span className="text-[10px] text-foreground-dim">
                          (Private)
                        </span>
                      )}
                      {isOtherHidden && !member.isAnonymous && (
                        <span className="text-[10px] text-foreground-dim">
                          (Anonymous to you)
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-foreground-dim block truncate">
                      {isUserHidden
                        ? "Hidden from cohort"
                        : isOtherHidden
                        ? `${member.completedChapters} of ${member.totalChapters} chapters`
                        : `${member.completedChapters} of ${member.totalChapters} chapters`}
                    </span>
                  </div>

                  {/* Mobile-only rank badge */}
                  <div className="sm:hidden text-xs font-bold text-foreground-dim shrink-0">
                    {isUserHidden ? "—" : `#${index + 1}`}
                  </div>
                </div>

                {/* Mobile-Only Progress & Status Row */}
                <div className="sm:hidden w-full space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs text-foreground-dim">
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
                          className="inline-flex items-center justify-center size-5 rounded-full bg-surface-elevated text-foreground border border-border"
                          title="Read today"
                        >
                          <CheckCircle2 className="size-3 text-foreground" />
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center size-5 rounded-full bg-surface-elevated/40 text-foreground-dim border border-border"
                          title="Reading pending today"
                        >
                          <Clock className="size-3 text-foreground-dim" />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
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
                      className="h-full rounded-full bg-foreground transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Desktop Column 3: Progress Bar & Milestone */}
                <div className="hidden sm:block col-span-3 w-full sm:w-auto space-y-1">
                  <div className="flex items-center justify-between text-xs text-foreground-dim">
                    <span>Milestone</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {isUserHidden || isOtherHidden
                        ? "—"
                        : `${member.completedChapters}/${member.totalChapters}`}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      style={{
                        width: isUserHidden || isOtherHidden
                          ? "0%"
                          : `${Math.min(100, Math.max(member.progressPercent, 2))}%`,
                      }}
                      className="h-full rounded-full bg-foreground transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Desktop Column 4: Percent */}
                <div className="hidden sm:block col-span-2 text-right font-semibold text-foreground tabular-nums">
                  {isUserHidden || isOtherHidden ? "—" : `${member.progressPercent}%`}
                </div>

                {/* Desktop Column 5: Today Status */}
                <div className="hidden sm:flex col-span-1 items-center justify-end">
                  {member.readToday ? (
                    <span
                      className="inline-flex items-center justify-center size-7 rounded-full bg-surface-elevated text-foreground border border-border"
                      title={isUserHidden ? "Read today (hidden)" : "Read today"}
                    >
                      <CheckCircle2 className="size-4 text-foreground" />
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center size-7 rounded-full bg-surface-elevated/40 text-foreground-dim border border-border"
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

      {/* Visibility Confirmation / 24-Hour Cooldown Modal */}
      <GroupVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        groupId={groupId}
        currentHideProgress={hideProgress}
        privacyUpdatedAt={privacyUpdatedAt}
        onSuccess={({ hideProgress: newHide, privacyUpdatedAt: newTime }) => {
          setHideProgress(newHide);
          setPrivacyUpdatedAt(newTime);
        }}
      />
    </div>
  );
}
