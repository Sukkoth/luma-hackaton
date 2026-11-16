"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Plus,
  BookOpen,
  Sparkles,
  Users,
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
    <div className="space-y-8">
      {activePlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface-elevated/40 p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface border border-border text-foreground mb-4 shadow-2xs">
            <BookOpen className="size-6 text-foreground" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1.5">
            No Active Fellowship Plan
          </h3>
          <p className="text-xs sm:text-[13px] text-foreground-secondary max-w-md mb-6 leading-relaxed">
            {isAdmin
              ? "Schedule your fellowship's next reading journey so all cohort members can read through scripture together on a shared cadence."
              : "The fellowship leaders have not launched an active reading plan yet. Check back soon or ask your leaders to schedule one!"}
          </p>
          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-4" />}
            >
              Schedule New Reading Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activePlans.map((plan) => {
            const leaderboard = leaderboardsByPlanId[plan.id] || [];
            const isEnrolled = Boolean(plan.userEnrolledInstanceId);
            const currentUserIndex = leaderboard.findIndex((m) => m.isCurrentUser);
            const currentUser =
              currentUserIndex >= 0 ? leaderboard[currentUserIndex] : undefined;
            const currentUserRank =
              currentUserIndex >= 0 ? currentUserIndex + 1 : undefined;
            const userCompleted = currentUser?.completedChapters ?? 0;
            const userPercent = currentUser?.progressPercent ?? 0;

            return (
              <div
                key={plan.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                {/* Left: Active Plan Hero Pavilion (7 cols) */}
                <div className="lg:col-span-7 xl:col-span-7 rounded-3xl border border-border bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
                  {/* Eyebrow */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-foreground-dim">
                      Active Reading Plan
                    </span>
                    <span className="text-xs text-foreground-secondary">
                      {plan.dailyChapterTarget}{" "}
                      {plan.dailyChapterTarget === 1 ? "chapter" : "chapters"} / day
                    </span>
                  </div>

                  {/* Title & Curriculum Summary */}
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {plan.templateTitle}
                    </h3>
                    <p className="mt-1 text-xs sm:text-[13.5px] text-foreground-secondary leading-relaxed max-w-2xl">
                      A structured curriculum of {plan.totalChapters} chapters synchronized daily across all cohort readers.
                    </p>
                  </div>

                  {/* Personal Reading Station (Progress & Primary Action) */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-5 space-y-4">
                    {isEnrolled ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">
                              Your Reading Milestone
                            </span>
                            <span className="font-semibold text-foreground">
                              {userCompleted} of {plan.totalChapters} chapters ({userPercent}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-surface border border-border-subtle">
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(userPercent, 2))}%`,
                              }}
                              className="h-full rounded-full bg-foreground transition-all duration-300"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border-subtle">
                          <Link
                            href={`/plans/${plan.userEnrolledInstanceId}`}
                            className="inline-flex items-center justify-center gap-2 h-11 px-6 text-xs sm:text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-xs transition-all w-full sm:w-auto cursor-pointer"
                          >
                            <span>Continue Reading {plan.templateTitle}</span>
                            <ArrowRight className="size-4" />
                          </Link>
                          <span className="text-xs text-foreground-dim text-center sm:text-right">
                            Includes shared fellowship reflections &amp; notes
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground block">
                            Join Fellowship Reading Journey
                          </span>
                          <span className="text-xs text-foreground-dim block">
                            Synchronize your personal reader with this cohort
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          className="w-full sm:w-auto h-11 px-6 text-sm"
                          onClick={() => setSelectedPlanForEnroll(plan)}
                          leftIcon={<UserCheck className="size-4" />}
                        >
                          Enroll &amp; Read With Fellowship
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Integrated Fellowship Vitals Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-3.5 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-0.5">
                        Cohort Readers
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {plan.enrolledMembersCount}{" "}
                        {plan.enrolledMembersCount === 1 ? "reader" : "readers"}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-3.5 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-0.5">
                        Total Length
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {plan.totalChapters} Chapters
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-3.5 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-0.5">
                        Daily Cadence
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        {plan.dailyChapterTarget} ch / day
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-3.5 text-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-dim block mb-0.5">
                        Cohort Sync
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        Synchronized
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Fellowship Circle & Accountability Board (5 cols) */}
                <div className="lg:col-span-5 xl:col-span-5 rounded-3xl border border-border bg-surface p-6 space-y-4 shadow-xs">
                  {/* Board Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Fellowship Circle
                      </h4>
                      <p className="text-[11px] text-foreground-dim mt-0.5">
                        {leaderboard.length} enrolled {leaderboard.length === 1 ? "reader" : "readers"}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold text-foreground-dim uppercase tracking-wider px-2 py-0.5 rounded-md border border-border bg-surface-elevated/40">
                      Cohort Momentum
                    </span>
                  </div>

                  {/* Current User Standing & Privacy Bar */}
                  {currentUser && (
                    <div
                      className={`rounded-xl border p-3 text-xs transition-all ${
                        hideProgress
                          ? "border-dashed border-border bg-surface-elevated/30"
                          : "border-border bg-surface-elevated/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-2 rounded-full shrink-0 ${
                                hideProgress ? "bg-foreground-dim" : "bg-foreground"
                              }`}
                            />
                            <span className="text-foreground font-semibold truncate">
                              {hideProgress
                                ? "Your Progress is Hidden"
                                : `Your Standing: #${currentUserRank} of ${leaderboard.length}`}
                            </span>
                            <span
                              className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                                hideProgress
                                  ? "border-border bg-surface text-foreground-dim"
                                  : "border-border bg-surface text-foreground-secondary"
                              }`}
                            >
                              {hideProgress ? "Private" : "Visible"}
                            </span>
                          </div>

                          <p className="text-[10.5px] text-foreground-dim mt-1">
                            {hideProgress
                              ? "Other cohort members will not see your chapters or rank."
                              : `${userCompleted} of ${plan.totalChapters} chapters read (${userPercent}%).`}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleTogglePrivacy}
                          disabled={isUpdatingPrivacy}
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:opacity-80 active:scale-[0.98] transition-all cursor-pointer px-2.5 py-1.5 rounded-lg border border-border bg-surface shrink-0 shadow-2xs disabled:opacity-50"
                          title={
                            hideProgress
                              ? "Share your reading progress with the cohort"
                              : "Hide your reading progress from fellow cohort members"
                          }
                        >
                          {isUpdatingPrivacy ? (
                            <span className="text-[10px]">Updating...</span>
                          ) : hideProgress ? (
                            <>
                              <Eye className="size-3 text-foreground" />
                              <span>Make Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3 text-foreground-dim" />
                              <span>Hide Progress</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Member Leaderboard Roster (Scrollable container capped at ~340px) */}
                  {leaderboard.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface-elevated/40 p-6 text-center text-xs text-foreground-dim">
                      No readers enrolled in this plan yet.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-y-auto max-h-[340px] overscroll-contain">
                      {leaderboard.map((member, index) => {
                        const isUserHidden =
                          member.isCurrentUser && hideProgress;
                        const isOtherHidden =
                          !member.isCurrentUser && member.isAnonymous;
                        const initials = member.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        return (
                          <div
                            key={member.userId}
                            className={`flex items-center justify-between p-3.5 text-xs transition-colors ${
                              member.isCurrentUser
                                ? isUserHidden
                                  ? "bg-surface-elevated/40 border-l-2 border-foreground-dim"
                                  : "bg-surface-elevated/80 font-medium border-l-2 border-foreground"
                                : "hover:bg-surface-elevated/30"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-semibold text-foreground-dim w-4 text-center shrink-0">
                                {isUserHidden ? "—" : index + 1}
                              </span>

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-border text-[11px] font-bold text-foreground overflow-hidden shadow-2xs">
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
                                  <span>{initials}</span>
                                )}
                              </div>

                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground text-xs truncate">
                                    {member.name}
                                  </span>
                                  {member.isCurrentUser && (
                                    <span className="rounded-sm bg-foreground text-background px-1 text-[8.5px] font-bold">
                                      YOU
                                    </span>
                                  )}
                                  {isUserHidden && (
                                    <span className="rounded-sm border border-border bg-surface px-1 text-[8.5px] font-medium text-foreground-dim">
                                      Hidden from Cohort
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10.5px] text-foreground-dim block">
                                  {isUserHidden
                                    ? `${member.completedChapters} / ${member.totalChapters} chapters (Private to you)`
                                    : isOtherHidden
                                    ? "Progress hidden"
                                    : `${member.completedChapters} / ${member.totalChapters} chapters`}
                                </span>
                              </div>
                            </div>

                            {/* Progress Percent & Read Today Icon */}
                            <div className="flex items-center gap-2.5 shrink-0 ml-2">
                              <span
                                className={`text-xs font-semibold ${
                                  isUserHidden
                                    ? "text-foreground-dim"
                                    : "text-foreground"
                                }`}
                              >
                                {isUserHidden ? "Hidden" : `${member.progressPercent}%`}
                              </span>

                              {member.readToday ? (
                                <span
                                  className="flex size-6 items-center justify-center rounded-full bg-surface-elevated text-foreground border border-border"
                                  title={
                                    isUserHidden
                                      ? "Read today (hidden from cohort)"
                                      : "Read today"
                                  }
                                >
                                  <CheckCircle2 className="size-3.5 text-foreground" />
                                </span>
                              ) : (
                                <span
                                  className="flex size-6 items-center justify-center rounded-full bg-surface-subtle text-foreground-dim border border-border"
                                  title="Reading pending"
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

                  {/* Fellowship Encouragement & Invite Card (Eliminates dead space) */}
                  <div className="rounded-2xl border border-border bg-surface-elevated/40 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="size-4 text-foreground-dim shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11.5px] italic text-foreground-secondary leading-snug">
                          &ldquo;As iron sharpens iron, so one person sharpens another.&rdquo;
                        </p>
                        <span className="text-[10px] font-semibold text-foreground-dim uppercase tracking-wider mt-1 block">
                          Proverbs 27:17
                        </span>
                      </div>
                    </div>

                    {onCopyInvite && (
                      <button
                        type="button"
                        onClick={onCopyInvite}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
                      >
                        <Users className="size-3.5 text-foreground-dim" />
                        <span>Invite Friends to this Circle</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upcoming Scheduled Plans */}
      {scheduledPlans.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Upcoming Scheduled Plans ({scheduledPlans.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduledPlans.map((plan) => {
              const startDateStr = new Date(
                plan.scheduledStartDate
              ).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={plan.id}
                  className="ui-card flex flex-col justify-between p-5 space-y-4 transition-all duration-150 hover:border-border-strong"
                >
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-foreground-secondary border border-border uppercase mb-2">
                      Starts {startDateStr}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {plan.templateTitle}
                    </h3>
                    <p className="text-xs text-foreground-dim mt-1">
                      {plan.totalChapters} chapters • {plan.dailyChapterTarget} chapters/day
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-foreground-dim">
                    <span>{plan.enrolledMembersCount} waiting</span>
                    {plan.userEnrolledInstanceId ? (
                      <span className="text-xs font-semibold text-foreground">
                        Pre-enrolled
                      </span>
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
          trackers={trackers}
          defaultTrackerId={activeTrackerId}
        />
      )}
    </div>
  );
}
