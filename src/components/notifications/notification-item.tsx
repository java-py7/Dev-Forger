"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckSquare,
  Clock,
  FolderKanban,
  MessageSquare,
  Rocket,
  Trash2,
  UserPlus,
  Users,
  AtSign,
} from "lucide-react";
import { NotificationItemData, NotificationType } from "./types";
import { markNotificationAsRead, deleteNotification } from "@/app/(dashboard)/notifications/actions";
import { Button } from "@/components/ui/button";

type NotificationItemProps = {
  notification: NotificationItemData;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "Yesterday";
  }
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getNotificationConfig(type: NotificationType) {
  switch (type) {
    case "PROJECT_INVITATION":
      return {
        icon: FolderKanban,
        iconClass: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
        defaultRoute: "/projects",
      };
    case "PROJECT_APPLICATION":
      return {
        icon: UserPlus,
        iconClass: "text-amber-500 dark:text-amber-400 bg-amber-500/10",
        defaultRoute: "/projects",
      };
    case "TEAM_INVITATION":
      return {
        icon: Users,
        iconClass: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
        defaultRoute: "/teams",
      };
    case "TASK_ASSIGNED":
      return {
        icon: CheckSquare,
        iconClass: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
        defaultRoute: "/kanban",
      };
    case "TASK_UPDATED":
      return {
        icon: Clock,
        iconClass: "text-cyan-500 dark:text-cyan-400 bg-cyan-500/10",
        defaultRoute: "/kanban",
      };
    case "MESSAGE":
      return {
        icon: MessageSquare,
        iconClass: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10",
        defaultRoute: "/chat",
      };
    case "MENTION":
      return {
        icon: AtSign,
        iconClass: "text-pink-500 dark:text-pink-400 bg-pink-500/10",
        defaultRoute: "/chat",
      };
    case "DEPLOYMENT":
      return {
        icon: Rocket,
        iconClass: "text-orange-500 dark:text-orange-400 bg-orange-500/10",
        defaultRoute: "/deployments",
      };
    case "SYSTEM":
    default:
      return {
        icon: Bell,
        iconClass: "text-muted-foreground bg-muted",
        defaultRoute: null,
      };
  }
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;
  const timeDisplay = formatRelativeTime(notification.createdAt);

  const handleRowClick = async () => {
    if (!notification.read) {
      onMarkRead?.(notification.id);
      startTransition(async () => {
        await markNotificationAsRead(notification.id);
      });
    }

    if (config.defaultRoute) {
      router.push(config.defaultRoute);
    }
  };

  const handleMarkAsReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read) return;

    onMarkRead?.(notification.id);
    startTransition(async () => {
      await markNotificationAsRead(notification.id);
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    onDelete?.(notification.id);
    startTransition(async () => {
      await deleteNotification(notification.id);
    });
  };

  return (
    <div
      onClick={handleRowClick}
      className={`group relative flex items-start gap-3.5 px-4 py-3.5 transition-colors cursor-pointer border-b last:border-b-0 ${
        notification.read
          ? "bg-background hover:bg-muted/35"
          : "bg-primary/[0.03] hover:bg-primary/[0.06]"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${config.iconClass}`}
      >
        <Icon className="size-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm truncate ${
              notification.read
                ? "font-normal text-foreground/90"
                : "font-medium text-foreground"
            }`}
          >
            {notification.title}
          </p>

          {!notification.read && (
            <span
              className="size-1.5 shrink-0 rounded-full bg-primary"
              aria-label="Unread notification"
            />
          )}

          <span className="ml-auto shrink-0 text-xs text-muted-foreground whitespace-nowrap">
            {timeDisplay}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {/* Action Buttons (visible on hover or focus) */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {!notification.read && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleMarkAsReadClick}
            disabled={isPending}
            title="Mark as read"
            className="text-muted-foreground hover:text-foreground"
          >
            <Check className="size-3.5" />
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleDeleteClick}
          disabled={isPending}
          title="Delete notification"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
