import Link from "next/link";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type DashboardActivityItem = {
  id: string;
  action: string;
  createdAt: string | Date;
  projectName?: string | null;
  projectSlug?: string | null;
  userName?: string | null;
  userImage?: string | null;
};

type RecentActivityProps = {
  activities: DashboardActivityItem[];
};

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatActionText(action: string): string {
  // Normalize actions like "PROJECT_CREATED", "TASK_UPDATED", "INVITATION_SENT", or plain text
  if (!action) return "performed an action";
  
  const readable = action
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

  return readable;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/80 bg-card/40 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            {activities.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({activities.length})
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 p-8 text-center bg-muted/10">
            <div className="flex size-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
              <Activity className="size-5" />
            </div>
            <h4 className="text-sm font-medium text-foreground mb-1">No recent activity</h4>
            <p className="text-xs text-muted-foreground max-w-[260px]">
              Workspace activity and project updates will be recorded and displayed here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item, index) => {
              const initials = (item.userName || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={item.id || index}
                  className="flex items-start gap-3 rounded-md p-2.5 transition-colors hover:bg-muted/40 text-sm"
                >
                  <Avatar className="size-7 mt-0.5 shrink-0">
                    {item.userImage && (
                      <AvatarImage src={item.userImage} alt={item.userName || "User"} />
                    )}
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">
                      <span className="font-semibold text-foreground">
                        {item.userName || "A team member"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {formatActionText(item.action)}
                      </span>
                      {item.projectName && item.projectSlug ? (
                        <>
                          {" "}in{" "}
                          <Link
                            href={`/projects/${item.projectSlug}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.projectName}
                          </Link>
                        </>
                      ) : item.projectName ? (
                        <>
                          {" "}in{" "}
                          <span className="font-medium text-foreground">
                            {item.projectName}
                          </span>
                        </>
                      ) : null}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
