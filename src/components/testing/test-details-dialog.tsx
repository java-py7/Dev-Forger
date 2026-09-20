"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TestStatusBadge } from "./test-status-badge";
import { TestRunItem, TestSuiteItem } from "@/app/(dashboard)/testing/testing-actions";
import {
  Check,
  Clock,
  Copy,
  Terminal,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  run: TestRunItem | null;
  suite: TestSuiteItem | null;
};

export function TestDetailsDialog({ open, onOpenChange, run, suite }: Props) {
  const [copied, setCopied] = useState(false);

  const copyOutput = () => {
    if (!run?.output) return;
    navigator.clipboard.writeText(run.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const title = run
    ? `Test Run Details`
    : suite
    ? `Test Suite: ${suite.name}`
    : "Test Details";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              <span>{title}</span>
            </DialogTitle>
            {run && <TestStatusBadge status={run.status} size="sm" />}
            {suite && !run && <TestStatusBadge status={suite.lastStatus} size="sm" />}
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {run
              ? `Execution trace and standard output from test run on ${new Date(
                  run.createdAt
                ).toLocaleString()}.`
              : suite
              ? `Details for test suite file located at ${suite.path}.`
              : "Detailed test information."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-2 pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg border bg-muted/20 text-xs">
            {run ? (
              <>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Duration</span>
                  <div className="font-semibold flex items-center gap-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{run.durationMs}ms</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground">Passed / Failed</span>
                  <div className="font-semibold">
                    <span className="text-emerald-500">{run.passedCount}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className={run.failedCount > 0 ? "text-rose-500" : "text-muted-foreground"}>
                      {run.failedCount}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground">Trigger</span>
                  <div className="font-semibold truncate">{run.trigger}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground">Triggered By</span>
                  <div className="flex items-center gap-1.5 truncate">
                    <Avatar className="size-4">
                      <AvatarImage src={run.user.image || undefined} />
                      <AvatarFallback className="text-[9px]">
                        {run.user.name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{run.user.name || "User"}</span>
                  </div>
                </div>
              </>
            ) : suite ? (
              <>
                <div className="space-y-1 col-span-2">
                  <span className="text-muted-foreground">File Path</span>
                  <div className="font-semibold font-mono truncate">{suite.path}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground">Approx. Tests</span>
                  <div className="font-semibold">{suite.testsCount}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-muted-foreground">File Size</span>
                  <div className="font-semibold">{(suite.size / 1024).toFixed(1)} KB</div>
                </div>
              </>
            ) : null}
          </div>

          {/* Command Executed */}
          {run?.command && (
            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-md border bg-muted/30 font-mono">
              <span className="text-muted-foreground select-none">$</span>
              <span className="flex-1 ml-2 text-foreground font-semibold">{run.command}</span>
            </div>
          )}

          {/* Console / Terminal Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                <Terminal className="size-3.5" />
                <span>Console Output</span>
              </span>

              {run?.output && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyOutput}
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
                      <span>Copy Output</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="rounded-lg border bg-zinc-950 p-4 text-zinc-200 font-mono text-[12px] leading-relaxed max-h-72 overflow-y-auto shadow-inner">
              {run?.output ? (
                <pre className="whitespace-pre-wrap break-words">{run.output}</pre>
              ) : (
                <p className="text-zinc-500 italic">No console output recorded for this run.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
