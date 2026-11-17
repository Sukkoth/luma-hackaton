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
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-foreground-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members…"
            className="w-full h-9 rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-border-strong transition-all"
          />
        </div>
        <span className="text-xs text-foreground-dim">
          {filtered.length} of {members.length}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-foreground-dim">No members found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
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
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-elevated/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-border text-xs font-medium text-foreground overflow-hidden">
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

                  <div className="truncate">
                    <span className="text-sm font-medium text-foreground block truncate">
                      {member.name}
                    </span>
                    <span className="text-xs text-foreground-dim block">
                      Joined {joinedStr}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  {isOwner ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground-secondary">
                      <Shield className="size-3" />
                      Owner
                    </span>
                  ) : isAdmin ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground-dim">
                      <ShieldCheck className="size-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs text-foreground-dim">
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
