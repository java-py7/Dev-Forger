import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { NotificationList } from "@/components/notifications/notification-list";
import { NotificationItemData } from "@/components/notifications/types";

export const metadata = {
  title: "Notifications | DevForge",
  description: "Stay updated on activity related to your projects, collaboration, and account.",
};

type NotificationsPageProps = {
  searchParams?: Promise<{ filter?: string }>;
};

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const sParams = searchParams ? await searchParams : {};
  const requestedFilter = sParams.filter?.toUpperCase() === "UNREAD" ? "UNREAD" : "ALL";

  // Fetch real notifications and unread count from Prisma scoped to authenticated user
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
        ...(requestedFilter === "UNREAD" ? { read: false } : {}),
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

  const notificationData: NotificationItemData[] = notifications.map((n) => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-full">
      {/* Header */}
      <div className="border-b">
        <div className="px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-8xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Bell className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Notifications
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Stay updated on activity related to your projects, collaboration, and account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-8xl">
          <NotificationList
            initialNotifications={notificationData}
            initialUnreadCount={unreadCount}
          />
        </div>
      </div>
    </main>
  );
}
