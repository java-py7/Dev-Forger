"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { DeploymentItem } from "@/app/(dashboard)/deployments/deployment-actions";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Layers,
  Loader2,
  Rocket,
  Terminal,
  XCircle,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: DeploymentItem | null;
};

export function DeploymentDetailsSheet({
  open,
  onOpenChange,
  deployment,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!deployment) return null;

  const latestBuild = deployment.builds[0] || null;
  const rawLogs = latestBuild?.logs || "";

  const copyLogs = () => {
    if (!rawLogs) return;
    navigator.clipboard.writeText(rawLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimelineSteps = () => {
    const status = deployment.status;
    return [
      {
        id: "queued",
        label: "Queued",
        completed: status !== "QUEUED",
        current: status === "QUEUED",
      },
      {
        id: "building",
        label: "Building",
        completed: status === "DEPLOYING" || status === "READY",
        current: status === "BUILDING",
      },
      {
        id: "deploying",
        label: "Deploying",
        completed: status === "READY",
        current: status === "DEPLOYING",
      },
      {
        id: "ready",
        label: status === "FAILED" ? "Failed" : status === "CANCELLED" ? "Cancelled" : "Ready",
        completed: status === "READY",
        current: status === "READY" || status === "FAILED" || status === "CANCELLED",
        isFailed: status === "FAILED" || status === "CANCELLED",
      },
    ];
  };

  const steps = getTimelineSteps();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-6 overflow-hidden"
      >
        <SheetHeader className="space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2">
              <Rocket className="size-4 text-primary" />
              <SheetTitle className="text-lg font-semibold truncate">
                Deployment Details
              </SheetTitle>
            </div>
            <DeploymentStatusBadge status={deployment.status} size="sm" />
          </div>

          <SheetDescription className="text-xs text-muted-foreground font-mono truncate">
            ID: {deployment.id}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pt-3 pr-1 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg border bg-muted/20">
            <div className="space-y-1">
              <span className="text-muted-foreground">Target Environment</span>
              <div className="font-semibold flex items-center gap-1.5 capitalize text-foreground">
                <Layers className="size-3 text-muted-foreground" />
                <span>{deployment.environment.toLowerCase()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Created Time</span>
              <div className="font-semibold flex items-center gap-1 text-foreground">
                <Clock className="size-3 text-muted-foreground" />
                <span>{new Date(deployment.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Trigger</span>
              <div className="font-semibold text-foreground truncate">
                {deployment.trigger}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground">Initiated By</span>
              <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                <Avatar className="size-4 shrink-0">
                  <AvatarImage src={deployment.user.image || undefined} />
                  <AvatarFallback className="text-[9px]">
                    {deployment.user.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{deployment.user.name || "Developer"}</span>
              </div>
            </div>
          </div>

          {/* Target URL */}
          {deployment.url ? (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Live Deployment URL
                </span>
                <p className="font-mono text-xs text-foreground truncate">
                  {deployment.url}
                </p>
              </div>

              <a
                href={deployment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-7 items-center gap-1 rounded-md bg-background px-2.5 text-xs font-medium text-foreground border hover:bg-accent transition-colors shrink-0"
              >
                <span>Visit</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-muted-foreground">
              <span>No public URL assigned yet</span>
              <Badge variant="outline" className="text-[10px]">
                Pending Domain
              </Badge>
            </div>
          )}

          {/* Pipeline Stage Timeline */}
          <div className="space-y-2.5">
            <span className="font-semibold text-foreground">Pipeline Progress</span>
            <div className="grid grid-cols-4 gap-2 text-center">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                    step.current
                      ? step.isFailed
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border-primary bg-primary/10 text-primary font-semibold"
                      : step.completed
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground bg-muted/10 opacity-60"
                  }`}
                >
                  {step.current && !step.isFailed ? (
                    <Loader2 className="size-3.5 animate-spin mb-1 text-primary" />
                  ) : step.isFailed ? (
                    <XCircle className="size-3.5 mb-1 text-rose-500" />
                  ) : step.completed ? (
                    <CheckCircle2 className="size-3.5 mb-1 text-emerald-500" />
                  ) : (
                    <Clock className="size-3.5 mb-1 text-muted-foreground" />
                  )}
                  <span className="text-[11px] truncate w-full">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monospace Build Logs Panel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5 text-primary" />
                <span>Build & Deployment Logs</span>
              </span>

              {rawLogs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLogs}
                  className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy Logs</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="rounded-lg border bg-zinc-950 p-4 text-zinc-200 font-mono text-[12px] leading-relaxed max-h-72 overflow-y-auto shadow-inner select-text">
              {rawLogs ? (
                <pre className="whitespace-pre-wrap break-words">{rawLogs}</pre>
              ) : (
                <p className="text-zinc-500 italic">
                  No build logs recorded for this deployment record.
                </p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
