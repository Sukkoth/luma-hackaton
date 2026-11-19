"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Plus,
  Check,
  Bell,
  ShieldCheck,
  LogOut,
  Calendar,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { AppShell } from "@/components/navigation/app-shell";
import { authClient } from "@/lib/auth-client";
import type { UserTrackerSummary } from "@/actions/trackers";
import { switchTrackerAction } from "@/actions/trackers";
import { updateUserSettingsAction } from "@/actions/settings";
import { TrackerCreationModal } from "@/components/trackers/tracker-creation-modal";
import { TrackerIcon } from "@/components/trackers/tracker-icons";
import type { StreakData } from "@/components/streak/streak-detail-modal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HeaderActions, HeaderActionButton } from "@/components/ui/header-action-button";
import { ProfileSettingsSection } from "./profile-settings-section";
import type { BibleCanon } from "@/data/bibleData";
import { cn } from "@/lib/utils";

function formatCanonTitle({ canon }: { canon: string }): string {
  switch (canon) {
    case "catholic":
      return "Catholic Edition (73 Books)";
    case "orthodox":
    case "eastern_orthodox":
      return "Eastern Orthodox (76 Books)";
    case "ethiopian_orthodox":
      return "Ethiopian Orthodox (81 Books)";
    case "protestant":
    default:
      return "Protestant Canon (66 Books)";
  }
}

export type EnrichedTrackerSummary = UserTrackerSummary & {
  readChaptersCount: number;
  totalChaptersCount: number;
};

export type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerifiedAt?: Date | string | null;
};

export type UserSettingsState = {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
};

export type SettingsViewProps = {
  user: SettingsUser;
  trackers?: ReadonlyArray<EnrichedTrackerSummary>;
  activeTrackerId?: string | null;
  streak?: StreakData;
  settings: UserSettingsState;
};

export function SettingsView({
  user,
  trackers = [],
  activeTrackerId,
  streak,
  settings: initialSettings,
}: SettingsViewProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [switchingTrackerId, setSwitchingTrackerId] = useState<string | null>(null);
  const [isCreateTrackerOpen, setIsCreateTrackerOpen] = useState(false);

  // Settings local state
  const [settings, setSettings] = useState<UserSettingsState>(initialSettings);
  const [isPending, startTransition] = useTransition();

  // Browser notification permission state
  const [permissionOverride, setPermissionOverride] = useState<
    NotificationPermission | null
  >(null);

  const browserPermission = useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : ("unsupported" as const),
    () => "default" as const
  );

  const notificationPermission = permissionOverride ?? browserPermission;

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setPermissionOverride(permission);
      if (permission === "granted") {
        toast.success("Notification permissions enabled");
      } else if (permission === "denied") {
        toast.error("Notifications blocked in your browser settings");
      }
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/login");
            router.refresh();
          },
        },
      });
    } catch {
      setIsSigningOut(false);
    }
  };

  const handleSwitchTracker = async ({ trackerId }: { trackerId: string }) => {
    if (trackerId === activeTrackerId || switchingTrackerId) return;
    setSwitchingTrackerId(trackerId);

    try {
      const res = await switchTrackerAction({ trackerId });
      if (res.success) {
        toast.success("Active reading tracker updated");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to switch tracker.");
      }
    } catch {
      toast.error("Failed to switch tracker.");
    } finally {
      setSwitchingTrackerId(null);
    }
  };

  const handleToggleDailyReminder = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, dailyReminderEnabled: enabled }));
    startTransition(async () => {
      const res = await updateUserSettingsAction({
        settings: { dailyReminderEnabled: enabled },
      });
      if (res.success) {
        toast.success(enabled ? "Daily reminder enabled" : "Daily reminder disabled");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleTimeChange = (time: string) => {
    setSettings((prev) => ({ ...prev, dailyReminderTime: time }));
    startTransition(async () => {
      const res = await updateUserSettingsAction({
        settings: { dailyReminderTime: time },
      });
      if (res.success) {
        toast.success(`Reminder time set to ${time}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const displayName = user.name.split(" ")[0] || user.name || "Reader";
  const activeTracker = trackers.find((t) => t.id === activeTrackerId) ?? trackers[0];

  return (
    <AppShell
      userName={displayName}
      userEmail={user.email}
      userImage={user.image ?? undefined}
      streak={streak}
      trackers={trackers}
      activeTrackerId={activeTrackerId}
    >
      <div className="w-full max-w-[1440px] mx-auto space-y-6">
        {/* ── Unboxed Editorial Masthead ── */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-1">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>Account Preferences & Workspace Controls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Account & Settings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Manage study trackers, daily chapter reminders, and credentials.
            </p>
          </div>

          <HeaderActions>
            <HeaderActionButton
              type="secondary"
              onClick={() => setIsCreateTrackerOpen(true)}
              icon={<Plus className="size-4" />}
              label="New Tracker"
            />
            <HeaderActionButton
              type="primary"
              onClick={handleSignOut}
              disabled={isSigningOut}
              isLoading={isSigningOut}
              icon={<LogOut className="size-4" />}
              label="Sign Out"
            />
          </HeaderActions>
        </section>

        {/* ── Signature Horizon Ribbon ── */}
        <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
            {/* Column 1: Active Tracker & Workspace */}
            <div className="pr-0 md:pr-8 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    Active Canon Tracker
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {activeTracker ? formatCanonTitle({ canon: activeTracker.canon as BibleCanon }) : "Workspace"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground tabular-nums line-clamp-1">
                    {activeTracker?.name ?? "Primary Devotional Tracker"}
                  </span>
                  <span className="text-xs font-semibold text-primary shrink-0">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTracker
                    ? `${formatCanonTitle({ canon: activeTracker.canon as BibleCanon })} • ${activeTracker.readChaptersCount} / ${activeTracker.totalChaptersCount} chapters read (${Math.round((activeTracker.readChaptersCount / Math.max(1, activeTracker.totalChaptersCount)) * 100)}%)`
                    : "No active reading tracker selected."}
                </p>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Reading Isolation</span>
                  <span className="text-primary font-medium">Protected per Canon</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        activeTracker && activeTracker.totalChaptersCount > 0
                          ? Math.min(100, Math.round((activeTracker.readChaptersCount / activeTracker.totalChaptersCount) * 100))
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Account & Security Profile */}
            <div className="pl-0 md:pl-8 pt-5 md:pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Authentication & Profile
                  </span>
                </div>
                <span className="text-[11px] font-medium text-primary">
                  Member ID: {user.id ? `${user.id.slice(0, 8)}...` : "Active"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {user.name || "Reader"}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {user.email} • Session active with secure credentials.
                </p>
              </div>

              {/* Security Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Session Verified
                </span>
                <span className="rounded-md border border-border/70 bg-surface-elevated px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {trackers.length} Workspace{trackers.length === 1 ? "" : "s"}
                </span>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {streak?.currentStreak ?? 0} Day Streak
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Real Reading Trackers Manager */}
        <section className="ui-card p-4 sm:p-6 lg:p-7 space-y-4">
          <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderKanban className="size-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Reading Trackers
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Switch your active devotional tracker or create a new workspace for another canonical tradition.
              </p>
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              leftIcon={<Plus className="size-3.5" />}
              onClick={() => setIsCreateTrackerOpen(true)}
            >
              Create Tracker
            </Button>
          </div>

          <div className="space-y-3 pt-1">
            {trackers.map((tracker) => {
              const isActive = tracker.id === activeTrackerId;
              const isSwitching = switchingTrackerId === tracker.id;
              const canonTitle = formatCanonTitle({ canon: tracker.canon as BibleCanon });
              const progressPct =
                tracker.totalChaptersCount > 0
                  ? Math.min(100, Math.round((tracker.readChaptersCount / tracker.totalChaptersCount) * 100))
                  : 0;

              return (
                <div
                  key={tracker.id}
                  className={cn(
                    "rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/5 shadow-xs"
                      : "border-border bg-card hover:border-border-strong"
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl border shrink-0",
                        isActive
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <TrackerIcon icon={tracker.icon} className="size-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {tracker.name}
                        </h3>
                        {isActive && (
                          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            Active Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {canonTitle} • {tracker.readChaptersCount} / {tracker.totalChaptersCount} chapters read ({progressPct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Check className="size-4" />
                        <span>Current Default</span>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSwitching}
                        isLoading={isSwitching}
                        onClick={() => handleSwitchTracker({ trackerId: tracker.id })}
                        className="font-medium"
                      >
                        Switch to this
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: General Notifications & Reading Reminders */}
        <section className="ui-card p-4 sm:p-6 lg:p-7 space-y-5">
          <div className="flex flex-col gap-2 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Reminders & Notifications
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Set a daily prompt to record your chapter readings. Plan-specific pacing alerts are scheduled separately in each plan.
              </p>
            </div>

            {/* Notification Permission Request */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                System Alerts:
              </span>
              {notificationPermission === "granted" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Check className="size-3" />
                  <span>Enabled</span>
                </span>
              ) : notificationPermission === "denied" ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 border border-destructive/20 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                  <span>Blocked in Browser</span>
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="text-xs h-7.5 px-2.5"
                >
                  Enable Permissions
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Daily General Log Reminder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-surface-elevated">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Daily Chapter Logging Reminder
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive a prompt to log your daily reading and maintain your spiritual streak.
                </p>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Time selector */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <input
                    type="time"
                    value={settings.dailyReminderTime}
                    disabled={!settings.dailyReminderEnabled || isPending}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>

                <Switch
                  checked={settings.dailyReminderEnabled}
                  disabled={isPending}
                  onCheckedChange={handleToggleDailyReminder}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Profile & Password Security Management */}
        <ProfileSettingsSection
          user={user}
          onSignOut={handleSignOut}
          isSigningOut={isSigningOut}
        />

        {/* Tracker Creation Modal */}
        <TrackerCreationModal
          isOpen={isCreateTrackerOpen}
          onClose={() => setIsCreateTrackerOpen(false)}
          onTrackerCreated={(res) => {
            if (res.success) {
              toast.success("New tracker created successfully");
              router.refresh();
            }
          }}
        />
      </div>
    </AppShell>
  );
}
