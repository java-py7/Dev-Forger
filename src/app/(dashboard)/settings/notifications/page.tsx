import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  FolderKanban,
  KanbanSquare,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Notification Settings | DevForge",
  description: "Review your in-app notification channels and activity triggers on DevForge.",
};

export default async function NotificationSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [totalNotifications, unreadCount] = await Promise.all([
    prisma.notification.count({
      where: { userId },
    }),
    prisma.notification.count({
      where: { userId, read: false },
    }),
  ]);

  const deliveryTriggers = [
    {
      title: "Project Invitations",
      type: "PROJECT_INVITATION",
      description: "Delivered when project owners invite you to join their code repositories.",
      icon: FolderKanban,
      channel: "In-App Bell & Dashboard",
    },
    {
      title: "Collaboration Requests",
      type: "PROJECT_APPLICATION",
      description: "Delivered when developers apply to join projects you own.",
      icon: UserPlus,
      channel: "In-App Bell & Dashboard",
    },
    {
      title: "Team Invitations",
      type: "TEAM_INVITATION",
      description: "Delivered when you are invited to developer teams or an invite is accepted.",
      icon: Users,
      channel: "In-App Bell & Dashboard",
    },
    {
      title: "Task Assignments & Updates",
      type: "TASK_ASSIGNED / TASK_UPDATED",
      description: "Delivered when tasks are assigned to you or moved between Kanban columns.",
      icon: KanbanSquare,
      channel: "In-App Bell & Dashboard",
    },
    {
      title: "Chat & Channel Messages",
      type: "MESSAGE",
      description: "Delivered when new messages arrive in direct chats or project channels.",
      icon: MessageSquare,
      channel: "In-App Bell & Dashboard",
    },
    {
      title: "System & Platform Notices",
      type: "SYSTEM",
      description: "Critical security notices, account milestones, and workspace alerts.",
      icon: Bell,
      channel: "In-App Bell & Dashboard",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review your in-app notification channels, automated event triggers, and inbox status.
        </p>
      </div>

      {/* Inbox Status & Quick Link */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Inbox Status</CardTitle>
            <Link href="/notifications">
              <Button size="sm" variant="outline" className="cursor-pointer gap-1.5 text-xs">
                <span>Open Notifications Inbox</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
          </div>
          <CardDescription className="text-xs">
            Live metrics from your personal notification records.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Unread Notifications
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  {unreadCount}
                </span>
                {unreadCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    Requires Review
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Total Received
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold tracking-tight text-foreground">
                  {totalNotifications}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Notification Triggers */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Active Notification Channels</CardTitle>
          <CardDescription className="text-xs">
            Collaboration and project events configured to generate alerts for your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/80 divide-y divide-border/60 overflow-hidden bg-background/50">
            {deliveryTriggers.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-start justify-between gap-3 p-3.5 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border/70 text-foreground mt-0.5">
                      <Icon className="size-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-emerald-500 font-medium whitespace-nowrap pt-1">
                    <CheckCircle2 className="size-3.5" />
                    <span>Delivered In-App</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-muted-foreground pt-1">
            Notifications are delivered instantly to your navigation bar and persisted in your personal notification inbox.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
