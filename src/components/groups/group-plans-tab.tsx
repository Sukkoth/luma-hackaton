"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Plus,
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
}: GroupPlansTabProps) {
  const [selectedPlanForEnroll, setSelectedPlanForEnroll] =
    useState<GroupPlanSummary | null>(null);
  const [hideProgress, setHideProgress] = useState(currentUserHideProgress);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  async function handleTogglePrivacy() {
    setIsUpdatingPrivacy(true);
    const nextVal = !hideProgress;
    try {
      const res = await toggleLeaderboardPrivacyAction({
        groupId,
        hideProgress: nextVal,
      });
      if (res.success) {
        setHideProgress(nextVal);
      }
    } finally {
      setIsUpdatingPrivacy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Plans Header / Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Active Fellowship Plans ({activePlans.length})
        </h2>
        {isAdmin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenScheduleModal}
            leftIcon={<Plus className="size-3.5" />}
          >
            Schedule Plan
          </Button>
        )}
      </div>

      {activePlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-surface-elevated/40 p-10 text-center">
          <Calendar className="size-8 text-foreground-dim mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No active reading plans currently running
          </h3>
          <p className="text-xs text-foreground-secondary max-w-sm mb-4 leading-relaxed">
            {isAdmin
              ? "Schedule your first group reading plan to begin reading scripture with your cohort."
              : "The fellowship leaders have not started an active plan yet. Check back soon!"}
          </p>
          {isAdmin && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onOpenScheduleModal}
              leftIcon={<Plus className="size-3.5" />}
            >
              Schedule New Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activePlans.map((plan) => {
            const leaderboard = leaderboardsByPlanId[plan.id] || [];
            const isEnrolled = Boolean(plan.userEnrolledInstanceId);

            return (
              <div
                key={plan.id}
                className="ui-card-elevated rounded-[22px] p-5 sm:p-6 space-y-6"
              >
                {/* Plan Overview Card Top */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-0.5 text-[10px] font-semibold text-foreground border border-border uppercase">
                        Active Group Plan
                      </span>
                      <span className="text-xs text-foreground-dim">
                        Target: {plan.dailyChapterTarget} chapters/day
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">
                      {plan.templateTitle}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {plan.totalChapters} total chapters • {plan.enrolledMembersCount} members enrolled
                    </p>
                  </div>

                  {/* Enrollment Action Button */}
                  <div>
                    {isEnrolled ? (
                      <Link
                        href={`/plans/${plan.userEnrolledInstanceId}`}
                        className="inline-flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold rounded-[12px] bg-primary text-primary-foreground hover:opacity-90 shadow-xs transition-all"
                      >
                        <span>Continue Reading</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                        leftIcon={<UserCheck className="size-3.5" />}
                      >
                        Enroll in Plan
                      </Button>
                    )}
                  </div>
                </div>

                {/* Cohort Leaderboard & Progress Matrix */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Cohort Progress Leaderboard
                      </h4>
                      <p className="text-[11px] text-foreground-dim">
                        Real-time completion percentage and today&apos;s reading activity.
                      </p>
                    </div>

                    {/* Privacy Toggle */}
                    <button
                      type="button"
                      onClick={handleTogglePrivacy}
                      disabled={isUpdatingPrivacy}
                      className="inline-flex items-center gap-1.5 text-[11px] text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                    >
                      {hideProgress ? (
                        <>
                          <EyeOff className="size-3.5 text-warning" />
                          <span>Progress hidden from peers</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          <span>Progress visible to peers</span>
                        </>
                      )}
                    </button>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface p-6 text-center text-xs text-foreground-dim">
                      No members have enrolled in this plan yet. Be the first to start reading!
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
                      {leaderboard.map((member, index) => {
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
                                ? "bg-primary/5"
                                : "hover:bg-surface-elevated/40"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] font-bold text-foreground-dim w-4 text-center">
                                {index + 1}
                              </span>

                              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-border text-[11px] font-semibold text-foreground overflow-hidden">
                                {member.avatarUrl ? (
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

                              <div>
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  {member.name}
                                  {member.isCurrentUser && (
                                    <span className="rounded-sm bg-surface-elevated px-1 text-[9px] font-bold text-foreground-dim border border-border">
                                      YOU
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-foreground-dim block">
                                  {member.completedChapters} of {member.totalChapters} chapters
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar & Status Badge */}
                            <div className="flex items-center gap-4">
                              <div className="hidden sm:flex flex-col items-end gap-1 w-28">
                                <span className="text-[11px] font-mono font-medium text-foreground">
                                  {member.progressPercent}%
                                </span>
                                <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-border-subtle">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{
                                      width: `${member.progressPercent}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div>
                                {member.readToday ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2 py-0.5 text-[10px] font-semibold border border-success/20">
                                    <CheckCircle2 className="size-3" />
                                    Read Today
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle text-foreground-dim px-2 py-0.5 text-[10px] font-medium border border-border">
                                    <Clock className="size-3" />
                                    Not Yet
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="ui-card-elevated flex flex-col justify-between p-5 space-y-4"
                >
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground-secondary border border-border uppercase mb-2">
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
                    <span>{plan.enrolledMembersCount} members waiting</span>
                    {plan.userEnrolledInstanceId ? (
                      <span className="text-xs font-semibold text-success">
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
