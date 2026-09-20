"use client";

import { DeploymentItem } from "@/app/(dashboard)/deployments/deployment-actions";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  ExternalLink,
  History,
  Rocket,
  Terminal,
} from "lucide-react";

type Props = {
  deployments: DeploymentItem[];
  onSelectDeployment: (deployment: DeploymentItem) => void;
  onOpenDeploy: () => void;
  canDeploy: boolean;
};

export function DeploymentList({
  deployments,
  onSelectDeployment,
  onOpenDeploy,
  canDeploy,
}: Props) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDuration = (d: DeploymentItem): string => {
    const build = d.builds[0];
    if (build?.startedAt && build?.finishedAt) {
      const diffSec = Math.max(
        1,
        Math.round(
          (new Date(build.finishedAt).getTime() -
            new Date(build.startedAt).getTime()) /
            1000
        )
      );
      if (diffSec < 60) return `${diffSec}s`;
      const min = Math.floor(diffSec / 60);
      const sec = diffSec % 60;
      return `${min}m ${sec}s`;
    }
    return "--";
  };

  return (
    <Card className="rounded-xl border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Deployment History</CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {deployments.length} {deployments.length === 1 ? "Deployment" : "Deployments"}
          </Badge>
        </div>

        {canDeploy && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDeploy}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Rocket className="size-3" />
            <span>Deploy</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed bg-muted/10">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Rocket className="size-6" />
            </div>
            <h4 className="mt-3 text-sm font-semibold">No deployments yet</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              No deployments have been recorded for this project in the database. When external CI/CD pipelines, webhooks, or provider deploys occur, real deployment traces will appear here.
            </p>
            {canDeploy && (
              <Button
                size="sm"
                onClick={onOpenDeploy}
                className="mt-4 text-xs h-8 gap-1.5 cursor-pointer"
              >
                <Rocket className="size-3.5" />
                <span>Configure or Deploy</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {deployments.map((d) => (
              <div
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    <DeploymentStatusBadge status={d.status} size="sm" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal capitalize">
                        {d.environment.toLowerCase()}
                      </Badge>

                      <span className="font-semibold text-xs text-foreground truncate">
                        {d.trigger}
                      </span>

                      <span className="text-[11px] text-muted-foreground font-mono">
                        ({d.id.slice(-8)})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span>
                        {formatDate(d.createdAt)} at {formatTime(d.createdAt)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>Duration: {calculateDuration(d)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Avatar className="size-3.5">
                          <AvatarImage src={d.user.image || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {d.user.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{d.user.name || "Developer"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {d.url && (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-7 items-center gap-1 rounded-md border bg-background px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="Open deployment URL"
                    >
                      <ExternalLink className="size-3" />
                      <span className="hidden sm:inline">Visit</span>
                    </a>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectDeployment(d)}
                    className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                  >
                    <Terminal className="size-3" />
                    <span>View Logs</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
