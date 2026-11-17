"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldCheck, UserCheck, UserX } from "lucide-react";
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
};

export function GroupMembersTab({
  groupId,
  members,
  pendingMembers,
  isAdmin = false,
}: GroupMembersTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
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

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ── Pending Join Requests (Admins / Owner Only) ── */}
      {isAdmin && pendingMembers.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-surface-elevated text-foreground border border-border shadow-2xs">
              <UserCheck className="size-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Pending Join Requests ({pendingMembers.length})
              </h3>
              <p className="text-xs text-foreground-dim mt-0.5">
                Readers who requested to join this fellowship cohort and require approval.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-elevated/30 divide-y divide-border overflow-hidden">
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
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-xs font-semibold text-foreground overflow-hidden shadow-2xs">
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
                      <span className="text-[11px] text-foreground-dim block truncate">
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
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleApprove(member.userId)}
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
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Fellowship Directory
            </h3>
            <p className="text-xs text-foreground-dim mt-0.5">
              {members.length} {members.length === 1 ? "reader" : "readers"} enrolled in this cohort
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 text-foreground-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-10 rounded-xl border border-border bg-surface pl-9 pr-3.5 text-xs text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-foreground transition-all"
            />
          </div>
        </div>

        {/* Members Roster */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-surface-elevated/20">
            <p className="text-sm font-semibold text-foreground">No members found</p>
            <p className="text-xs text-foreground-dim mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border shadow-2xs">
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
                  className="flex items-center justify-between p-3.5 sm:p-5 hover:bg-surface-elevated/40 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-surface-elevated border border-border text-xs sm:text-sm font-semibold text-foreground overflow-hidden shadow-2xs">
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={44}
                          height={44}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-semibold text-foreground text-xs sm:text-sm truncate">
                          {member.name}
                        </span>
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-elevated px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[10.5px] font-semibold text-foreground border border-border shrink-0">
                            <Shield className="size-3 text-foreground-dim" />
                            Owner
                          </span>
                        ) : isAdminRole ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-elevated px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[10.5px] font-medium text-foreground-secondary border border-border shrink-0">
                            <ShieldCheck className="size-3 text-foreground-dim" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-surface-elevated px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[10.5px] font-medium text-foreground-dim border border-border shrink-0">
                            Member
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-foreground-dim block mt-0.5 truncate">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-right text-xs text-foreground-dim hidden sm:inline">
                      Joined {joinedStr}
                    </span>
                    {isAdmin && !isOwner && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMemberToKick(member)}
                        className="text-foreground-dim hover:text-destructive hover:border-destructive/40 text-xs transition-colors shrink-0 px-2.5 sm:px-3 h-8"
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
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <UserX className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Remove Member?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to remove &ldquo;{memberToKick.name}&rdquo; from this fellowship? They will lose access to cohort plans and reading accountability.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMemberToKick(null)}
                disabled={isKicking}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isKicking}
                onClick={handleConfirmKick}
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
