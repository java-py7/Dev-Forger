import { NotificationType } from "@prisma/client";

export type { NotificationType };

export type NotificationItemData = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
};

export type NotificationFilter = "ALL" | "UNREAD";

export type ActionResult<T = undefined> = {
  success: boolean;
  error?: string;
  data?: T;
};
