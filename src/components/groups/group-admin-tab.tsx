"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  UserX,
  Trash2,
  QrCode,
  ArrowRightLeft,
} from "lucide-react";
import type { GroupMemberSummary } from "@/actions/groups";
import {
  updateMemberRoleAction,
  removeMemberAction,
  updateGroupSettingsAction,
} from "@/actions/groups";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupInviteModal } from "@/components/groups/group-invite-modal";
import { GroupTransferOwnershipModal } from "@/components/groups/group-transfer-ownership-modal";
import { GroupDeleteModal } from "@/components/groups/group-delete-modal";

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
    newRole: "admin" | "member"
  ) {
    setLoadingUserId(userId);
    try {
      await updateMemberRoleAction({
        groupId,
        targetUserId: userId,
        newRole,
      });
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



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left Column: General Fellowship Settings ── */}
      <section className="ui-card p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Fellowship Settings
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update name, description, and join accessibility.
          </p>
        </div>

        {settingsMessage && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary font-medium">
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
              className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
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
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all resize-none"
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
              className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Privacy & Approval Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Private Fellowship
                </span>
                <span className="text-xs text-muted-foreground block">
                  Only users with the invite link can view and join.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="size-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Require Admin Approval
                </span>
                <span className="text-xs text-muted-foreground block">
                  New join requests must be approved by an administrator.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="size-4.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="default"
              size="sm"
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
        <section className="ui-card p-5 sm:p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Fellowship Invitation Link
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Share this link to invite members directly to this fellowship.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground truncate select-all">
              {inviteLink}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
                leftIcon={<QrCode className="size-3.5" />}
              >
                QR Code
              </Button>
              <Button
                type="button"
                variant="default"
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
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </section>

        {/* Member Roles & Permissions */}
        <section className="ui-card p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Member Roles &amp; Permissions
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage member roles and permissions.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden max-h-[300px] overflow-y-auto">
            {members.map((member) => {
              const isTargetOwner = member.role === "owner";
              const isTargetAdmin = member.role === "admin";

              return (
                <div
                  key={member.userId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 text-xs gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground block truncate">
                      {member.name}
                    </span>
                    <span className="text-xs text-muted-foreground block truncate">
                      {member.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isTargetOwner ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                        Owner
                      </span>
                    ) : (
                      <>
                        {isOwner && (
                          <Select
                            value={member.role}
                            disabled={loadingUserId === member.userId}
                            onValueChange={(val) =>
                              handleRoleChange(
                                member.userId,
                                val as "admin" | "member"
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-[95px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {!isOwner && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground border border-border">
                            {isTargetAdmin ? "Admin" : "Member"}
                          </span>
                        )}

                        {(!isTargetAdmin || isOwner) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={loadingUserId === member.userId}
                            onClick={() => setMemberToRemove(member)}
                            className="text-muted-foreground hover:text-destructive text-xs h-8 px-2"
                            title="Remove Member"
                          >
                            <UserX className="size-3.5" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Danger Zone: Ownership Transfer & Deletion (Owner Only) ── */}
        {isOwner && (
          <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-destructive">
                Danger Zone
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Irreversible actions for fellowship management and data deletion.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
                leftIcon={<ArrowRightLeft className="size-3.5" />}
                className="w-full sm:w-auto text-xs"
              >
                Transfer Ownership
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="size-3.5" />}
                className="w-full sm:w-auto text-xs"
              >
                Delete Fellowship
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Delete Group Modal */}
      <GroupDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        groupId={groupId}
        groupName={name}
      />

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="rounded-2xl border border-border bg-card max-w-sm w-full p-5 sm:p-6 space-y-4 text-center shadow-lg">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mx-auto border border-destructive/20">
              <UserX className="size-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              Remove Member?
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Remove &ldquo;{memberToRemove.name}&rdquo; from this fellowship? They will lose access to cohort plans and reading accountability.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMemberToRemove(null)}
                disabled={loadingUserId === memberToRemove.userId}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                isLoading={loadingUserId === memberToRemove.userId}
                onClick={handleConfirmRemoveMember}
                className="flex-1"
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      <GroupTransferOwnershipModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        groupId={groupId}
        groupName={name}
        members={members}
        currentOwnerId={members.find((m) => m.role === "owner")?.userId || ""}
      />

      {/* Invite QR Modal */}
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
