"use client";

import { useState } from "react";
import { Pin, Clock, Edit3, User, Sparkles } from "lucide-react";
import type { GroupPinnedNotice } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupPinnedBulletinProps = {
  groupId: string;
  notice: GroupPinnedNotice | null;
  isAdmin: boolean;
  onOpenNoticeModal: () => void;
};

function formatRemainingTime({
  expiresAtIso,
  nowTimestamp,
}: {
  expiresAtIso: string;
  nowTimestamp: number;
}): string {
  const diffMs = new Date(expiresAtIso).getTime() - nowTimestamp;
  if (diffMs <= 0) return "Expired";
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) return `Expires in ${days} days`;
  if (days === 1) return "Expires tomorrow";
  if (hours > 1) return `Expires in ${hours} hours`;
  if (hours === 1) return "Expires in 1 hour";
  if (minutes > 1) return `Expires in ${minutes} minutes`;
  return "Expires soon";
}

function renderContentWithLinks({ content }: { content: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return parts.map((part, idx) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={`link-${idx}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary transition-colors break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={`text-${idx}`}>{part}</span>;
  });
}

export function GroupPinnedBulletin({
  notice,
  isAdmin,
  onOpenNoticeModal,
}: GroupPinnedBulletinProps) {
  const [mountTimestamp] = useState(() => Date.now());

  const remainingLabel = notice?.expiresAt
    ? formatRemainingTime({
        expiresAtIso: notice.expiresAt,
        nowTimestamp: mountTimestamp,
      })
    : null;

  // If there is no active notice:
  if (!notice) {
    if (!isAdmin) return null;

    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 transition-colors hover:border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground border border-border">
            <Pin className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              No active bulletin announcement
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Pin a timed notice for upcoming cohort meetings, prayer points, or
              reading goals.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenNoticeModal}
          leftIcon={<Pin className="size-3.5" />}
          className="shrink-0 text-xs"
        >
          Pin Announcement
        </Button>
      </div>
    );
  }

  return (
    <div className="ui-card relative overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 shadow-xs transition-all">
      {/* Top Header: Badge, Expiration countdown, and Admin Edit button */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 border border-primary/25 px-2.5 py-1 text-xs font-semibold text-primary">
            <Pin className="size-3.5 rotate-45" />
            <span>Pinned Bulletin</span>
          </span>

          {remainingLabel && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
              <Clock className="size-3" />
              <span>{remainingLabel}</span>
            </span>
          )}
        </div>

        {isAdmin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onOpenNoticeModal}
            leftIcon={<Edit3 className="size-3.5 text-muted-foreground" />}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0 h-8 px-2.5"
          >
            Edit
          </Button>
        )}
      </div>

      {/* Main Notice Body */}
      <div className="mt-3.5 space-y-2">
        {notice.title && (
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            {notice.title}
          </h3>
        )}

        <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {renderContentWithLinks({ content: notice.content })}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
        <span className="flex items-center gap-1">
          <User className="size-3" />
          <span>
            {notice.authorName
              ? `Posted by ${notice.authorName}`
              : "Posted by Leader"}
          </span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-primary" />
          <span>Scripture Fellowship Announcement</span>
        </span>
      </div>
    </div>
  );
}
