import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type DashboardTeam = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isOwner: boolean;
  updatedAt: string | Date;
};

type MyTeamsProps = {
  teams: DashboardTeam[];
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

export function MyTeams({ teams }: MyTeamsProps) {
  return (
    <Card className="border-border/80 bg-card/40 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Teams & Collaboration</CardTitle>
            {teams.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({teams.length})
              </span>
            )}
          </div>

          <Link href="/teams">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
              <span>View all</span>
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {teams.length > 0 ? (
          <div className="rounded-xl border border-border/70 divide-y divide-border/60 overflow-hidden bg-background/50">
            {teams.map((team) => (
              <Link
                key={team.id}
                href="/teams"
                className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {team.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        team.isOwner
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {team.isOwner ? "Owner" : "Member"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {team.description || "Developer collaboration team."}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    <span>{team.memberCount}</span>
                  </span>

                  <span className="hidden sm:inline text-[11px]">
                    {formatRelativeTime(team.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-card/20 py-8 px-4 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
              <Users className="size-5" />
            </div>

            <h3 className="text-sm font-medium text-foreground">No teams yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Create or join a team to collaborate with other developers on DevForge.
            </p>

            <div className="mt-4">
              <Link href="/teams">
                <Button size="sm" variant="outline" className="cursor-pointer gap-1.5 text-xs">
                  <span>Explore teams</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
