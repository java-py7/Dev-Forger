"use client";

import { DeploymentOverviewStats } from "@/app/(dashboard)/deployments/deployment-actions";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Cloud,
  ExternalLink,
  Layers,
  Rocket,
  ShieldAlert,
} from "lucide-react";

type Props = {
  stats: DeploymentOverviewStats;
};

export function DeploymentOverview({ stats }: Props) {
  const formatTimeAgo = (iso: string | null) => {
    if (!iso) return "Never";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {/* 1. Production Status */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Production</span>
          <Rocket className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2.5">
          <DeploymentStatusBadge status={stats.productionStatus} size="sm" />
        </div>
      </Card>

      {/* 2. Total Deployments */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total Deploys</span>
          <Layers className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight text-foreground">
          {stats.totalDeployments}
        </div>
      </Card>

      {/* 3. Latest Deployment */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Latest Deploy</span>
          <Clock className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 text-sm font-semibold text-foreground truncate">
          {stats.latestDeployment
            ? formatTimeAgo(stats.latestDeployment.createdAt)
            : "Never"}
        </div>
      </Card>

      {/* 4. Last Successful */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Last Success</span>
          <CheckCircle2 className="size-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 truncate">
          {stats.lastSuccessfulDeployment?.url ? (
            <a
              href={stats.lastSuccessfulDeployment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate"
            >
              <span>Live Site</span>
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : stats.lastSuccessfulDeployment ? (
            <span className="text-xs text-foreground font-semibold">
              {formatTimeAgo(stats.lastSuccessfulDeployment.createdAt)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">None yet</span>
          )}
        </div>
      </Card>

      {/* 5. Active Environment */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Environment</span>
          <Layers className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {stats.activeEnvironment}
          </Badge>
        </div>
      </Card>

      {/* 6. Cloud Provider */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Provider</span>
          <Cloud className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 truncate">
          {stats.isProviderConfigured ? (
            <Badge variant="outline" className="gap-1 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="size-3" />
              <span>{stats.providerName || "Connected"}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs border-muted-foreground/30 text-muted-foreground font-normal">
              <ShieldAlert className="size-3" />
              <span>Not Configured</span>
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
