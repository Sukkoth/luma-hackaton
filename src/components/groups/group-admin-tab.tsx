"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  UserX,
  Trash2,
  AlertTriangle,
  QrCode,
  ArrowRightLeft,
} from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";
import {
  updateMemberRoleAction,
  removeMemberAction,
  updateGroupSettingsAction,
  deleteGroupAction,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { GroupTransferOwnershipModal } from "@/components/groups/group-transfer-ownership-modal";

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
}: GroupAdminTabProps) {
  const router = useRouter();

  // Invite link state
  const [copied, setCopied] = useState(false);
  const [origin] = useState(() =>
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
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberSummary | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transfer ownership modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Invite & QR modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const inviteLink = `${origin}/groups/join/${inviteCode}`;

  function handleCopyInvite() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  async function handleConfirmRemoveMember() {
    if (!memberToRemove) return;
    setLoadingUserId(memberToRemove.userId);
    try {
      await removeMemberAction({
        groupId,
        targetUserId: memberToRemove.userId,
      });
      setMemberToRemove(null);
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
        setSettingsMessage("Settings saved successfully.");
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ── Left Column: Fellowship Settings Form ── */}
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-7 space-y-5 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Fellowship Settings
          </h3>
          <p className="text-xs text-foreground-dim mt-0.5">
            Update name, description, and join accessibility.
          </p>
        </div>

        {settingsMessage && (
          <div className="rounded-xl border border-border bg-surface-elevated p-3 text-xs text-foreground">
            {settingsMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div>
            <label
              htmlFor="edit-group-name"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Group Name
            </label>
            <input
              id="edit-group-name"
              name="name"
              type="text"
              defaultValue={name}
              required
              className="w-full h-10 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-foreground transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group-desc"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Description
            </label>
            <textarea
              id="edit-group-desc"
              name="description"
              rows={3}
              defaultValue={description}
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-foreground transition-all resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group-avatar"
              className="block text-xs font-semibold text-foreground mb-1.5"
            >
              Avatar Image URL
            </label>
            <input
              id="edit-group-avatar"
              name="avatarUrl"
              type="url"
              defaultValue={avatarUrl || ""}
              placeholder="https://..."
              className="w-full h-10 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-foreground transition-all"
            />
          </div>

          {/* Privacy & Approval Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-elevated/40">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Private Fellowship
                </span>
                <span className="text-[11.5px] text-foreground-dim block">
                  Only users with the invite link can view and join.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="size-4.5 rounded border-border text-foreground focus:ring-foreground cursor-pointer accent-foreground"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-elevated/40">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Require Admin Approval
                </span>
                <span className="text-[11.5px] text-foreground-dim block">
                  New join requests must be approved by an administrator.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="size-4.5 rounded border-border text-foreground focus:ring-foreground cursor-pointer accent-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSavingSettings}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </section>

      {/* ── Right Column: Invite Link, Member Roles & Danger Zone ── */}
      <div className="space-y-6">
        {/* Invite Link Card */}
        <section className="rounded-2xl border border-border bg-surface p-6 space-y-3 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Fellowship Invitation Link
            </h3>
            <p className="text-xs text-foreground-dim mt-0.5">
              Share this link to invite members directly to this fellowship.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1 rounded-xl border border-border bg-surface-elevated px-3.5 sm:px-4 py-2 text-xs font-mono text-foreground truncate select-all">
              {inviteLink}
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsInviteModalOpen(true)}
                leftIcon={<QrCode className="size-4" />}
                className="w-full sm:w-auto justify-center"
              >
                QR Code
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleCopyInvite}
                leftIcon={
                  copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )
                }
                className="w-full sm:w-auto justify-center"
              >
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </section>

        {/* Member Roles & Permissions */}
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-6 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Member Roles &amp; Permissions
            </h3>
            <p className="text-xs text-foreground-dim mt-0.5">
              Manage member roles and permissions.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden max-h-[350px] overflow-y-auto">
            {members.map((member) => {
              const isTargetOwner = member.role === "owner";
              const isTargetAdmin = member.role === "admin";

              return (
                <div
                  key={member.userId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 text-xs gap-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground flex items-center gap-2 truncate">
                      <span className="truncate">{member.name}</span>
                      {isTargetOwner && (
                        <span className="rounded-sm bg-surface-elevated text-foreground px-1.5 py-0.2 text-[9.5px] font-bold border border-border shrink-0">
                          Owner
                        </span>
                      )}
                      {isTargetAdmin && (
                        <span className="rounded-sm bg-surface-elevated text-foreground-secondary px-1.5 py-0.2 text-[9.5px] font-medium border border-border shrink-0">
                          Admin
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-foreground-dim block truncate">
                      {member.email}
                    </span>
                  </div>

                  {!isTargetOwner && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto">
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
                          className="h-9 rounded-lg border border-border bg-surface-elevated px-2.5 text-xs text-foreground focus:outline-hidden flex-1 sm:flex-none cursor-pointer"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Transfer Ownership</option>
                        </select>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loadingUserId === member.userId}
                        onClick={() => setMemberToRemove(member)}
                        className="text-foreground-dim hover:text-destructive hover:border-destructive/40 text-xs transition-colors shrink-0"
                        leftIcon={<UserX className="size-3.5" />}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Transfer Ownership (Owner Only) */}
        {isOwner && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                <ArrowRightLeft className="size-4" />
                <span>Transfer Fellowship Ownership</span>
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Transfer primary ownership to another active member. You will remain in the fellowship as an Administrator.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsTransferModalOpen(true)}
              leftIcon={<ArrowRightLeft className="size-4" />}
            >
              Transfer Ownership
            </Button>
          </section>
        )}

        {/* Danger Zone */}
        {isOwner && (
          <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                <span>Danger Zone</span>
              </h3>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Permanently delete this fellowship and unenroll all members.
              </p>
            </div>

            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={() => setIsDeleteModalOpen(true)}
              leftIcon={<Trash2 className="size-4" />}
            >
              Delete Fellowship
            </Button>
          </section>
        )}
      </div>

      {/* Transfer Ownership Modal */}
      {isOwner && (
        <GroupTransferOwnershipModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          groupId={groupId}
          groupName={name}
          members={members}
          currentOwnerId={members.find((m) => m.role === "owner")?.userId || ""}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
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
                size="md"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="md"
                isLoading={isDeleting}
                onClick={handleDeleteGroup}
                className="flex-1"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-surface max-w-sm w-full p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <UserX className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Remove Member?
            </h4>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              Are you sure you want to remove &quot;{memberToRemove.name}&quot; from this fellowship? They will lose access to cohort plans and reading accountability.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(null)}
                disabled={loadingUserId !== null}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={loadingUserId === memberToRemove.userId}
                onClick={handleConfirmRemoveMember}
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Fellowship Invitation & QR Code Modal */}
      <GroupInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={groupId}
        groupName={name}
        initialInviteCode={inviteCode}
        isAdmin={true}
      />
    </div>
  );
}
