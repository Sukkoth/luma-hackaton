"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users, Lock, Globe, ShieldAlert, ArrowLeft, CheckCircle2 } from "lucide-react";
import { joinGroupAction } from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupJoinLandingClientProps = {
  groupId: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  inviteCode: string;
  memberCount: number;
  isPrivate: boolean;
  requiresApproval: boolean;
};

export function GroupJoinLandingClient({
  groupId,
  name,
  description,
  avatarUrl,
  inviteCode,
  memberCount,
  isPrivate,
  requiresApproval,
}: GroupJoinLandingClientProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleJoin() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await joinGroupAction({ inviteCode });
      if (!res.success || !res.groupId) {
        setError(res.error || "Failed to join group.");
        setIsSubmitting(false);
        return;
      }

      if (res.status === "pending_approval") {
        setIsPending(true);
      } else {
        setIsJoined(true);
        setTimeout(() => {
          router.push(`/groups/${res.groupId}`);
          router.refresh();
        }, 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join group.");
      setIsSubmitting(false);
    }
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back navigation */}
        <Link
          href="/groups"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-dim hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Fellowships</span>
        </Link>

        {/* Invite Card */}
        <div className="rounded-[28px] border border-border bg-surface p-7 shadow-xl space-y-6 text-center">
          {/* Avatar */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-[24px] bg-surface-elevated border border-border text-2xl font-bold text-foreground overflow-hidden shadow-inner">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={80}
                height={80}
                className="size-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Group Details */}
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-foreground-dim border border-border">
                {isPrivate ? (
                  <>
                    <Lock className="size-3" />
                    Private Group
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Public Group
                  </>
                )}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-foreground-dim border border-border">
                <Users className="size-3" />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {name}
            </h1>
            <p className="mt-2 text-xs text-foreground-dim leading-relaxed">
              {description || "You have been invited to join this community reading fellowship on Luma."}
            </p>
          </div>

          {/* Approval Notice */}
          {requiresApproval && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-left">
              <ShieldAlert className="size-4 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground-secondary leading-snug">
                This fellowship requires admin approval. Once requested, the owner or an admin will review your membership before granting access.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive text-left">
              {error}
            </div>
          )}

          {/* Success State */}
          {isJoined && (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-success animate-in fade-in">
              <CheckCircle2 className="size-4" />
              <span>Joined! Redirecting to fellowship...</span>
            </div>
          )}

          {isPending && (
            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-center space-y-2">
              <p className="text-xs font-semibold text-warning">
                Request Submitted
              </p>
              <p className="text-[11px] text-foreground-secondary">
                Your request is pending review by the group admins. You will see this fellowship on your dashboard once approved.
              </p>
              <Link
                href="/groups"
                className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
              >
                Return to Fellowships
              </Link>
            </div>
          )}

          {/* Action Button */}
          {!isJoined && !isPending && (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              onClick={handleJoin}
            >
              {requiresApproval ? "Request to Join Fellowship" : "Join Fellowship"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
