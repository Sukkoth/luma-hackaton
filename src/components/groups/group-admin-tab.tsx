"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  UserX,
  UserCheck,
  Trash2,
  AlertTriangle,
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

  const [copied, setCopied] = useState(false);
  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : ""
  );

  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [requiresApproval, setRequiresApproval] = useState(
    initialRequiresApproval
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

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
        setSettingsMessage("Settings saved.");
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
    <div className="max-w-2xl space-y-8">
      {/* ── Invite Link ── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Invite Link
        </h3>
        <p className="text-xs text-foreground-dim mb-3">
          Share to invite members directly.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs font-mono text-foreground truncate select-all">
            {inviteLink}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyInvite}
            leftIcon={
              copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </section>

      {/* ── Pending Approvals ── */}
      {pendingMembers.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <UserCheck className="size-4 text-warning" />
            Pending Requests ({pendingMembers.length})
          </h3>
          <p className="text-xs text-foreground-dim mb-3">
            Review users requesting to join.
          </p>

          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {pendingMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground block">
                    {member.name}
                  </span>
                  <span className="text-xs text-foreground-dim block">
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

      {/* ── Group Settings ── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Fellowship Settings
        </h3>
        <p className="text-xs text-foreground-dim mb-4">
          Update name, description, and access controls.
        </p>

        {settingsMessage && (
          <div className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-xs text-foreground mb-4">
            {settingsMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label
              htmlFor="edit-group-name"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Name
            </label>
            <input
              id="edit-group-name"
              name="name"
              type="text"
              defaultValue={name}
              required
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-border-strong transition-all"
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
              className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-border-strong transition-all resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group-avatar"
              className="block text-xs font-medium text-foreground mb-1.5"
            >
              Avatar URL
            </label>
            <input
              id="edit-group-avatar"
              name="avatarUrl"
              type="url"
              defaultValue={avatarUrl || ""}
              placeholder="https://…"
              className="w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-border-strong transition-all"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-elevated/30 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Private
                </span>
                <span className="text-xs text-foreground-dim block">
                  Only people with the invite link can join.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-surface-elevated/30 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground block">
                  Require Approval
                </span>
                <span className="text-xs text-foreground-dim block">
                  New requests need admin approval.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingSettings}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </section>

      {/* ── Member Roles ── */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Member Roles
        </h3>
        <p className="text-xs text-foreground-dim mb-3">
          Manage roles and permissions.
        </p>

        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border max-h-[380px] overflow-y-auto">
          {members.map((member) => {
            const isTargetOwner = member.role === "owner";
            const isTargetAdmin = member.role === "admin";

            return (
              <div
                key={member.userId}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-medium text-foreground flex items-center gap-2 truncate">
                    {member.name}
                    {isTargetOwner && (
                      <span className="text-[10px] font-medium text-foreground-dim shrink-0">
                        Owner
                      </span>
                    )}
                    {isTargetAdmin && (
                      <span className="text-[10px] font-medium text-foreground-dim shrink-0">
                        Admin
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-foreground-dim block truncate">
                    {member.email}
                  </span>
                </div>

                {!isTargetOwner && (
                  <div className="flex items-center gap-2 shrink-0">
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
                        className="h-8 rounded-lg border border-border bg-surface-elevated px-2 text-xs text-foreground focus:outline-hidden"
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

      {/* ── Danger Zone ── */}
      {isOwner && (
        <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-1.5 mb-1">
            <AlertTriangle className="size-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-foreground-secondary mb-3">
            Permanently delete this fellowship and unenroll all members.
          </p>

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

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto">
              <AlertTriangle className="size-6" />
            </div>
            <h4 className="text-base font-semibold text-foreground">
              Delete &quot;{name}&quot;?
            </h4>
            <p className="text-sm text-foreground-secondary">
              All members will be unlinked and scheduled plans permanently removed.
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
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
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
