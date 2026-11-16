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
    <div className="space-y-8">
      {/* Active Plans Header / Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Active Fellowship Plans ({activePlans.length})
          </h2>
          <p className="text-xs text-foreground-dim mt-0.5">
            Synchronized reading schedules followed by cohort members.
          </p>
        </div>
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
                className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
              >
                {/* Left: Active Plan Hero Card (7 cols) */}
                <div className="lg:col-span-7 ui-card-elevated rounded-[22px] p-6 space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border uppercase">
                      Active Fellowship Plan
                    </span>
                    <span className="text-xs text-foreground-dim">
                      Target: {plan.dailyChapterTarget} ch/day
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {plan.templateTitle}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
                      Curriculum of {plan.totalChapters} chapters synchronized across the fellowship.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[11px] text-foreground-dim block">
                        Enrolled Members
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {plan.enrolledMembersCount}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-surface p-3 text-center">
                      <span className="text-[11px] text-foreground-dim block">
                        Total Chapters
                      </span>
                      <span className="text-base font-bold text-foreground">
                        {plan.totalChapters}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                    {isEnrolled ? (
                      <Link
                        href={`/plans/${plan.userEnrolledInstanceId}`}
                        className="inline-flex items-center justify-center gap-2 h-10 px-5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-xs transition-all w-full sm:w-auto"
                      >
                        <span>Continue Reading</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto"
                        onClick={() => setSelectedPlanForEnroll(plan)}
                        leftIcon={<UserCheck className="size-4" />}
                      >
                        Enroll in Plan
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right: Cohort Leaderboard Widget (5 cols) */}
                <div className="lg:col-span-5 ui-card-elevated rounded-[22px] p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div>
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Cohort Leaderboard
                      </h4>
                      <p className="text-[11px] text-foreground-dim">
                        Ranked by chapters read
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleTogglePrivacy}
                      disabled={isUpdatingPrivacy}
                      className="inline-flex items-center gap-1.5 text-[11px] text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                      title="Toggle leaderboard privacy"
                    >
                      {hideProgress ? (
                        <>
                          <EyeOff className="size-3.5 text-warning" />
                          <span className="text-[10px]">Hidden</span>
                        </>
                      ) : (
                        <>
                          <Eye className="size-3.5" />
                          <span className="text-[10px]">Visible</span>
                        </>
                      )}
                    </button>
                  </div>

                  {leaderboard.length === 0 ? (
                    <div className="rounded-xl border border-border bg-surface p-6 text-center text-xs text-foreground-dim">
                      No members enrolled yet.
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden max-h-[360px] overflow-y-auto">
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
                            className={`flex items-center justify-between p-3 text-xs transition-colors ${
                              member.isCurrentUser
                                ? "bg-primary/5"
                                : "hover:bg-surface-elevated/40"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-[10px] font-bold text-foreground-dim w-3.5 text-center">
                                {index + 1}
                              </span>

                              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-elevated border border-border text-[10px] font-semibold text-foreground overflow-hidden">
                                {member.avatarUrl ? (
                                  <Image
                                    src={member.avatarUrl}
                                    alt={member.name}
                                    width={28}
                                    height={28}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span>{initials}</span>
                                )}
                              </div>

                              <div className="truncate">
                                <span className="font-semibold text-foreground flex items-center gap-1 truncate text-xs">
                                  {member.name}
                                  {member.isCurrentUser && (
                                    <span className="rounded-sm bg-surface-elevated px-1 text-[8.5px] font-bold text-foreground-dim border border-border">
                                      YOU
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-foreground-dim block">
                                  {member.completedChapters} / {member.totalChapters} ch
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-[11px] font-medium text-foreground">
                                {member.progressPercent}%
                              </span>

                              {member.readToday ? (
                                <span className="flex size-5 items-center justify-center rounded-full bg-success/10 text-success border border-success/20" title="Read today">
                                  <CheckCircle2 className="size-3" />
                                </span>
                              ) : (
                                <span className="flex size-5 items-center justify-center rounded-full bg-surface-subtle text-foreground-dim border border-border" title="Not yet read today">
                                  <Clock className="size-3" />
                                </span>
                              )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span>{plan.enrolledMembersCount} waiting</span>
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
