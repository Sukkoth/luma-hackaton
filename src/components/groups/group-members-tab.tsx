"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import { Search, Shield, ShieldCheck, UserCheck, UserX, Lock, UserPlus } from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";
import {
  approveMemberAction,
  rejectMemberAction,
  removeMemberAction,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupMembersTabProps = {
  groupId: string;
  members: ReadonlyArray<GroupMemberSummary>;
  pendingMembers: ReadonlyArray<GroupMemberSummary>;
  isAdmin?: boolean;
  isMember?: boolean;
  onJoinClick?: () => void;
};

export function GroupMembersTab({
  groupId,
  members,
  pendingMembers,
  isAdmin = false,
  isMember = true,
  onJoinClick,
}: GroupMembersTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useQueryState(
    "memberSearch",
    parseAsString.withDefault("")
  );
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<GroupMemberSummary | null>(
    null
  );
  const [isKicking, setIsKicking] = useState(false);

  async function handleConfirmKick() {
    if (!memberToKick) return;
    setIsKicking(true);
    try {
      const res = await removeMemberAction({
        groupId,
        targetUserId: memberToKick.userId,
      });
      if (res.success) {
        setMemberToKick(null);
        router.refresh();
      } else {
        alert(res.error || "Failed to remove member.");
      }
    } finally {
      setIsKicking(false);
    }
  }

  async function handleApprove(userId: string) {
    setLoadingUserId(userId);
    try {
      await approveMemberAction({ groupId, targetUserId: userId });
      router.refresh();
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleReject(userId: string) {
    setLoadingUserId(userId);
    try {
      await rejectMemberAction({ groupId, targetUserId: userId });
      router.refresh();
    } finally {
      setLoadingUserId(null);
    }
  }

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-10 sm:p-14 text-center max-w-xl mx-auto my-4 shadow-xs">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-4 shadow-2xs">
          <Lock className="size-6" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
          Member Directory is Private
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 max-w-sm">
          You have to join this fellowship to see the list of members, connect with fellow readers, and walk through Scripture together.
        </p>
        {onJoinClick && (
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={onJoinClick}
            leftIcon={<UserPlus className="size-4" />}
            className="rounded-xl font-semibold shadow-xs"
          >
            Join this Group
          </Button>
        )}
      </div>
    );
  }

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Pending Join Requests (Admins / Owner Only) ── */}
      {isAdmin && pendingMembers.length > 0 && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
              <UserCheck className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Pending Join Requests ({pendingMembers.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Readers who requested to join this fellowship cohort and require approval.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
            {pendingMembers.map((member) => {
              const initials = member.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={member.userId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-semibold text-foreground overflow-hidden shadow-2xs">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={36}
                          height={36}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground block text-xs sm:text-sm truncate">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleReject(member.userId)}
                      className="h-8 text-xs"
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleApprove(member.userId)}
                      className="h-8 text-xs"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Active Members Section ── */}
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Fellowship Directory
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {members.length} {members.length === 1 ? "reader" : "readers"} enrolled in this cohort
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-9 rounded-xl border border-border bg-background pl-9 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Members Roster */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/20">
            <p className="text-sm font-semibold text-foreground">No members found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60 shadow-xs">
            {filtered.map((member) => {
              const initials = member.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const isOwner = member.role === "owner";
              const isAdminRole = member.role === "admin";
              const joinedStr = new Date(member.joinedAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs sm:text-sm font-semibold text-foreground overflow-hidden shadow-2xs">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={40}
                          height={40}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {member.name}
                        </span>
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
                            <Shield className="size-3" />
                            Owner
                          </span>
                        ) : isAdminRole ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
                            <ShieldCheck className="size-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground shrink-0">
                            Member
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-right text-xs text-muted-foreground hidden sm:inline">
                      Joined {joinedStr}
                    </span>
                    {isAdmin && !isOwner && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberToKick(member)}
                        className="text-muted-foreground hover:text-destructive hover:border-destructive/40 text-xs transition-colors shrink-0 px-2.5 sm:px-3 h-8"
                        leftIcon={<UserX className="size-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Remove / Kick Member Confirmation Modal */}
      {memberToKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-5 sm:p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <UserX className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Remove Member?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove &ldquo;{memberToKick.name}&rdquo; from this fellowship? They will lose access to cohort plans and reading accountability.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMemberToKick(null)}
                disabled={isKicking}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isKicking}
                onClick={handleConfirmKick}
                className="flex-1"
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
