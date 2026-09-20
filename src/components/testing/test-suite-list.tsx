"use client";

import Link from "next/link";
import { TestSuiteItem } from "@/app/(dashboard)/testing/testing-actions";
import { TestStatusBadge } from "./test-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  FileCode2,
  FlaskConical,
  FolderTree,
  HelpCircle,
} from "lucide-react";

type Props = {
  suites: TestSuiteItem[];
  projectSlug: string;
  onSelectSuite: (suite: TestSuiteItem) => void;
  onOpenSetup: () => void;
};

export function TestSuiteList({
  suites,
  projectSlug,
  onSelectSuite,
  onOpenSetup,
}: Props) {
  return (
    <Card className="rounded-xl border bg-card/60">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5">
        <div className="flex items-center gap-2">
          <FolderTree className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Test Suites</CardTitle>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {suites.length} {suites.length === 1 ? "Suite" : "Suites"}
          </Badge>
        </div>

        {suites.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSetup}
            className="h-8 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="size-3.5" />
            <span>How to add suites</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {suites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-lg border border-dashed bg-muted/10">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FlaskConical className="size-5" />
            </div>
            <h4 className="mt-3 text-sm font-semibold">No test suites detected</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              DevForge scans your project workspace for files matching{" "}
              <code className="text-foreground">*.test.*</code> or{" "}
              <code className="text-foreground">*.spec.*</code>. No test files were found.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSetup}
                className="text-xs h-8 cursor-pointer"
              >
                View Setup Guide
              </Button>
              <Link
                href={`/projects/${projectSlug}/code`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Code2 className="size-3.5" />
                <span>Create Test File</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {suites.map((suite) => (
              <div
                key={suite.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 border mt-0.5">
                    <FileCode2 className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {suite.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        ({(suite.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                      {suite.path}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="text-xs text-muted-foreground">
                    ~{suite.testsCount} {suite.testsCount === 1 ? "test" : "tests"}
                  </span>
                  <TestStatusBadge status={suite.lastStatus} size="sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectSuite(suite)}
                    className="h-7 text-xs px-2.5 cursor-pointer"
                  >
                    Details
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
