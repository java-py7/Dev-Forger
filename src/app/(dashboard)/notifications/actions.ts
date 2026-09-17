"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NotificationFilter, ActionResult, NotificationItemData } from "@/components/notifications/types";
import { NotificationType } from "@prisma/client";

export async function getNotifications(params?: {
  filter?: NotificationFilter;
}): Promise<ActionResult<{ notifications: NotificationItemData[]; unreadCount: number }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to view notifications.",
    };
  }

  const userId = session.user.id;
  const filter = params?.filter || "ALL";

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(filter === "UNREAD" ? { read: false } : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt,
        })),
        unreadCount,
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: "Unable to load notifications. Please try again.",
    };
  }
}

export async function getUnreadNotificationCount(): Promise<ActionResult<{ unreadCount: number }>> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return {
      success: true,
      data: { unreadCount: count },
    };
  } catch (error) {
    console.error("Error getting unread count:", error);
    return {
      success: false,
      error: "Unable to retrieve notification count.",
    };
  }
}

export async function markNotificationAsRead(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to update notifications.",
    };
  }

  if (!id) {
    return {
      success: false,
      error: "Notification ID is required.",
    };
  }

  try {
    const updateResult = await prisma.notification.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    if (updateResult.count === 0) {
      return {
        success: false,
        error: "Notification not found or access denied.",
      };
    }

    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: "Failed to mark notification as read.",
    };
  }
}

export async function markAllNotificationsAsRead(): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to update notifications.",
    };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read.",
    };
  }
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to delete notifications.",
    };
  }

  if (!id) {
    return {
      success: false,
      error: "Notification ID is required.",
    };
  }

  try {
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (deleteResult.count === 0) {
      return {
        success: false,
        error: "Notification not found or access denied.",
      };
    }

    revalidatePath("/notifications");
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: "Failed to delete notification.",
    };
  }
}

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: "Failed to create notification.",
    };
  }
}
