"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQueryState, parseAsString, parseAsStringLiteral } from "nuqs";
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
  ShieldCheck,
  BookOpen,
  Compass,
  X,
  Check,
  Lock,
} from "lucide-react";
import type { UserGroupSummary } from "@/actions/groups";
import { searchPublicGroupsAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { TabsBar } from "@/components/ui/tabs-bar";
import { FilterPills } from "@/components/ui/filter-pills";
import { CreateGroupModal } from "@/components/groups/create-group-modal";
import { JoinCodeModal } from "@/components/groups/join-code-modal";
import { cn } from "@/lib/utils";

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

const GROUP_FILTERS = [
  "all",
  "active_plans",
  "leading",
  "pending",
  "open",
  "approval_required",
] as const;
type GroupFilterType = (typeof GROUP_FILTERS)[number];

const HUB_TABS = ["my", "explore"] as const;
type HubTab = (typeof HUB_TABS)[number];

export function GroupsHubView({
  myGroups,
  initialPublicGroups,
}: GroupsHubViewProps) {
  const [activeTab, setActiveTab] = useQueryState<HubTab>(
    "tab",
    parseAsStringLiteral(HUB_TABS).withDefault("my")
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);

  // Search & Filter state via nuqs for URL persistence
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [filter, setFilter] = useQueryState<GroupFilterType>(
    "filter",
    parseAsStringLiteral(GROUP_FILTERS).withDefault("all")
  );
  const [searchedGroups, setSearchedGroups] = useState<typeof initialPublicGroups | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  const publicGroups =
    searchQuery.trim() && searchedGroups !== null
      ? searchedGroups
      : initialPublicGroups;

  useEffect(() => {
    if (activeTab === "explore" && searchQuery.trim()) {
      let isCancelled = false;
      startSearchTransition(async () => {
        const res = await searchPublicGroupsAction({ query: searchQuery });
        if (!isCancelled && res.success && res.groups) {
          setSearchedGroups(res.groups);
        }
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [activeTab, searchQuery]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchedGroups(null);
      return;
    }
    startSearchTransition(async () => {
      const res = await searchPublicGroupsAction({ query: searchQuery });
      if (res.success && res.groups) {
        setSearchedGroups(res.groups);
      }
    });
  }

  function handleClearSearch() {
    setSearchQuery("");
    setSearchedGroups(null);
  }

  // Filtered lists
  const filteredMyGroups = useMemo(() => {
    return myGroups.filter((group) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(q);
        const matchesDesc = group.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      if (filter === "active_plans") return group.activePlansCount > 0;
      if (filter === "leading") return group.role === "owner" || group.role === "admin";
      if (filter === "pending") return group.status === "pending_approval";
      return true;
    });
  }, [myGroups, searchQuery, filter]);

  const filteredPublicGroups = useMemo(() => {
    return publicGroups.filter((group) => {
      if (filter === "open") return !group.requiresApproval;
      if (filter === "approval_required") return group.requiresApproval;
      return true;
    });
  }, [publicGroups, filter]);

  const totalActivePlans = myGroups.reduce(
    (acc, g) => acc + g.activePlansCount,
    0
  );

  const totalCohortMembers = myGroups.reduce(
    (acc, g) => acc + g.memberCount,
    0
  );

  // Community preview stack
  const previewGroups = useMemo(() => {
    const combined = [...myGroups, ...initialPublicGroups];
    const seen = new Set<string>();
    const unique = [];
    for (const g of combined) {
      if (!seen.has(g.name)) {
        seen.add(g.name);
        unique.push(g);
      }
      if (unique.length >= 4) break;
    }
    return unique;
  }, [myGroups, initialPublicGroups]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* ── Unboxed Editorial Masthead ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Scripture Fellowships & Circles</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            Walk through Scripture, together.
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Synchronize daily reading cadences with your church, small group, or family. Share chapter reflections and keep pace together.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setIsJoinCodeOpen(true)}
            leftIcon={<KeyRound className="size-4" />}
            className="rounded-xl font-medium"
          >
            Join with Code
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="size-4" />}
            className="rounded-xl font-semibold shadow-xs"
          >
            Create Fellowship
          </Button>
        </div>
      </section>

      {/* ── Signature Community Horizon Ribbon ── */}
      <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Column 1: Synchronized Cadence */}
          <div className="pr-0 md:pr-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-semibold text-foreground">
                  Synchronized Pace
                </span>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                Daily Cadence
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {totalActivePlans}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {totalActivePlans === 1 ? "Active Plan" : "Active Plans"} in lockstep
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {myGroups.length > 0
                  ? "Your fellowships share chapter milestones and daily discussion points."
                  : "Join or launch a fellowship to read chapters on a communal schedule."}
              </p>
            </div>

            {/* Communal Rhythm Gauge */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Cohort synchrony</span>
                <span className="text-primary font-medium">
                  {myGroups.length > 0 ? "Active in stride" : "Open for enrollment"}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: myGroups.length > 0 ? "80%" : "25%" }}
                />
              </div>
            </div>
          </div>

          {/* Column 2: Fellowship Circle */}
          <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Fellowship Circle
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextTab = activeTab === "my" ? "explore" : "my";
                  setActiveTab(nextTab);
                  setFilter("all");
                }}
                className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                {activeTab === "my"
                  ? `Explore public (${publicGroups.length}) →`
                  : `My fellowships (${myGroups.length}) →`}
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {myGroups.length}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {myGroups.length === 1 ? "Circle" : "Circles"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {totalCohortMembers} {totalCohortMembers === 1 ? "reader" : "readers"} walking in community
              </p>
            </div>

            {/* Overlapping Reader Avatars */}
            {previewGroups.length > 0 && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex -space-x-2 overflow-hidden shrink-0">
                  {previewGroups.map((g, idx) => (
                    <div
                      key={g.name + idx}
                      className="inline-flex size-7 rounded-full ring-2 ring-card bg-muted text-[10px] font-bold text-foreground overflow-hidden items-center justify-center shrink-0"
                    >
                      {g.avatarUrl ? (
                        <Image
                          src={g.avatarUrl}
                          alt={g.name}
                          width={28}
                          height={28}
                          className="size-full object-cover"
                        />
                      ) : (
                        <span>{g.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground truncate">
                  United in the Word
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Catalog & Fellowships Section (Matching PlanCatalog layout) ── */}
      <section className="ui-card p-5 sm:p-6 space-y-5">
        {/* Navigation Tabs and Search Bar */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
          {/* Tab Switcher - Segmented control */}
          <TabsBar
            containerTestId="groups-hub-tabs"
            tabs={[
              {
                id: "my",
                label: `My Fellowships (${myGroups.length})`,
                icon: <Users className="size-3.5" />,
              },
              {
                id: "explore",
                label: `Explore Public (${publicGroups.length})`,
                icon: <Globe className="size-3.5" />,
              },
            ]}
            activeTab={activeTab}
            onTabChange={({ tab }) => {
              setActiveTab(tab);
              setFilter("all");
            }}
          />

          {/* Search Input on Right */}
          <div className="relative w-full sm:w-72">
            {activeTab === "explore" ? (
              <form onSubmit={handleSearch} className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search public fellowships..."
                    className="w-full rounded-xl border border-border bg-background py-1.5 pr-8 pl-8.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  isLoading={isSearching}
                  className="h-8 px-2.5 text-xs"
                >
                  Search
                </Button>
              </form>
            ) : (
              <div className="relative w-full">
                <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter my fellowships..."
                  className="w-full rounded-xl border border-border bg-background py-1.5 pr-8 pl-8.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills Row */}
        <FilterPills
          items={
            activeTab === "my"
              ? [
                  { id: "all", label: `All (${myGroups.length})` },
                  { id: "active_plans", label: "With Active Plans" },
                  { id: "leading", label: "Leader / Admin" },
                  { id: "pending", label: "Pending Approval" },
                ]
              : [
                  { id: "all", label: "All Fellowships" },
                  { id: "open", label: "Open Access" },
                  { id: "approval_required", label: "Approval Required" },
                ]
          }
          activeFilter={filter}
          onFilterChange={({ filter: nextFilter }) => setFilter(nextFilter)}
        />

        {/* ── Tab 1: My Fellowships Grid (Exact PlanCard Architecture) ── */}
        {activeTab === "my" && (
          <div>
            {filteredMyGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-4">
                  <Users className="size-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {myGroups.length === 0
                    ? "No fellowships joined yet"
                    : "No fellowships match your filter"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                  {myGroups.length === 0
                    ? "Connect with your local church, small group, or family circle to read scripture on a shared schedule and discuss daily sessions."
                    : "Try adjusting your search query or reset the filter pills above."}
                </p>
                {myGroups.length === 0 ? (
                  <div className="flex items-center gap-2">
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
                      variant="default"
                      size="sm"
                      onClick={() => setIsCreateOpen(true)}
                      leftIcon={<Plus className="size-3.5" />}
                    >
                      Create Fellowship
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filteredMyGroups.map((group) => {
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
                      className={cn(
                        "ui-card group relative isolate flex flex-col justify-between p-5 transition-all duration-150 hover:border-border-strong",
                        isPending ? "opacity-75 cursor-default" : "cursor-pointer"
                      )}
                    >
                      <div>
                        {/* Top Header Row (Exact PlanCard Style) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                              Fellowship
                            </span>
                            {isPending ? (
                              <span className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                <Clock className="size-3" />
                                <span>Pending</span>
                              </span>
                            ) : isOwner ? (
                              <span className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                <Shield className="size-3" />
                                <span>Owner</span>
                              </span>
                            ) : isAdmin ? (
                              <span className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                <ShieldCheck className="size-3" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                Member
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              <span>{group.memberCount}</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="size-3" />
                              <span>{group.activePlansCount} active</span>
                            </span>
                          </div>
                        </div>

                        {/* Avatar & Title & Subtitle */}
                        <div className="mt-3 flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-bold text-foreground overflow-hidden">
                            {group.avatarUrl ? (
                              <Image
                                src={group.avatarUrl}
                                alt={group.name}
                                width={40}
                                height={40}
                                className="size-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {group.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {group.description || "Community Bible reading fellowship and accountability circle."}
                            </p>
                          </div>
                        </div>

                        {/* Capabilities Strip (Exact PlanCard Pill Styles: px-2 py-1 text-xs font-medium) */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          {group.activePlansCount > 0 ? (
                            <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary font-medium">
                              <Calendar className="size-3" />
                              <span>{group.activePlansCount} Active Plan{group.activePlansCount > 1 ? "s" : ""}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                              <Clock className="size-3" />
                              <span>No Active Plans</span>
                            </span>
                          )}

                          <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground font-medium">
                            <Compass className="size-3" />
                            <span>Shared Pace</span>
                          </span>

                          <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            <span>{group.memberCount} {group.memberCount === 1 ? "reader" : "readers"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Row (Exact PlanCard Style) */}
                      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Role
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {isPending
                              ? "Pending Approval"
                              : isOwner
                              ? "Owner"
                              : isAdmin
                              ? "Admin"
                              : "Member"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isPending && (
                            <span className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs group-hover:opacity-90 transition-opacity">
                              <span>Open</span>
                              <ArrowRight className="size-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Explore Public Fellowships Grid (Exact PlanCard Architecture) ── */}
        {activeTab === "explore" && (
          <div>
            {filteredPublicGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-4">
                  <Globe className="size-7" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No public fellowships found
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Try a different search term or create a public fellowship for your community to join.
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  leftIcon={<Plus className="size-3.5" />}
                >
                  Create Fellowship
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {filteredPublicGroups.map((group) => {
                  const initials = group.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={group.id}
                      className="ui-card group relative isolate flex flex-col justify-between p-5 transition-all duration-150 hover:border-border-strong"
                    >
                      <div>
                        {/* Top Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {group.isEnrolled ? (
                              <span className="flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                                <Check className="size-3" />
                                <span>Joined</span>
                              </span>
                            ) : group.requiresApproval ? (
                              <span className="flex items-center gap-1 rounded-lg bg-muted border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                <Lock className="size-3" />
                                <span>Approval Req.</span>
                              </span>
                            ) : (
                              <span className="rounded-lg bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                Public
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <Users className="size-3" />
                            <span>{group.memberCount} members</span>
                          </div>
                        </div>

                        {/* Avatar & Title & Subtitle */}
                        <div className="mt-3 flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted border border-border text-xs font-bold text-foreground overflow-hidden">
                            {group.avatarUrl ? (
                              <Image
                                src={group.avatarUrl}
                                alt={group.name}
                                width={40}
                                height={40}
                                className="size-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold tracking-tight text-foreground line-clamp-1">
                              {group.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {group.description || "Public Bible reading fellowship open to community members."}
                            </p>
                          </div>
                        </div>

                        {/* Capabilities Strip (Exact PlanCard Pill Styles) */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary font-medium">
                            <Globe className="size-3" />
                            <span>{group.requiresApproval ? "Approval Required" : "Open Access"}</span>
                          </span>

                          <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground font-medium">
                            <Compass className="size-3" />
                            <span>Shared Pace</span>
                          </span>

                          <span className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            <span>{group.memberCount} {group.memberCount === 1 ? "reader" : "readers"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Row (Exact PlanCard Style) */}
                      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Membership
                          </span>
                          <span className="text-xs font-semibold text-foreground">
                            {group.isEnrolled ? "Joined" : "Not Joined"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {group.isEnrolled ? (
                            <Link
                              href={`/groups/${group.id}`}
                              className="flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:opacity-90 transition-opacity"
                            >
                              <span>Open</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          ) : (
                            <Link
                              href={`/groups/${group.id}`}
                              className="flex items-center gap-1 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                            >
                              <span>View</span>
                              <ArrowRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Fellowship Modals ── */}
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
