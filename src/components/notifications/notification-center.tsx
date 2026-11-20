"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Flame,
  Shield,
  BookOpen,
  Users,
  Trophy,
  Trash2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  getUserNotificationsAction,
  getUnreadNotificationCountAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  type NotificationItem,
} from "@/actions/notifications";
import type { NotificationType } from "@/lib/schemas/notifications";

type Props = {
  isMobile?: boolean;
};

function formatRelativeTime({ date }: { date: Date | string }): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function NotificationTypeIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case "streak_alert":
      return (
        <Flame className="size-4 text-amber-500 fill-amber-500 shrink-0" />
      );
    case "freeze_used":
      return (
        <Shield className="size-4 text-primary fill-primary/20 shrink-0" />
      );
    case "plan_reminder":
      return <BookOpen className="size-4 text-blue-500 shrink-0" />;
    case "group_activity":
      return <Users className="size-4 text-indigo-500 shrink-0" />;
    case "achievement":
      return <Trophy className="size-4 text-amber-500 shrink-0" />;
    default:
      return <Bell className="size-4 text-muted-foreground shrink-0" />;
  }
}

export function NotificationCenter({ isMobile = false }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedListRef = useRef(false);
  const fetchSeqRef = useRef(0);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCountOnly = useCallback(async () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }
    const seq = ++fetchSeqRef.current;
    try {
      const res = await getUnreadNotificationCountAction();
      if (res.success && seq === fetchSeqRef.current) {
        setUnreadCount(res.count);
      }
    } catch {
      // Ignore background network errors
    }
  }, []);

  const fetchNotifications = useCallback(
    async ({ showLoading = false }: { showLoading?: boolean } = {}) => {
      const seq = ++fetchSeqRef.current;
      if (showLoading) setIsLoading(true);
      try {
        const res = await getUserNotificationsAction({ limit: 40 });
        if (res.success && seq === fetchSeqRef.current) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
          hasLoadedListRef.current = true;
        }
      } catch {
        // Ignore network errors on background poll
      } finally {
        if (showLoading && seq === fetchSeqRef.current) setIsLoading(false);
      }
    },
    []
  );

  // Initial load: lightweight unread count on mount or pathname change
  useEffect(() => {
    let isCancelled = false;

    async function load() {
      try {
        const res = await getUnreadNotificationCountAction();
        if (!isCancelled && res.success) {
          setUnreadCount(res.count);
        }
      } catch {
        // Ignore network errors
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  // When panel opens: fetch full list immediately if not yet loaded or if open
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications({ showLoading: !hasLoadedListRef.current });
    }
  }, [isOpen, fetchNotifications]);

  // Smart polling:
  // - 60s when closed (unread count only: 1 fast query)
  // - 30s when open (full list)
  // - 0s when tab is in background (saves database connections and mobile battery)
  useEffect(() => {
    const intervalMs = isOpen ? 30000 : 60000;
    const interval = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      if (isOpen) {
        void fetchNotifications();
      } else {
        void fetchUnreadCountOnly();
      }
    }, intervalMs);

    const handleSync = () => {
      if (document.visibilityState === "visible") {
        if (isOpen) {
          void fetchNotifications();
        } else {
          void fetchUnreadCountOnly();
        }
      }
    };

    window.addEventListener("focus", handleSync);
    window.addEventListener("visibilitychange", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("visibilitychange", handleSync);
    };
  }, [isOpen, fetchNotifications, fetchUnreadCountOnly]);

  // Close desktop popover on outside click
  useEffect(() => {
    if (isMobile || !isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile]);

  const handleMarkAsRead = async ({
    notificationId,
  }: {
    notificationId: string;
  }) => {
    fetchSeqRef.current++;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await markNotificationAsReadAction({ notificationId });
  };

  const handleMarkAllAsRead = async () => {
    fetchSeqRef.current++;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await markAllNotificationsAsReadAction();
  };

  const handleDelete = async ({
    notificationId,
  }: {
    notificationId: string;
  }) => {
    fetchSeqRef.current++;
    const target = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    await deleteNotificationAction({ notificationId });
  };

  const handleNotificationClick = async ({
    notification,
  }: {
    notification: NotificationItem;
  }) => {
    if (!notification.isRead) {
      await handleMarkAsRead({ notificationId: notification.id });
    }
    if (notification.actionUrl) {
      setIsOpen(false);
      router.push(notification.actionUrl);
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const NotificationListContent = (
    <div className="flex flex-col h-full">
      {/* Header & Filter Tabs */}
      <div className="p-4 border-b border-border/70 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span
                data-testid="unread-badge-counter"
                className="inline-flex items-center justify-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary tabular-nums"
              >
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              data-testid="mark-all-read-button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <CheckCheck className="size-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex-1 rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "all"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={cn(
              "flex-1 rounded-lg py-1 text-xs font-semibold transition-all cursor-pointer",
              activeTab === "unread"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications Scroll List */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1.5 overscroll-contain">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-muted-foreground">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2.5">
              <Sparkles className="size-5 text-muted-foreground/60" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {activeTab === "unread"
                ? "All caught up!"
                : "No notifications yet"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
              {activeTab === "unread"
                ? "You have no unread updates."
                : "Activity and reminders will appear here."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              data-testid={`notification-item-${item.id}`}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl p-3 transition-colors text-left border cursor-pointer",
                item.isRead
                  ? "bg-transparent border-transparent hover:bg-muted/40"
                  : "bg-surface-elevated border-border/60 hover:border-border"
              )}
              onClick={() => handleNotificationClick({ notification: item })}
            >
              {/* Type Icon Badge */}
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                  item.isRead
                    ? "bg-muted/60 border-border/40"
                    : "bg-background border-border shadow-2xs"
                )}
              >
                <NotificationTypeIcon type={item.type} />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4
                    className={cn(
                      "text-xs font-bold truncate",
                      item.isRead ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <span
                      data-testid="unread-indicator-dot"
                      className="size-1.5 rounded-full bg-primary shrink-0"
                    />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {item.body}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80">
                  <span>{formatRelativeTime({ date: item.createdAt })}</span>
                  {item.actionUrl && (
                    <span className="flex items-center gap-0.5 text-primary font-medium hover:underline">
                      View
                      <ExternalLink className="size-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons (Mark read / Delete) */}
              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity">
                {!item.isRead && (
                  <button
                    type="button"
                    title="Mark as read"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead({ notificationId: item.id });
                    }}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete({ notificationId: item.id });
                  }}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-border/60 text-center shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void fetchNotifications({ showLoading: true })}
            disabled={isLoading}
            className="text-[11px] h-7 text-muted-foreground hover:text-foreground w-full"
          >
            {isLoading ? "Refreshing..." : "Refresh notifications"}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        data-testid={
          isMobile
            ? "mobile-notifications-button"
            : "desktop-notifications-button"
        }
        className={cn(
          "relative flex items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border transition-all cursor-pointer shadow-2xs",
          isMobile ? "size-8.5" : "size-9"
        )}
      >
        <Bell className={cn(isMobile ? "size-3.5" : "size-4")} />
        {unreadCount > 0 && (
          <span
            data-testid="notifications-unread-dot"
            className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-xs animate-in zoom-in"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Floating Popover */}
      {!isMobile && isOpen && (
        <div
          data-testid="notifications-popover"
          className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[520px] overflow-hidden"
        >
          {NotificationListContent}
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            showHandle={true}
            showCloseButton={true}
            className="max-h-[85dvh] rounded-t-[28px] border-border/80 bg-card p-0 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="sr-only">
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>In-app activity and updates</SheetDescription>
              </SheetHeader>
            </div>
            {NotificationListContent}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
