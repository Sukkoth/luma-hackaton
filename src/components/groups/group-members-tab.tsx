"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString } from "nuqs";
import {
  Calendar,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";
import {
  approveMemberAction,
  rejectMemberAction,
  removeMemberAction,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

function getInitials({ name }: { name: string }): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_SORT_ORDER: Record<string, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

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
        toast.success("Member removed from fellowship.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to remove member.");
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
          You have to join this fellowship to see the list of members, connect
          with fellow readers, and walk through Scripture together.
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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filtered = members
    .filter(
      (m) =>
        m.name.toLowerCase().includes(normalizedQuery) ||
        m.email.toLowerCase().includes(normalizedQuery)
    )
    .slice()
    .sort(
      (a, b) => (ROLE_SORT_ORDER[a.role] ?? 2) - (ROLE_SORT_ORDER[b.role] ?? 2)
    );

  return (
    <div className="space-y-6">
      {/* ── Pending Join Requests (Admins / Owner Only) ── */}
      {isAdmin && pendingMembers.length > 0 && (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                <UserCheck className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Pending Join Requests ({pendingMembers.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Readers awaiting approval to join this fellowship.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingMembers.map((member) => {
              const initials = getInitials({ name: member.name });

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 gap-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 border border-border text-xs font-bold text-foreground overflow-hidden">
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
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground block text-xs sm:text-sm truncate">
                        {member.name}
                      </span>
                      {member.email ? (
                        <span className="text-xs text-muted-foreground block truncate">
                          {member.email}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleReject(member.userId)}
                      className="h-8 text-xs px-2.5"
                    >
                      Reject
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleApprove(member.userId)}
                      className="h-8 text-xs px-3"
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
        {/* Search & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Fellowship Directory
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {members.length} {members.length === 1 ? "reader" : "readers"}{" "}
              enrolled in this cohort
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAdmin ? "Search by name or email..." : "Search readers..."
              }
              aria-label="Search fellowship members"
              className="w-full h-9.5 rounded-xl border border-border bg-card pl-9 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 focus:border-primary shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Members Roster */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/20">
            <p className="text-sm font-semibold text-foreground">
              No members found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((member) => {
              const initials = getInitials({ name: member.name });
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
                  className={`group flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-all shadow-2xs hover:shadow-xs ${
                    isOwner
                      ? "border-primary/25 bg-primary/[0.03] hover:border-primary/40"
                      : "border-border/80 bg-card hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold overflow-hidden ${
                          isOwner || isAdminRole
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted/80 text-foreground border-border"
                        }`}
                      >
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm truncate">
                            {member.name}
                          </span>
                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 border border-primary/25 px-2 py-0.5 text-[11px] font-semibold text-primary shrink-0">
                              <Shield className="size-3" />
                              Owner
                            </span>
                          ) : isAdminRole ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground shrink-0">
                              <ShieldCheck className="size-3 text-primary" />
                              Admin
                            </span>
                          ) : null}
                        </div>

                        {member.email ? (
                          <span className="text-xs text-muted-foreground block mt-0.5 truncate">
                            {member.email}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {isAdmin && !isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToKick(member)}
                        aria-label={`Remove ${member.name}`}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all shrink-0"
                        leftIcon={<UserX className="size-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3 opacity-75" />
                      <span>Joined {joinedStr}</span>
                    </span>
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
              Are you sure you want to remove &ldquo;{memberToKick.name}&rdquo;
              from this fellowship? They will lose access to cohort plans and
              reading accountability.
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
