"use client";

import { useState } from "react";
import Image from "next/image";
import { Users, Search, Shield, ShieldCheck } from "lucide-react";
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
    <div className="space-y-5">
      {/* Search Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Fellowship Directory ({members.length})
          </h2>
          <p className="text-xs text-foreground-dim">
            Readers, teachers, and admins participating in this community.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 text-foreground-dim absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full rounded-xl border border-border bg-surface-elevated pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-dim focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
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
              className="flex items-center justify-between p-4 text-xs hover:bg-surface-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-surface-elevated border border-border text-xs font-semibold text-foreground overflow-hidden">
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

                <div>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                    {member.name}
                  </span>
                  <span className="text-[11px] text-foreground-dim block">
                    Joined {joinedStr}
                  </span>
                </div>
              </div>

              {/* Role Badge */}
              <div>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border">
                    <Shield className="size-3" />
                    Owner
                  </span>
                ) : isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-foreground-secondary border border-border">
                    <ShieldCheck className="size-3" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-foreground-dim border border-border">
                    Member
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
