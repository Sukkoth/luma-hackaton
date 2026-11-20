"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsStringLiteral } from "nuqs";
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
  UserPlus,
  Clock,
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
import { GroupJoinConfirmModal } from "@/components/groups/group-join-confirm-modal";
import { Button } from "@/components/ui/button";
import { TabsBar } from "@/components/ui/tabs-bar";
import { toast } from "@/components/ui/sonner";

export type GroupWorkspaceViewProps = {
  group: GroupDetails;
  members: ReadonlyArray<GroupMemberSummary>;
  pendingMembers: ReadonlyArray<GroupMemberSummary>;
  leaderboardsByPlanId: Record<string, ReadonlyArray<LeaderboardEntry>>;
  trackers: ReadonlyArray<UserTrackerSummary>;
  activeTrackerId?: string;
};

const WORKSPACE_TABS = ["plans", "leaderboard", "members", "admin"] as const;
type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export function GroupWorkspaceView({
  group,
  members,
  pendingMembers,
  leaderboardsByPlanId,
  trackers,
  activeTrackerId,
}: GroupWorkspaceViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useQueryState<WorkspaceTab>(
    "tab",
    parseAsStringLiteral(WORKSPACE_TABS).withDefault("plans")
  );
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [selectedPlanForEnroll, setSelectedPlanForEnroll] =
    useState<GroupPlanSummary | null>(null);

  const isOwner = group.currentUserRole === "owner";
  const isAdmin = isOwner || group.currentUserRole === "admin";
  const isMember = Boolean(group.currentUserRole);
  const isPending = group.currentUserMembershipStatus === "pending_approval";
  const isNotJoined = !isMember && !isPending;
  const canInvite = !group.isPrivate || isAdmin;

  async function handleConfirmLeaveGroup() {
    setIsLeavingGroup(true);
    try {
      const res = await leaveGroupAction({ groupId: group.id });
      if (res.success) {
        toast.success("You have left the fellowship.");
        router.push("/groups");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to leave fellowship.");
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
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-200 overflow-x-hidden">
      {/* ── Top Bar: Back Link & Context Badges ── */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>All Fellowships</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border shadow-2xs">
            {group.isPrivate ? (
              <>
                <Lock className="size-3 text-muted-foreground" />
                <span>Private Fellowship</span>
              </>
            ) : (
              <>
                <Globe className="size-3 text-primary" />
                <span>Open Access</span>
              </>
            )}
          </span>

          {isOwner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
              <Shield className="size-3" />
              <span>Owner</span>
            </span>
          ) : isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3" />
              <span>Admin</span>
            </span>
          ) : isMember ? (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              Member
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Clock className="size-3" />
              <span>Pending</span>
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border/50">
              Guest View
            </span>
          )}
        </div>
      </div>

      {/* ── Fellowship Masthead (Warm Sanctuary Hero) ── */}
      <section className="relative rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {/* Group Avatar */}
            <div className="relative flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-base sm:text-lg font-bold text-primary overflow-hidden shadow-2xs">
              {group.avatarUrl ? (
                <Image
                  src={group.avatarUrl}
                  alt={group.name}
                  width={64}
                  height={64}
                  className="size-full object-cover"
                />
              ) : (
                <span className="tracking-wide font-bold">{initials}</span>
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {group.name}
              </h1>

              {group.description && (
                <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {group.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="size-3.5 text-primary" />
                  <span>
                    {group.memberCount}{" "}
                    {group.memberCount === 1 ? "member" : "members"}
                  </span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen className="size-3.5 text-primary" />
                  <span>
                    {group.activePlans.length} active{" "}
                    {group.activePlans.length === 1 ? "plan" : "plans"}
                  </span>
                </span>
                {group.scheduledPlans.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      <span>{group.scheduledPlans.length} scheduled</span>
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="font-medium text-foreground/80">
                  Synchronized Pace
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons - Single clear action focal point */}
          <div className="shrink-0 self-start lg:self-center">
            {isNotJoined ? (
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={() => setIsJoinModalOpen(true)}
                  leftIcon={<UserPlus className="size-4" />}
                  className="h-10 px-5 font-semibold shadow-xs rounded-xl"
                >
                  Join this Group
                </Button>
                <span className="text-xs text-muted-foreground">
                  Free to join • Read in lockstep
                </span>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-start lg:items-end gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  disabled
                  leftIcon={<Clock className="size-3.5" />}
                  className="h-10 px-4 rounded-xl"
                >
                  Pending Approval
                </Button>
                <span className="text-xs text-muted-foreground">
                  Request sent to leaders
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {canInvite && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(true)}
                    leftIcon={<Share2 className="size-3.5" />}
                    className="rounded-xl h-9"
                  >
                    Invite
                  </Button>
                )}

                {!isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLeaveGroupModalOpen(true)}
                    leftIcon={
                      <LogOut className="size-3.5 text-muted-foreground" />
                    }
                    className="rounded-xl h-9 text-muted-foreground hover:text-destructive"
                  >
                    Leave
                  </Button>
                )}

                {isAdmin && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNoticeModalOpen(true)}
                      leftIcon={
                        <Pin className="size-3.5 text-muted-foreground" />
                      }
                      className="rounded-xl h-9"
                    >
                      {group.pinnedNotice ? "Edit Bulletin" : "Pin Bulletin"}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => setIsScheduleModalOpen(true)}
                      leftIcon={<Calendar className="size-3.5" />}
                      className="rounded-xl h-9 font-semibold shadow-xs"
                    >
                      Schedule Plan
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Pinned Fellowship Bulletin (Timed Notice) ── */}
      <GroupPinnedBulletin
        groupId={group.id}
        notice={group.pinnedNotice}
        isAdmin={isAdmin}
        onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
      />

      {/* ── Standalone Tabs ── */}
      <TabsBar
        tabs={[
          {
            id: "plans",
            label: `Plans (${group.activePlans.length})`,
            icon: <BookOpen className="size-3.5" />,
          },
          {
            id: "leaderboard",
            label: "Leaderboard",
            icon: <Trophy className="size-3.5" />,
          },
          {
            id: "members",
            label: `Members (${group.memberCount})`,
            icon: <Users className="size-3.5" />,
          },
          ...(isAdmin
            ? [
                {
                  id: "admin" as const,
                  label: "Settings",
                  icon: <Settings className="size-3.5" />,
                },
              ]
            : []),
        ]}
        activeTab={activeTab}
        onTabChange={({ tab }) => void setActiveTab(tab)}
      />

      {/* ── Active Tab Display ── */}
      <section className="w-full space-y-6 pt-1">
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
            isMember={isMember}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            selectedPlanForEnroll={selectedPlanForEnroll}
            onSelectPlanForEnroll={setSelectedPlanForEnroll}
            onJoinGroupClick={() => setIsJoinModalOpen(true)}
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
            isMember={isMember}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onCopyInvite={
              canInvite ? () => setIsInviteModalOpen(true) : undefined
            }
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
            isMember={isMember}
            onJoinClick={() => setIsJoinModalOpen(true)}
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
      </section>

      {/* ── Modals ── */}
      <GroupSchedulePlanModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        groupId={group.id}
      />

      {canInvite && (
        <GroupInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={group.id}
          groupName={group.name}
          initialInviteCode={group.inviteCode}
          isAdmin={isAdmin}
        />
      )}

      <GroupPinnedNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        groupId={group.id}
        initialNotice={group.pinnedNotice}
      />

      {/* Leave Fellowship Confirmation Modal */}
      {isLeaveGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-5 sm:p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <LogOut className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Leave Fellowship?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to leave &ldquo;{group.name}&rdquo;? You
              will be unenrolled from all cohort reading plans and will need an
              invite code to rejoin.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeaveGroupModalOpen(false)}
                disabled={isLeavingGroup}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
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
      {/* Join Fellowship Multi-Step Onboarding Modal */}
      <GroupJoinConfirmModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          avatarUrl: group.avatarUrl,
          memberCount: group.memberCount,
          requiresApproval: group.requiresApproval,
          inviteCode: group.inviteCode,
          activePlans: group.activePlans,
          scheduledPlans: group.scheduledPlans,
        }}
        trackers={trackers}
        activeTrackerId={activeTrackerId}
        onCompleted={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
