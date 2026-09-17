"use client";

import { useState, useTransition, useMemo } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationFilter, NotificationItemData } from "./types";
import { NotificationItem } from "./notification-item";
import { markAllNotificationsAsRead } from "@/app/(dashboard)/notifications/actions";
import { Button } from "@/components/ui/button";

type NotificationListProps = {
  initialNotifications: NotificationItemData[];
  initialUnreadCount?: number;
};

export function NotificationList({
  initialNotifications,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationItemData[]>(
    initialNotifications
  );
  const [prevInitial, setPrevInitial] = useState(initialNotifications);

  if (initialNotifications !== prevInitial) {
    setPrevInitial(initialNotifications);
    setNotifications(initialNotifications);
  }

  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [isPending, startTransition] = useTransition();

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Broadcast unread count changes to sync the sidebar badge instantaneously
  const notifyCountChange = (count: number) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("devforge:notification-count-update", {
          detail: { unreadCount: count },
        })
      );
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const nextUnread = next.filter((n) => !n.read).length;
      notifyCountChange(nextUnread);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      const nextUnread = next.filter((n) => !n.read).length;
      notifyCountChange(nextUnread);
      return next;
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      notifyCountChange(0);
      return next;
    });

    startTransition(async () => {
      await markAllNotificationsAsRead();
    });
  };

  const filteredNotifications = useMemo(() => {
    if (filter === "UNREAD") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              filter === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilter("UNREAD")}
            className={`cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
              filter === "UNREAD"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px] font-semibold text-primary">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Mark all as read button - ONLY visible when unread notifications exist */}
        {unreadCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="cursor-pointer h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification List Container */}
      {filteredNotifications.length > 0 ? (
        <div className="rounded-xl border border-border/80 bg-card/40 overflow-hidden divide-y divide-border/60 shadow-xs">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-border/80 bg-card/20 py-16 px-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground mb-3">
            <Bell className="size-5" />
          </div>

          <h2 className="text-base font-medium text-foreground">
            {filter === "UNREAD"
              ? "No unread notifications"
              : "You're all caught up"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            {filter === "UNREAD"
              ? "You've read all your notifications. Check back later for updates."
              : "You don't have any notifications right now."}
          </p>

          {filter === "UNREAD" && notifications.length > 0 && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilter("ALL")}
                className="cursor-pointer text-xs"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
