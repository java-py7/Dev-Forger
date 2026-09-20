"use client";

import { TestingOverviewStats } from "@/app/(dashboard)/testing/testing-actions";
import { TestStatusBadge } from "./test-status-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Cpu,
  FileCode2,
  FlaskConical,
  XCircle,
} from "lucide-react";

type Props = {
  stats: TestingOverviewStats;
  isConfigured: boolean;
  framework: string | null;
};

export function TestingOverview({ stats, isConfigured, framework }: Props) {
  const formatLastRun = (iso: string | null) => {
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
      {/* 1. Overall Status */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Overall Status</span>
          <FlaskConical className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2.5">
          <TestStatusBadge status={stats.overallStatus} size="sm" />
        </div>
      </Card>

      {/* 2. Total Suites */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Test Suites</span>
          <FileCode2 className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight text-foreground">
          {stats.totalSuites}
        </div>
      </Card>

      {/* 3. Passing Tests */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Passing</span>
          <CheckCircle2 className="size-3.5 text-emerald-500" />
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
          {stats.passingTests}
        </div>
      </Card>

      {/* 4. Failing Tests */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Failing</span>
          <XCircle className="size-3.5 text-rose-500" />
        </div>
        <div className="mt-2 text-xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
          {stats.failingTests}
        </div>
      </Card>

      {/* 5. Last Run */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Last Run</span>
          <Clock className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 text-sm font-semibold text-foreground truncate">
          {formatLastRun(stats.lastRunAt)}
        </div>
      </Card>

      {/* 6. Test Runner Framework */}
      <Card className="rounded-xl border bg-card/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Test Runner</span>
          <Cpu className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 truncate">
          {isConfigured ? (
            <Badge variant="secondary" className="text-xs truncate max-w-full font-mono">
              {framework || "Active"}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground italic">None detected</span>
          )}
        </div>
      </Card>
    </div>
  );
}
