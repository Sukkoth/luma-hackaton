"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Settings,
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  ArrowLeft,
  BookOpen,
  Trophy,
  Share2,
  LogOut,
  Pin,
} from "lucide-react";
import type {
  GroupDetails,
  GroupMemberSummary,
  LeaderboardEntry,
  GroupPlanSummary,
} from "@/actions/groups";
import { leaveGroupAction } from "@/actions/groups";
import type { UserTrackerSummary } from "@/actions/trackers";
import { GroupPlansTab } from "@/components/groups/group-plans-tab";
import { GroupLeaderboardTab } from "@/components/groups/group-leaderboard-tab";
import { GroupMembersTab } from "@/components/groups/group-members-tab";
import { GroupAdminTab } from "@/components/groups/group-admin-tab";
import { GroupSchedulePlanModal } from "@/components/groups/group-schedule-plan-modal";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { GroupPinnedBulletin } from "@/components/groups/group-pinned-bulletin";
import { GroupPinnedNoticeModal } from "@/components/groups/group-pinned-notice-modal";
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "plans" | "leaderboard" | "members" | "admin"
  >("plans");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [selectedPlanForEnroll, setSelectedPlanForEnroll] =
    useState<GroupPlanSummary | null>(null);

  const isOwner = group.currentUserRole === "owner";
  const isAdmin = isOwner || group.currentUserRole === "admin";

  async function handleConfirmLeaveGroup() {
    setIsLeavingGroup(true);
    try {
      const res = await leaveGroupAction({ groupId: group.id });
      if (res.success) {
        router.push("/groups");
        router.refresh();
      } else {
        alert(res.error || "Failed to leave fellowship.");
        setIsLeavingGroup(false);
      }
    } catch {
      setIsLeavingGroup(false);
    }
  }

  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-full max-w-full space-y-8 animate-in fade-in duration-150 overflow-x-hidden">
      {/* ── Top Bar: Back Link & Context ── */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-xs font-medium text-foreground-dim hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>All Fellowships</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary border border-border">
            {group.isPrivate ? (
              <>
                <Lock className="size-3 text-foreground-dim" />
                <span>Private</span>
              </>
            ) : (
              <>
                <Globe className="size-3 text-foreground-dim" />
                <span>Open</span>
              </>
            )}
          </span>

          {isOwner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground border border-border">
              <Shield className="size-3 text-foreground-dim" />
              <span>Owner</span>
            </span>
          ) : isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary border border-border">
              <ShieldCheck className="size-3 text-foreground-dim" />
              <span>Admin</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Group Header (Clean, Editorial, Full-Width) ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4 sm:gap-5 min-w-0">
          {/* Group Avatar */}
          <div className="relative flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-base sm:text-lg font-semibold text-foreground overflow-hidden shadow-2xs">
            {group.avatarUrl ? (
              <Image
                src={group.avatarUrl}
                alt={group.name}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            ) : (
              <span className="tracking-wide">{initials}</span>
            )}
          </div>

          <div className="min-w-0 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {group.name}
            </h1>

            {group.description && (
              <p className="text-sm text-foreground-secondary max-w-2xl leading-relaxed">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs text-foreground-dim">
              <span>{group.memberCount} {group.memberCount === 1 ? "member" : "members"}</span>
              <span className="text-foreground-dim/40">•</span>
              <span>{group.activePlans.length} active {group.activePlans.length === 1 ? "plan" : "plans"}</span>
              {group.scheduledPlans.length > 0 && (
                <>
                  <span className="text-foreground-dim/40">•</span>
                  <span>{group.scheduledPlans.length} scheduled</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0 self-start lg:self-center">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<Share2 className="size-4" />}
            className="w-full sm:w-auto justify-center"
          >
            Invite
          </Button>

          {!isOwner && group.currentUserRole && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsLeaveGroupModalOpen(true)}
              leftIcon={<LogOut className="size-4 text-foreground-dim" />}
              className="w-full sm:w-auto justify-center"
            >
              Leave
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsNoticeModalOpen(true)}
                leftIcon={<Pin className="size-4 text-foreground-dim" />}
                className="w-full sm:w-auto justify-center"
              >
                {group.pinnedNotice ? "Edit Bulletin" : "Pin Bulletin"}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setIsScheduleModalOpen(true)}
                leftIcon={<Calendar className="size-4" />}
                className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center font-semibold"
              >
                Schedule Plan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Pinned Fellowship Bulletin (Timed Notice) ── */}
      <GroupPinnedBulletin
        groupId={group.id}
        notice={group.pinnedNotice}
        isAdmin={isAdmin}
        onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
      />

      {/* ── Standalone Tabs (Single Responsibility Architecture) ── */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-border overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1">
        {/* Tab 1: Plans */}
        <button
          type="button"
          onClick={() => setActiveTab("plans")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "plans"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-foreground-dim hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Plans</span>
        </button>

        {/* Tab 2: Leaderboard (Dedicated Accountability & Circle Tab) */}
        <button
          type="button"
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "leaderboard"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-foreground-dim hover:text-foreground"
          }`}
        >
          <Trophy className="size-4" />
          <span>Leaderboard</span>
        </button>

        {/* Tab 3: Members Directory */}
        <button
          type="button"
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "members"
              ? "border-foreground text-foreground font-semibold"
              : "border-transparent text-foreground-dim hover:text-foreground"
          }`}
        >
          <Users className="size-4" />
          <span>Members</span>
        </button>

        {/* Tab 4: Administration / Settings (Admins Only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all cursor-pointer shrink-0 ${
              activeTab === "admin"
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-foreground-dim hover:text-foreground"
            }`}
          >
            <Settings className="size-4" />
            <span>Settings</span>
          </button>
        )}
      </div>

      {/* ── Active Tab Display ── */}
      <div>
        {/* Tab 1: Plans */}
        {activeTab === "plans" && (
          <GroupPlansTab
            groupId={group.id}
            activePlans={group.activePlans}
            scheduledPlans={group.scheduledPlans}
            completedPlans={group.completedPlans}
            trackers={trackers}
            activeTrackerId={activeTrackerId}
            isAdmin={isAdmin}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            selectedPlanForEnroll={selectedPlanForEnroll}
            onSelectPlanForEnroll={setSelectedPlanForEnroll}
          />
        )}

        {/* Tab 2: Leaderboard */}
        {activeTab === "leaderboard" && (
          <GroupLeaderboardTab
            groupId={group.id}
            activePlans={group.activePlans}
            leaderboardsByPlanId={leaderboardsByPlanId}
            currentUserHideProgress={group.currentUserHideProgress}
            currentUserPrivacyUpdatedAt={group.currentUserPrivacyUpdatedAt}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onCopyInvite={() => setIsInviteModalOpen(true)}
            onSelectPlanForEnroll={(plan) => {
              setSelectedPlanForEnroll(plan);
              setActiveTab("plans");
            }}
          />
        )}

        {/* Tab 3: Members */}
        {activeTab === "members" && (
          <GroupMembersTab
            groupId={group.id}
            members={members}
            pendingMembers={pendingMembers}
            isAdmin={isAdmin}
          />
        )}

        {/* Tab 4: Admin Settings */}
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
          />
        )}
      </div>

      {/* Schedule Plan Modal */}
      <GroupSchedulePlanModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={group.id}
      />

      {/* Fellowship Invitation & QR Code Modal */}
      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
        initialInviteCode={group.inviteCode}
        isAdmin={isAdmin}
      />

      {/* Pinned Bulletin Notice Modal */}
      <GroupPinnedNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        groupId={group.id}
        initialNotice={group.pinnedNotice}
      />

      {/* Leave Fellowship Confirmation Modal */}
      {isLeaveGroupModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-5 sm:p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <LogOut className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Leave Fellowship?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to leave &ldquo;{group.name}&rdquo;? You will be unenrolled from all cohort reading plans and will need an invite code to rejoin.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsLeaveGroupModalOpen(false)}
                disabled={isLeavingGroup}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
                isLoading={isLeavingGroup}
                onClick={handleConfirmLeaveGroup}
                className="flex-1"
              >
                Confirm &amp; Leave
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
