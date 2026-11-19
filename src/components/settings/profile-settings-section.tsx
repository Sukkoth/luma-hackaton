"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Mail,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/actions/profile";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerifiedAt?: Date | string | null;
};

type ProfileSettingsSectionProps = {
  user: SettingsUser;
  onSignOut: () => void;
  isSigningOut: boolean;
};

export function ProfileSettingsSection({
  user,
  onSignOut,
  isSigningOut,
}: ProfileSettingsSectionProps) {
  const router = useRouter();

  // Profile update state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password update state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Local avatar preview URL (for immediate visual feedback)
  const [previewImage, setPreviewImage] = useState<string | null>(
    user.image ?? null
  );

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await updateProfileAction({ formData });

      if (result.success) {
        setProfileMessage({
          type: "success",
          text: "Profile updated successfully.",
        });
        setPreviewImage(result.image);
        router.refresh();
      } else {
        setProfileMessage({
          type: "error",
          text: result.error,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await changePasswordAction({ formData });

      if (result.success) {
        setPasswordMessage({
          type: "success",
          text: "Password updated successfully.",
        });
        form.reset();
      } else {
        setPasswordMessage({
          type: "error",
          text: result.error,
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Personal Profile Card ── */}
      <section className="ui-card p-4 sm:p-6 lg:p-7">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Profile Details
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Personal Information
          </span>
        </div>

        {profileMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium border ${
              profileMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="mt-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center sm:items-start gap-2 shrink-0">
              <div className="relative group size-20 sm:size-22 rounded-2xl overflow-hidden border-2 border-border/80 bg-surface-elevated shadow-xs flex items-center justify-center">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt={user.name}
                    width={88}
                    height={88}
                    unoptimized
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                  <Camera className="size-5" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground text-center sm:text-left">
                Avatar Preview
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="flex-1 space-y-4 w-full">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-name"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Display Name</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Visible across your study logs
                  </span>
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  required
                  defaultValue={user.name}
                  placeholder="e.g. Grace Hooper"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {/* Avatar Image URL */}
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-image"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Avatar Image URL</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    Direct image link (HTTPS)
                  </span>
                </label>
                <input
                  id="profile-image"
                  name="image"
                  type="url"
                  defaultValue={user.image ?? ""}
                  placeholder="https://images.unsplash.com/..."
                  onBlur={(e) => {
                    const val = e.currentTarget.value.trim();
                    setPreviewImage(val || null);
                  }}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono text-xs"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="profile-email-readonly"
                  className="text-xs font-semibold text-foreground flex items-center justify-between"
                >
                  <span>Registered Email</span>
                  <span className="text-[11px] text-muted-foreground font-normal flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                    Verified account
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="profile-email-readonly"
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
                  />
                  <Mail className="absolute right-3.5 top-3 size-4 text-muted-foreground/60" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-border/60 pt-4">
            <Button
              type="submit"
              variant="default"
              size="default"
              isLoading={isUpdatingProfile}
              leftIcon={<Save className="size-4" />}
              className="font-semibold shadow-xs"
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </section>

      {/* ── Security & Password Card ── */}
      <section className="ui-card p-4 sm:p-6 lg:p-7">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Password & Security
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Account Safeguards
          </span>
        </div>

        {passwordMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium border ${
              passwordMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            {passwordMessage.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="security-current-password"
                className="text-xs font-semibold text-foreground"
              >
                Current Password
              </label>
              <input
                id="security-current-password"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="security-new-password"
                className="text-xs font-semibold text-foreground"
              >
                New Password
              </label>
              <input
                id="security-new-password"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min 8 characters"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="security-confirm-password"
                className="text-xs font-semibold text-foreground"
              >
                Confirm New Password
              </label>
              <input
                id="security-confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <span className="text-[11px] text-muted-foreground">
              Updating your password will revoke other active sessions.
            </span>
            <Button
              type="submit"
              variant="outline"
              size="default"
              isLoading={isChangingPassword}
              leftIcon={<KeyRound className="size-4" />}
              className="font-semibold"
            >
              Update Password
            </Button>
          </div>
        </form>
      </section>

      {/* ── Active Session & Sign Out ── */}
      <section className="ui-card p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Active Account Session
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Signed in as <span className="font-semibold text-foreground">{user.email}</span>. You can sign out of this device below.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isSigningOut}
            onClick={onSignOut}
            isLoading={isSigningOut}
            leftIcon={<LogOut className="size-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </section>
    </div>
  );
}
