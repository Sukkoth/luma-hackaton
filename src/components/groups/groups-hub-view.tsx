"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Plus,
  KeyRound,
  Search,
  Calendar,
  Lock,
  Globe,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import type { UserGroupSummary } from "@/actions/groups";
import { searchPublicGroupsAction, joinGroupAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { JoinCodeModal } from "@/components/groups/join-code-modal";

export type GroupsHubViewProps = {
  myGroups: ReadonlyArray<UserGroupSummary>;
  initialPublicGroups: ReadonlyArray<{
    id: string;
    name: string;
    description: string;
    avatarUrl: string | null;
    memberCount: number;
    requiresApproval: boolean;
    isEnrolled: boolean;
  }>;
};

export function GroupsHubView({
  myGroups,
  initialPublicGroups,
}: GroupsHubViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my" | "explore">("my");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);

  // Search state for Explore tab
  const [searchQuery, setSearchQuery] = useState("");
  const [publicGroups, setPublicGroups] = useState(initialPublicGroups);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await searchPublicGroupsAction({ query: searchQuery });
      if (res.success && res.groups) {
        setPublicGroups(res.groups);
      }
    } finally {
      setIsSearching(false);
    }
  }

  async function handleJoinDirect(groupId: string) {
    setJoiningGroupId(groupId);
    try {
      // Find invite code from current public groups list
      const target = publicGroups.find((g) => g.id === groupId);
      if (!target) return;

      const res = await joinGroupAction({ inviteCode: target.id }); // fall back or reload
      if (res.success && res.groupId) {
        router.push(`/groups/${res.groupId}`);
        router.refresh();
      }
    } finally {
      setJoiningGroupId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-surface-elevated text-foreground border border-border">
              <Users className="size-4" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Community Fellowships
            </h1>
          </div>
          <p className="text-xs text-foreground-dim sm:text-sm max-w-2xl">
            Synchronize your reading journey with church cohorts, study groups, and friends with shared daily pacing and discussions.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => setIsJoinCodeOpen(true)}
            leftIcon={<KeyRound className="size-4" />}
          >
            Join with Code
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="size-4" />}
          >
            Create Fellowship
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
            activeTab === "my"
              ? "border-primary text-foreground bg-surface-elevated/40"
              : "border-transparent text-foreground-dim hover:text-foreground"
          }`}
        >
          <Users className="size-3.5" />
          <span>My Fellowships</span>
          <span className="ml-1 rounded-full bg-surface-elevated px-2 py-0.5 text-[11px] font-medium border border-border">
            {myGroups.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("explore")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 ${
            activeTab === "explore"
              ? "border-primary text-foreground bg-surface-elevated/40"
              : "border-transparent text-foreground-dim hover:text-foreground"
          }`}
        >
          <Globe className="size-3.5" />
          <span>Explore Public Groups</span>
        </button>
      </div>

      {/* Tab 1: My Fellowships */}
      {activeTab === "my" && (
        <section aria-label="My Groups">
          {myGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-surface/50 p-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-elevated text-foreground-dim border border-border mb-4">
                <Users className="size-7" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                No fellowships joined yet
              </h3>
              <p className="text-xs text-foreground-dim max-w-md mb-6 leading-relaxed">
                Connect with your local church, small group, or family circle to read scripture on a shared schedule and compare daily notes.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsJoinCodeOpen(true)}
                  leftIcon={<KeyRound className="size-4" />}
                >
                  Enter Invite Code
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setIsCreateOpen(true)}
                  leftIcon={<Plus className="size-4" />}
                >
                  Create Your First Group
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group) => {
                const initials = group.name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const isOwner = group.role === "owner";
                const isAdmin = group.role === "admin";
                const isPending = group.status === "pending_approval";

                return (
                  <Link
                    key={group.id}
                    href={isPending ? "#" : `/groups/${group.id}`}
                    className={`group relative flex flex-col justify-between rounded-[20px] border border-border bg-surface p-5 shadow-xs transition-all hover:border-border-strong hover:bg-surface-elevated/40 ${
                      isPending ? "opacity-75 cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div>
                      {/* Top Row: Avatar & Role Pill */}
                      <div className="flex items-start justify-between gap-3 mb-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-sm font-semibold text-foreground overflow-hidden">
                          {group.avatarUrl ? (
                            <Image
                              src={group.avatarUrl}
                              alt={group.name}
                              width={48}
                              height={48}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        {/* Status / Role Tag */}
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2.5 py-1 text-[11px] font-medium border border-warning/20">
                            <Clock className="size-3" />
                            Pending Approval
                          </span>
                        ) : isOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-foreground px-2.5 py-1 text-[11px] font-semibold border border-primary/20">
                            <Shield className="size-3" />
                            Owner
                          </span>
                        ) : isAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated text-foreground-secondary px-2.5 py-1 text-[11px] font-medium border border-border">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-surface-subtle text-foreground-dim px-2.5 py-1 text-[11px] font-medium border border-border/50">
                            Member
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-xs text-foreground-dim line-clamp-2 leading-relaxed">
                        {group.description || "No description provided."}
                      </p>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-foreground-dim">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          <span>{group.memberCount} members</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          <span>
                            {group.activePlansCount}{" "}
                            {group.activePlansCount === 1 ? "plan" : "plans"}
                          </span>
                        </span>
                      </div>

                      {!isPending && (
                        <ArrowRight className="size-4 text-foreground-dim group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Explore Public Fellowships */}
      {activeTab === "explore" && (
        <section aria-label="Explore Public Fellowships" className="space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="size-4 text-foreground-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fellowships by name..."
                className="w-full rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              isLoading={isSearching}
            >
              Search
            </Button>
          </form>

          {/* Public Groups Grid */}
          {publicGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-surface/50 p-12 text-center">
              <Globe className="size-10 text-foreground-dim mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No public fellowships found
              </h3>
              <p className="text-xs text-foreground-dim max-w-sm mb-4">
                Try searching with another keyword or start your own public fellowship.
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus className="size-3.5" />}
              >
                Create Public Group
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicGroups.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col justify-between rounded-[20px] border border-border bg-surface p-5 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-sm font-semibold text-foreground overflow-hidden">
                        {g.avatarUrl ? (
                          <Image
                            src={g.avatarUrl}
                            alt={g.name}
                            width={44}
                            height={44}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span>{g.name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-foreground-dim border border-border">
                        <Users className="size-3" />
                        {g.memberCount} members
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                      {g.name}
                    </h3>
                    <p className="mt-1 text-xs text-foreground-dim line-clamp-2 leading-relaxed">
                      {g.description || "Public community fellowship."}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                    {g.requiresApproval && (
                      <span className="text-[11px] text-foreground-dim flex items-center gap-1">
                        <Shield className="size-3 text-warning" />
                        Approval required
                      </span>
                    )}

                    {g.isEnrolled ? (
                      <Link
                        href={`/groups/${g.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
                      >
                        Open Group <ArrowRight className="size-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/groups/join/${g.id}`}
                        className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all ml-auto"
                      >
                        {g.requiresApproval ? "Request to Join" : "Join Group"}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <JoinCodeModal
        isOpen={isJoinCodeOpen}
        onClose={() => setIsJoinCodeOpen(false)}
      />
    </div>
  );
}
