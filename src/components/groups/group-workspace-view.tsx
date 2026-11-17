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

  const tabs = [
    { id: "plans" as const, label: "Plans", count: totalPlansCount, icon: BookOpen },
    { id: "members" as const, label: "Members", count: members.length, icon: Users },
    ...(isAdmin
      ? [{ id: "admin" as const, label: "Settings", count: pendingMembers.length > 0 ? pendingMembers.length : undefined, icon: Settings }]
      : []),
  ];

  return (
    <div className="w-full animate-in fade-in duration-200">
      {/* Breadcrumb — quiet, functional */}
      <div className="mb-8">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-dim hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
          <span>Fellowships</span>
        </Link>
      </div>

      {/* Editorial Header — the group identity breathes */}
      <div className="mb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            {/* Avatar */}
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-base font-semibold text-foreground overflow-hidden">
              {group.avatarUrl ? (
                <Image
                  src={group.avatarUrl}
                  alt={group.name}
                  width={56}
                  height={56}
                  className="size-full object-cover"
                />
              ) : (
                <span className="tracking-wide">{initials}</span>
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
                {group.name}
              </h1>

              {/* Meta line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-dim">
                <span className="inline-flex items-center gap-1">
                  {group.isPrivate ? (
                    <Lock className="size-3" />
                  ) : (
                    <Globe className="size-3" />
                  )}
                  {group.isPrivate ? "Private" : "Open"}
                </span>

                <span className="text-border-strong">·</span>

                <span>{group.memberCount} {group.memberCount === 1 ? "member" : "members"}</span>

                {isOwner ? (
                  <>
                    <span className="text-border-strong">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground-secondary">
                      <Shield className="size-3" />
                      Owner
                    </span>
                  </>
                ) : isAdmin ? (
                  <>
                    <span className="text-border-strong">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-foreground-secondary">
                      <ShieldCheck className="size-3" />
                      Admin
                    </span>
                  </>
                ) : null}
              </div>

              {/* Description */}
              {group.description && (
                <p className="text-sm text-foreground-secondary max-w-xl leading-relaxed pt-0.5">
                  {group.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyInvite}
              leftIcon={
                copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )
              }
            >
              {copied ? "Copied" : "Invite"}
            </Button>

            {isAdmin && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsScheduleModalOpen(true)}
                leftIcon={<Calendar className="size-3.5" />}
              >
                Schedule Plan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation — underline style, minimal */}
      <div className="flex items-center gap-6 border-b border-border mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 pb-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-foreground-dim hover:text-foreground-secondary"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs tabular-nums ${
                activeTab === tab.id ? "text-foreground-secondary" : "text-foreground-dim"
              }`}>
                {tab.count}
              </span>
            )}
            {/* Active indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
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

      {activeTab === "members" && (
        <GroupMembersTab members={members} />
      )}

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

      {/* Schedule Plan Modal */}
      <GroupSchedulePlanModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={group.id}
      />
    </div>
  );
}
