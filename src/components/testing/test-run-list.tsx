"use client";

import { TestRunItem } from "@/app/(dashboard)/testing/testing-actions";
import { TestStatusBadge } from "./test-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  History,
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Props = {
  runs: TestRunItem[];
  onSelectRun: (run: TestRunItem) => void;
  onRunTests: () => void;
  isRunning: boolean;
  canEdit: boolean;
};

export function TestRunList({
  runs,
  onSelectRun,
  onRunTests,
  isRunning,
  canEdit,
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

  return (
    <Card className="rounded-xl border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Test Run History</CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {runs.length} {runs.length === 1 ? "Run" : "Runs"}
          </Badge>
        </div>

        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRunTests}
            disabled={isRunning}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Play className="size-3" />
            <span>Run Tests</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-lg border border-dashed bg-muted/10">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Terminal className="size-5" />
            </div>
            <h4 className="mt-3 text-sm font-semibold">No test runs recorded</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Execute test suites to view historical execution metrics, duration traces, and standard error logs here.
            </p>
            {canEdit && (
              <Button
                size="sm"
                onClick={onRunTests}
                disabled={isRunning}
                className="mt-4 text-xs h-8 gap-1.5 cursor-pointer"
              >
                <Play className="size-3.5" />
                <span>Execute First Run</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    <TestStatusBadge status={run.status} size="sm" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {run.trigger}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(run.createdAt)} at {formatTime(run.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>{run.durationMs}ms</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          <span>{run.passedCount}</span>
                        </span>
                        {run.failedCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
                            <XCircle className="size-3" />
                            <span>{run.failedCount}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Avatar className="size-3.5">
                          <AvatarImage src={run.user.image || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {run.user.name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{run.user.name || "User"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectRun(run)}
                    className="h-7 text-xs px-2.5 cursor-pointer gap-1"
                  >
                    <Terminal className="size-3" />
                    <span>View Output</span>
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
