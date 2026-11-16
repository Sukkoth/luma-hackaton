"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Plus,
  KeyRound,
  Search,
  Calendar,
  Globe,
  Clock,
  ArrowRight,
  Shield,
} from "lucide-react";
import type { UserGroupSummary } from "@/actions/groups";
import { searchPublicGroupsAction } from "@/actions/groups";
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
  const [activeTab, setActiveTab] = useState<"my" | "explore">("my");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);

  // Search state for Explore tab
  const [searchQuery, setSearchQuery] = useState("");
  const [publicGroups, setPublicGroups] = useState(initialPublicGroups);
  const [isSearching, setIsSearching] = useState(false);

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

  const totalActivePlans = myGroups.reduce(
    (acc, g) => acc + g.activePlansCount,
    0
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Highlights Banner */}
      <div className="ui-card flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-surface-elevated text-foreground border border-border">
              <Users className="size-4 text-foreground" />
            </span>
            <span className="text-[12px] font-bold text-foreground-secondary uppercase tracking-wider">
              Community Fellowships • Cohort Reading
            </span>
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[24px]">
            Read Scripture Together in Community
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground-secondary">
            Synchronize your reading journey with church cohorts, small groups, and friends with shared daily pacing and community reflections.
          </p>
        </div>

        {/* Quick Fellowship Stats & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-2 text-center sm:text-left min-w-[100px]">
              <span className="text-[10px] font-semibold text-foreground-dim uppercase tracking-wider block">
                Fellowships
              </span>
              <span className="text-lg font-bold text-foreground">
                {myGroups.length}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated px-4 py-2 text-center sm:text-left min-w-[100px]">
              <span className="text-[10px] font-semibold text-foreground-dim uppercase tracking-wider block">
                Active Plans
              </span>
              <span className="text-lg font-bold text-foreground">
                {totalActivePlans}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsJoinCodeOpen(true)}
              leftIcon={<KeyRound className="size-3.5" />}
            >
              Join with Code
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="size-3.5" />}
            >
              Create Fellowship
            </Button>
          </div>
        </div>
      </div>

      {/* Main Fellowships & Explorer Section */}
      <section className="ui-card rounded-[22px] p-5 sm:p-6 space-y-5">
        {/* Navigation Tabs - Segmented control matching PlanCatalog */}
        <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-[16px] border border-border bg-surface-elevated p-1 overflow-x-auto scrollbar-none w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "my"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Users className="size-3.5" />
              <span>My Fellowships ({myGroups.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("explore")}
              className={`shrink-0 flex items-center gap-1.5 rounded-[12px] px-3.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                activeTab === "explore"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              <Globe className="size-3.5" />
              <span>Explore Public Fellowships</span>
            </button>
          </div>
        </div>

        {/* Tab 1: My Fellowships */}
        {activeTab === "my" && (
          <div>
            {myGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-surface-elevated/40 p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-surface text-foreground-dim border border-border mb-4">
                  <Users className="size-7 text-foreground" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No fellowships joined yet
                </h3>
                <p className="text-xs text-foreground-secondary max-w-md mb-6 leading-relaxed">
                  Connect with your local church, small group, or family circle to read scripture on a shared schedule and discuss daily sessions.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsJoinCodeOpen(true)}
                    leftIcon={<KeyRound className="size-3.5" />}
                  >
                    Enter Invite Code
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                    leftIcon={<Plus className="size-3.5" />}
                  >
                    Create Fellowship
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                      className={`ui-card group relative isolate flex flex-col justify-between p-5 transition-all duration-150 hover:border-border-strong ${
                        isPending ? "opacity-75 cursor-default" : "cursor-pointer"
                      }`}
                    >
                      <div>
                        {/* Top Meta Row */}
                        <div className="flex items-start justify-between gap-3 mb-3.5">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-sm font-semibold text-foreground overflow-hidden">
                            {group.avatarUrl ? (
                              <Image
                                src={group.avatarUrl}
                                alt={group.name}
                                width={44}
                                height={44}
                                className="size-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          {/* Role Tag */}
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-warning/10 text-warning px-2.5 py-0.5 text-[11px] font-medium border border-warning/20">
                              <Clock className="size-3" />
                              Pending Approval
                            </span>
                          ) : isOwner ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-0.5 text-[11px] font-semibold text-foreground border border-border">
                              <Shield className="size-3" />
                              Owner
                            </span>
                          ) : isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary border border-border">
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground-dim border border-border">
                              Member
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-[15px] font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                          {group.name}
                        </h3>
                        <p className="mt-1 text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                          {group.description || "No description provided."}
                        </p>
                      </div>

                      {/* Bottom Meta */}
                      <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-foreground-dim">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <Users className="size-3.5 text-foreground-secondary" />
                            <span>{group.memberCount} members</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-foreground-secondary" />
                            <span>
                              {group.activePlansCount}{" "}
                              {group.activePlansCount === 1 ? "plan" : "plans"}
                            </span>
                          </span>
                        </div>

                        {!isPending && (
                          <ArrowRight className="size-3.5 text-foreground-dim group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Explore Public Fellowships */}
        {activeTab === "explore" && (
          <div className="space-y-5">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="size-4 text-foreground-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fellowships by name..."
                  className="w-full rounded-xl border border-border bg-surface-elevated pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                isLoading={isSearching}
              >
                Search
              </Button>
            </form>

            {publicGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-surface-elevated/40 p-12 text-center">
                <Globe className="size-10 text-foreground-dim mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  No public fellowships found
                </h3>
                <p className="text-xs text-foreground-secondary max-w-sm mb-4">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {publicGroups.map((g) => (
                  <div
                    key={g.id}
                    className="ui-card group relative isolate flex flex-col justify-between p-5 transition-all duration-150 hover:border-border-strong"
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
                        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-foreground-secondary border border-border">
                          <Users className="size-3" />
                          {g.memberCount} members
                        </span>
                      </div>

                      <h3 className="text-[15px] font-semibold text-foreground line-clamp-1">
                        {g.name}
                      </h3>
                      <p className="mt-1 text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                        {g.description || "Public community fellowship."}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border-subtle flex items-center justify-between">
                      {g.requiresApproval ? (
                        <span className="text-[11px] text-foreground-dim flex items-center gap-1">
                          <Shield className="size-3 text-warning" />
                          Approval required
                        </span>
                      ) : (
                        <span />
                      )}

                      {g.isEnrolled ? (
                        <Link
                          href={`/groups/${g.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
                        >
                          Open Fellowship <ArrowRight className="size-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/groups/join/${g.id}`}
                          className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-[10px] bg-primary text-primary-foreground hover:opacity-90 transition-all ml-auto"
                        >
                          {g.requiresApproval ? "Request to Join" : "Join Fellowship"}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

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
