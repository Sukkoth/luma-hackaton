"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Shield, ShieldCheck } from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";

export type GroupMembersTabProps = {
  members: ReadonlyArray<GroupMemberSummary>;
};

export function GroupMembersTab({ members }: GroupMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Fellowship Directory ({members.length})
          </h2>
          <p className="text-xs text-foreground-dim mt-0.5">
            Readers, teachers, and admins participating in this community.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 text-foreground-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full h-10 rounded-xl border border-border bg-surface-elevated pl-9 pr-3.5 text-xs text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Members Multi-Column Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-10 text-center bg-surface-elevated/30">
          <Search className="size-8 text-foreground-dim mb-2" />
          <p className="text-sm font-semibold text-foreground">No members found</p>
          <p className="text-xs text-foreground-dim mt-1">
            Try adjusting your search query for name or email.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filtered.map((member) => {
            const initials = member.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const isOwner = member.role === "owner";
            const isAdmin = member.role === "admin";
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
                className="ui-card flex items-center justify-between p-4 transition-all duration-150 hover:border-border-strong hover:shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-xs font-semibold text-foreground overflow-hidden shadow-2xs">
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

                  <div className="truncate">
                    <span className="font-semibold text-foreground block text-xs truncate">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-foreground-dim block">
                      Joined {joinedStr}
                    </span>
                  </div>
                </div>

                {/* Role Badge */}
                <div className="shrink-0 ml-2">
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2.5 py-1 text-[10px] font-semibold text-foreground border border-border">
                      <Shield className="size-3" />
                      Owner
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-elevated px-2.5 py-1 text-[10px] font-medium text-foreground-secondary border border-border">
                      <ShieldCheck className="size-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-surface-elevated text-foreground-dim px-2.5 py-1 text-[10px] font-medium border border-border">
                      Member
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
