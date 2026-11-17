"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Check,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Plus,
  BookOpen,
  Users,
  Calendar,
} from "lucide-react";
import type { GroupPlanSummary, LeaderboardEntry } from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { toggleLeaderboardPrivacyAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { GroupPlanEnrollModal } from "@/components/groups/group-plan-enroll-modal";

export type GroupPlansTabProps = {
  groupId: string;
  activePlans: ReadonlyArray<GroupPlanSummary>;
  scheduledPlans: ReadonlyArray<GroupPlanSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
  currentUserHideProgress: boolean;
  isAdmin: boolean;
  onOpenScheduleModal: () => void;
  onCopyInvite?: () => void;
};

export function GroupPlansTab({
  groupId,
  activePlans,
  scheduledPlans,
  leaderboardsByPlanId,
  trackers,
  activeTrackerId,
  currentUserHideProgress,
  isAdmin,
  onOpenScheduleModal,
  onCopyInvite,
}: GroupPlansTabProps) {
  const router = useRouter();
  const [selectedPlanForEnroll, setSelectedPlanForEnroll] =
    useState<GroupPlanSummary | null>(null);
  const [hideProgress, setHideProgress] = useState(currentUserHideProgress);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  async function handleTogglePrivacy() {
    setIsUpdatingPrivacy(true);
    const nextVal = !hideProgress;
    setHideProgress(nextVal);
    try {
      const res = await toggleLeaderboardPrivacyAction({
        groupId,
        hideProgress: nextVal,
      });
      if (res.success) {
        router.refresh();
      } else {
        setHideProgress(!nextVal);
      }
    } catch {
      setHideProgress(!nextVal);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  }

  return (
    <div className="space-y-12">
      {activePlans.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-surface-elevated border border-border text-foreground mb-4">
            <BookOpen className="size-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No active plan
          </h3>
          <p className="text-sm text-foreground-dim max-w-sm mb-6 leading-relaxed">
            {isAdmin
              ? "Schedule a reading plan so your fellowship can read through scripture together."
              : "Your fellowship leaders haven't started a plan yet. Check back soon."}
          </p>
          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-4" />}
            >
              Schedule Plan
            </Button>
          )}
        </div>
      ) : (
        /* ── Active Plans ── */
        <div className="space-y-12">
          {activePlans.map((plan) => {
            const leaderboard = leaderboardsByPlanId[plan.id] || [];
            const isEnrolled = Boolean(plan.userEnrolledInstanceId);
            const currentUserIndex = leaderboard.findIndex((m) => m.isCurrentUser);
            const currentUser =
              currentUserIndex >= 0 ? leaderboard[currentUserIndex] : undefined;
            const userCompleted = currentUser?.completedChapters ?? 0;
            const userPercent = currentUser?.progressPercent ?? 0;

            return (
              <div key={plan.id} className="space-y-8">
                {/* ── Plan Hero ── */}
                <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="space-y-1 min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                        {plan.templateTitle}
                      </h2>
                      <p className="text-sm text-foreground-dim">
                        {plan.totalChapters} chapters · {plan.dailyChapterTarget} per day · {plan.enrolledMembersCount} {plan.enrolledMembersCount === 1 ? "reader" : "readers"}
                      </p>
                    </div>
                  </div>

                  {/* Enrollment / Progress */}
                  {isEnrolled ? (
                    <div className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {userCompleted} of {plan.totalChapters} chapters
                          </span>
                          <span className="text-foreground-dim tabular-nums">
                            {userPercent}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(userPercent, 1))}%`,
                            }}
                            className="h-full rounded-full bg-foreground transition-all duration-500"
                          />
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium rounded-xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all w-full sm:w-auto cursor-pointer"
                        >
                          Continue Reading
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface-elevated/50 p-4">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          Join this reading plan
                        </span>
                        <p className="text-xs text-foreground-dim">
                          Sync your daily chapters and reflections with fellow readers.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto shrink-0"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                        leftIcon={<UserCheck className="size-4" />}
                      >
                        Enroll
                      </Button>
                    </div>
                  )}
                </div>

                {/* ── Fellowship Circle ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        Fellowship Circle
                      </h3>
                      <span className="text-xs text-foreground-dim">
                        {leaderboard.length} {leaderboard.length === 1 ? "reader" : "readers"}
                      </span>
                    </div>

                    {currentUser && (
                      <button
                        type="button"
                        onClick={handleTogglePrivacy}
                        disabled={isUpdatingPrivacy}
                        className="inline-flex items-center gap-1.5 text-xs text-foreground-dim hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingPrivacy ? (
                          <span>Updating…</span>
                        ) : hideProgress ? (
                          <>
                            <EyeOff className="size-3" />
                            <span>Hidden</span>
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" />
                            <span>Visible</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {leaderboard.length === 0 ? (
                    /* Empty fellowship */
                    <div className="rounded-xl border border-dashed border-border py-10 text-center">
                      <p className="text-sm text-foreground-dim mb-1">
                        No readers enrolled yet.
                      </p>
                      <p className="text-xs text-foreground-dim max-w-xs mx-auto mb-4">
                        Be the first to join, or invite friends to read together.
                      </p>
                      {!isEnrolled ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedPlanForEnroll(plan)}
                          leftIcon={<UserCheck className="size-3.5" />}
                        >
                          Enroll
                        </Button>
                      ) : (
                        onCopyInvite && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onCopyInvite}
                            leftIcon={<Users className="size-3.5" />}
                          >
                            Invite Friends
                          </Button>
                        )
                      )}
                    </div>
                  ) : (
                    /* Reader roster — clean table-like layout */
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="divide-y divide-border max-h-[360px] overflow-y-auto overscroll-contain">
                        {leaderboard.map((member, index) => {
                          const isUserHidden =
                            member.isCurrentUser && hideProgress;
                          const isOtherHidden =
                            !member.isCurrentUser && member.isAnonymous;
                          const memberInitials = member.name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                          return (
                            <div
                              key={member.userId}
                              className={`flex items-center justify-between px-4 py-3 text-sm ${
                                member.isCurrentUser
                                  ? "bg-surface-elevated/60"
                                  : "hover:bg-surface-elevated/30"
                              } transition-colors`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Rank */}
                                <span className="text-xs font-medium text-foreground-dim w-5 text-right tabular-nums shrink-0">
                                  {isUserHidden ? "—" : index + 1}
                                </span>

                                {/* Avatar */}
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-border text-xs font-medium text-foreground overflow-hidden">
                                  {isUserHidden || isOtherHidden ? (
                                    <EyeOff className="size-3.5 text-foreground-dim" />
                                  ) : member.avatarUrl ? (
                                    <Image
                                      src={member.avatarUrl}
                                      alt={member.name}
                                      width={32}
                                      height={32}
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <span>{memberInitials}</span>
                                  )}
                                </div>

                                {/* Name */}
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-foreground truncate">
                                      {member.name}
                                    </span>
                                    {member.isCurrentUser && (
                                      <span className="text-[10px] font-medium text-foreground-dim">
                                        you
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-foreground-dim block">
                                    {isUserHidden
                                      ? "Progress hidden"
                                      : isOtherHidden
                                      ? "Progress hidden"
                                      : `${member.completedChapters} / ${member.totalChapters} chapters`}
                                  </span>
                                </div>
                              </div>

                              {/* Right: progress + today indicator */}
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <span className="text-xs font-medium text-foreground-dim tabular-nums">
                                  {isUserHidden || isOtherHidden
                                    ? "—"
                                    : `${member.progressPercent}%`}
                                </span>

                                {member.readToday ? (
                                  <span title="Read today">
                                    <CheckCircle2 className="size-4 text-foreground" />
                                  </span>
                                ) : (
                                  <span title="Hasn't read today">
                                    <Clock className="size-4 text-foreground-dim/40" />
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Invite strip */}
                  {onCopyInvite && leaderboard.length > 0 && (
                    <button
                      type="button"
                      onClick={onCopyInvite}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-foreground-dim hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-surface-elevated/50"
                    >
                      <Users className="size-3.5" />
                      <span>Invite more readers</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upcoming Plans ── */}
      {scheduledPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Upcoming
          </h3>

          <div className="space-y-3">
            {scheduledPlans.map((plan) => {
              const startDateObj = new Date(plan.scheduledStartDate);
              const startDateStr = startDateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const nowMidnight = new Date();
              nowMidnight.setHours(0, 0, 0, 0);
              const diffDays = Math.ceil(
                (startDateObj.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24)
              );
              const countdownLabel =
                diffDays <= 0
                  ? "Starts today"
                  : diffDays === 1
                  ? "Tomorrow"
                  : `In ${diffDays} days`;

              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 hover:border-border-strong transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {plan.templateTitle}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground-dim">
                      <span>{plan.totalChapters} chapters</span>
                      <span>·</span>
                      <span>{plan.dailyChapterTarget}/day</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {startDateStr}
                      </span>
                      <span>·</span>
                      <span>{countdownLabel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-foreground-dim">
                      {plan.enrolledMembersCount} waiting
                    </span>
                    {plan.userEnrolledInstanceId ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                          <Check className="size-3" />
                          Enrolled
                        </span>
                        <Link
                          href={`/plans/${plan.userEnrolledInstanceId}`}
                          className="text-xs text-foreground-dim hover:text-foreground font-medium transition-colors inline-flex items-center gap-0.5"
                        >
                          Preview
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                      >
                        Pre-enroll
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {selectedPlanForEnroll && (
        <GroupPlanEnrollModal
          isOpen={true}
          onClose={() => setSelectedPlanForEnroll(null)}
          groupId={groupId}
          groupPlanId={selectedPlanForEnroll.id}
          planTitle={selectedPlanForEnroll.templateTitle}
          scheduledStartDate={selectedPlanForEnroll.scheduledStartDate}
          trackers={trackers}
          defaultTrackerId={activeTrackerId}
        />
      )}
    </div>
  );
}
