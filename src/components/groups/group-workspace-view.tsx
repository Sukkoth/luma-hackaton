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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation Back Link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-xs text-foreground-dim hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>All Fellowships</span>
      </Link>

      {/* Group Header Banner */}
      <div className="ui-card flex flex-col gap-5 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-base font-bold text-foreground overflow-hidden shadow-inner">
            {group.avatarUrl ? (
              <Image
                src={group.avatarUrl}
                alt={group.name}
                width={56}
                height={56}
                className="size-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2 py-0.5 text-[10px] font-semibold text-foreground uppercase tracking-wide border border-border">
                {group.isPrivate ? (
                  <>
                    <Lock className="size-3" /> Private
                  </>
                ) : (
                  <>
                    <Globe className="size-3" /> Public
                  </>
                )}
              </span>

              {isOwner ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-foreground px-2 py-0.5 text-[10px] font-semibold border border-primary/20">
                  <Shield className="size-3" /> Owner
                </span>
              ) : isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated text-foreground-secondary px-2 py-0.5 text-[10px] font-medium border border-border">
                  <ShieldCheck className="size-3" /> Admin
                </span>
              ) : (
                <span className="inline-flex items-center rounded-lg bg-surface-subtle text-foreground-dim px-2 py-0.5 text-[10px] font-medium border border-border">
                  Member
                </span>
              )}

              <span className="text-xs text-foreground-dim flex items-center gap-1">
                <Users className="size-3" /> {group.memberCount} members
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {group.name}
            </h1>
            <p className="mt-1 text-xs text-foreground-secondary line-clamp-2 max-w-2xl leading-relaxed">
              {group.description || "Community fellowship circle on Luma."}
            </p>
          </div>
        </div>

        {/* Quick Action: Copy Invite */}
        <div className="shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyInvite}
            leftIcon={
              copied ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
          >
            {copied ? "Copied Link" : "Invite Link"}
          </Button>
        </div>
      </div>

      {/* Main 3-Tab Section */}
      <section className="ui-card rounded-[22px] p-5 sm:p-6 space-y-6">
        {/* Navigation Tabs - Segmented Control */}
        <div className="border-b border-border-subtle pb-5">
          <div className="flex items-center gap-1 rounded-[16px] border border-border bg-surface-elevated p-1 overflow-x-auto scrollbar-none w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("plans")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "plans"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Calendar className="size-3.5" />
              <span>Group Plans ({group.activePlans.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "members"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Users className="size-3.5" />
              <span>Members ({members.length})</span>
            </button>

            {/* Admin Settings Tab: Strictly rendered for Owner & Admins */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                  activeTab === "admin"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-transparent text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Settings className="size-3.5" />
                <span>Admin Settings</span>
                {pendingMembers.length > 0 && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-background">
                    {pendingMembers.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

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
          />
        )}

        {/* Tab 2: Members */}
        {activeTab === "members" && <GroupMembersTab members={members} />}

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
      </section>

      {/* Schedule Plan Modal */}
      <GroupSchedulePlanModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={group.id}
      />
    </div>
  );
}
