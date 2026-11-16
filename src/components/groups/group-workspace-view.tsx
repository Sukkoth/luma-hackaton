"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Calendar,
  Settings,
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  Copy,
  Check,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import type {
  GroupDetails,
  GroupMemberSummary,
  LeaderboardEntry,
} from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { GroupPlansTab } from "@/components/groups/group-plans-tab";
import { GroupMembersTab } from "@/components/groups/group-members-tab";
import { GroupAdminTab } from "@/components/groups/group-admin-tab";
import { GroupSchedulePlanModal } from "@/components/groups/group-schedule-plan-modal";
import { Button } from "@/components/ui/button";

export type GroupWorkspaceViewProps = {
  group: GroupDetails;
  members: ReadonlyArray<GroupMemberSummary>;
  pendingMembers: ReadonlyArray<GroupMemberSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
};

export function GroupWorkspaceView({
  group,
  members,
  pendingMembers,
  leaderboardsByPlanId,
  trackers,
  activeTrackerId,
}: GroupWorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "members" | "admin">(
    "plans"
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = group.currentUserRole === "owner";
  const isAdmin = isOwner || group.currentUserRole === "admin";

  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleCopyInvite() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/groups/join/${group.inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalPlansCount =
    group.activePlans.length + group.scheduledPlans.length;

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-200">
      {/* Top Navigation Back Link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs text-foreground-dim hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
        <span>All Fellowships</span>
      </Link>

      {/* Fellowship Header Banner */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5 min-w-0">
            {/* Fellowship Crest / Avatar */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-lg font-bold text-foreground overflow-hidden shadow-xs ring-1 ring-border/50">
              {group.avatarUrl ? (
                <Image
                  src={group.avatarUrl}
                  alt={group.name}
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              ) : (
                <span className="tracking-wider">{initials}</span>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              {/* Badges Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-foreground-secondary border border-border">
                  {group.isPrivate ? (
                    <>
                      <Lock className="size-3 text-foreground-dim" />
                      <span>Private Cohort</span>
                    </>
                  ) : (
                    <>
                      <Globe className="size-3 text-foreground-dim" />
                      <span>Open Fellowship</span>
                    </>
                  )}
                </span>

                {isOwner ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated text-foreground px-2.5 py-1 text-[11px] font-semibold border border-border">
                    <Shield className="size-3 text-foreground" />
                    <span>Owner</span>
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated text-foreground px-2.5 py-1 text-[11px] font-medium border border-border">
                    <ShieldCheck className="size-3 text-foreground-secondary" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-surface-subtle text-foreground-dim px-2.5 py-1 text-[11px] font-medium border border-border">
                    Fellow Reader
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-dim px-1">
                  <Users className="size-3" />
                  <span>
                    {group.memberCount}{" "}
                    {group.memberCount === 1 ? "reader" : "readers"}
                  </span>
                </span>
              </div>

              {/* Fellowship Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {group.name}
              </h1>

              {/* Fellowship Description */}
              <p className="text-[13.5px] leading-relaxed text-foreground-secondary max-w-2xl">
                {group.description || "Community scripture reading fellowship."}
              </p>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-3 shrink-0 self-start lg:self-center pt-2 lg:pt-0">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCopyInvite}
              leftIcon={
                copied ? (
                  <Check className="size-4 text-success" />
                ) : (
                  <Copy className="size-4" />
                )
              }
            >
              {copied ? "Invite Copied!" : "Invite Link"}
            </Button>

            {isAdmin && (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsScheduleModalOpen(true)}
                leftIcon={<Calendar className="size-4" />}
              >
                Schedule Plan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Refined Segmented Pill Bar */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-surface-elevated/70 p-1.5 border border-border w-fit shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
            activeTab === "plans"
              ? "bg-foreground text-background shadow-xs"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          <BookOpen className="size-3.5" />
          <span>Cohort Plans ({totalPlansCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
            activeTab === "members"
              ? "bg-foreground text-background shadow-xs"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          <Users className="size-3.5" />
          <span>Members Directory ({members.length})</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer ${
              activeTab === "admin"
                ? "bg-foreground text-background shadow-xs"
                : "text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Settings className="size-3.5" />
            <span>Administration</span>
            {pendingMembers.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-black">
                {pendingMembers.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Active Tab Panel */}
      <div className="mt-2">
        {/* Tab 1: Group Plans */}
        {activeTab === "plans" && (
          <GroupPlansTab
            groupId={group.id}
            activePlans={group.activePlans}
            scheduledPlans={group.scheduledPlans}
            leaderboardsByPlanId={leaderboardsByPlanId}
            trackers={trackers}
            activeTrackerId={activeTrackerId}
            currentUserHideProgress={group.currentUserHideProgress}
            isAdmin={isAdmin}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onCopyInvite={handleCopyInvite}
          />
        )}

        {/* Tab 2: Members */}
        {activeTab === "members" && (
          <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
            <GroupMembersTab members={members} />
          </div>
        )}

        {/* Tab 3: Admin Settings */}
        {activeTab === "admin" && isAdmin && (
          <GroupAdminTab
            groupId={group.id}
            name={group.name}
            description={group.description}
            avatarUrl={group.avatarUrl}
            inviteCode={group.inviteCode}
            isPrivate={group.isPrivate}
            requiresApproval={group.requiresApproval}
            isOwner={isOwner}
            members={members}
            pendingMembers={pendingMembers}
          />
        )}
      </div>

      {/* Schedule Plan Modal */}
      <GroupSchedulePlanModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={group.id}
      />
    </div>
  );
}
