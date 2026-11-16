"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Copy,
  Check,
  Shield,
  ShieldCheck,
  UserX,
  UserCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Globe,
} from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";
import {
  approveMemberAction,
  rejectMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
  updateGroupSettingsAction,
  deleteGroupAction,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";

export type GroupAdminTabProps = {
  groupId: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  inviteCode: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  isOwner: boolean;
  members: ReadonlyArray<GroupMemberSummary>;
  pendingMembers: ReadonlyArray<GroupMemberSummary>;
};

export function GroupAdminTab({
  groupId,
  name,
  description,
  avatarUrl,
  inviteCode,
  isPrivate: initialIsPrivate,
  requiresApproval: initialRequiresApproval,
  isOwner,
  members,
  pendingMembers,
}: GroupAdminTabProps) {
  const router = useRouter();

  // Invite link state
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  // Group settings state
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [requiresApproval, setRequiresApproval] = useState(
    initialRequiresApproval
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // Member management state
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const inviteLink = `${origin}/groups/join/${inviteCode}`;

  function handleCopyInvite() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  async function handleRoleChange(
    userId: string,
    newRole: "owner" | "admin" | "member"
  ) {
    setLoadingUserId(userId);
    try {
      await updateMemberRoleAction({ groupId, targetUserId: userId, newRole });
      router.refresh();
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setLoadingUserId(userId);
    try {
      await removeMemberAction({ groupId, targetUserId: userId });
      router.refresh();
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage(null);

    const formData = new FormData(e.currentTarget);
    const updatedName = String(formData.get("name") || "").trim();
    const updatedDesc = String(formData.get("description") || "").trim();
    const updatedAvatar = String(formData.get("avatarUrl") || "").trim();

    try {
      const res = await updateGroupSettingsAction({
        groupId,
        name: updatedName,
        description: updatedDesc,
        avatarUrl: updatedAvatar || undefined,
        isPrivate,
        requiresApproval,
      });

      if (res.success) {
        setSettingsMessage("Fellowship settings saved successfully.");
        router.refresh();
      } else {
        setSettingsMessage(res.error || "Failed to save settings.");
      }
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleDeleteGroup() {
    setIsDeleting(true);
    try {
      const res = await deleteGroupAction({ groupId });
      if (res.success) {
        router.push("/groups");
        router.refresh();
      } else {
        alert(res.error || "Failed to delete group.");
        setIsDeleting(false);
      }
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Pending Approvals Queue */}
      {pendingMembers.length > 0 && (
        <section className="ui-card-elevated p-5 sm:p-6 space-y-4 border-warning/30">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-warning/10 text-warning border border-warning/20">
              <UserCheck className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Pending Join Requests ({pendingMembers.length})
              </h3>
              <p className="text-xs text-foreground-dim">
                Review users requesting to join this fellowship.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {pendingMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-foreground block">
                    {member.name}
                  </span>
                  <span className="text-[11px] text-foreground-dim block">
                    {member.email}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
            ))}
          </div>
        </section>
      )}

      {/* 2. Invite Link Controls */}
      <section className="ui-card-elevated p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Fellowship Invitation Link
          </h3>
          <p className="text-xs text-foreground-dim mt-0.5">
            Share this link to invite church members or study partners directly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex-1 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-mono text-foreground truncate select-all">
            {inviteLink}
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCopyInvite}
            leftIcon={
              copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />
            }
          >
            {copied ? "Copied Link" : "Copy Link"}
          </Button>
        </div>
      </section>

      {/* 3. Member Directory & Role Controls */}
      <section className="ui-card-elevated p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Member Role Management
          </h3>
          <p className="text-xs text-foreground-dim mt-0.5">
            Assign administrators to schedule plans and moderate members.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
          {members.map((member) => {
            const isTargetOwner = member.role === "owner";
            const isTargetAdmin = member.role === "admin";

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3.5 text-xs"
              >
                <div>
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    {member.name}
                    {isTargetOwner && (
                      <span className="rounded-sm bg-primary/10 text-foreground px-1.5 py-0.2 text-[10px] font-bold border border-primary/20">
                        Owner
                      </span>
                    )}
                    {isTargetAdmin && (
                      <span className="rounded-sm bg-surface-elevated text-foreground-secondary px-1.5 py-0.2 text-[10px] font-medium border border-border">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-foreground-dim block">
                    {member.email}
                  </span>
                </div>

                {!isTargetOwner && (
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <select
                        value={member.role}
                        disabled={loadingUserId === member.userId}
                        onChange={(e) =>
                          handleRoleChange(
                            member.userId,
                            e.target.value as "owner" | "admin" | "member"
                          )
                        }
                        className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-xs text-foreground focus:outline-hidden"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Transfer Ownership</option>
                      </select>
                    )}

                    <button
                      type="button"
                      disabled={loadingUserId === member.userId}
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-1.5 rounded-lg text-foreground-dim hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <UserX className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Fellowship Profile & Privacy Settings */}
      <section className="ui-card-elevated p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Fellowship Profile Settings
          </h3>
          <p className="text-xs text-foreground-dim mt-0.5">
            Update title, description, and accessibility options.
          </p>
        </div>

        {settingsMessage && (
          <div className="rounded-xl border border-border bg-surface p-3 text-xs text-foreground">
            {settingsMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label
              htmlFor="edit-group-name"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Group Name
            </label>
            <input
              id="edit-group-name"
              name="name"
              type="text"
              defaultValue={name}
              required
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group-desc"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Description
            </label>
            <textarea
              id="edit-group-desc"
              name="description"
              rows={3}
              defaultValue={description}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group-avatar"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Avatar Image URL
            </label>
            <input
              id="edit-group-avatar"
              name="avatarUrl"
              type="url"
              defaultValue={avatarUrl || ""}
              placeholder="https://..."
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
            <div>
              <span className="text-xs font-medium text-foreground block">
                Private Fellowship
              </span>
              <span className="text-[11px] text-foreground-dim block">
                Only people with the invite link can view and join.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="size-4.5 rounded-lg border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
          </div>

          {/* Approval Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface">
            <div>
              <span className="text-xs font-medium text-foreground block">
                Require Admin Approval
              </span>
              <span className="text-[11px] text-foreground-dim block">
                New join requests must be approved by an admin.
              </span>
            </div>
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => setRequiresApproval(e.target.checked)}
              className="size-4.5 rounded-lg border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingSettings}
            >
              Save Fellowship Settings
            </Button>
          </div>
        </form>
      </section>

      {/* 5. Danger Zone (Owner Only) */}
      {isOwner && (
        <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="size-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Permanently delete this fellowship and cancel all scheduled cohort plans.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="size-3.5" />}
          >
            Delete Fellowship
          </Button>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="ui-card max-w-sm w-full p-6 space-y-4 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <AlertTriangle className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Delete Fellowship?
            </h4>
            <p className="text-xs text-foreground-secondary">
              Are you sure you want to delete &quot;{name}&quot;? All members will be unlinked and scheduled group plans will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteGroup}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
