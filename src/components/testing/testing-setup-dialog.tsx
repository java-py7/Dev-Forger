"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  ExternalLink,
  FileCode,
  FlaskConical,
  Package,
  Terminal,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
};

const NODE_TEST_SNIPPET = `{
  "scripts": {
    "test": "node --test"
  }
}`;

const VITEST_SNIPPET = `{
  "scripts": {
    "test": "vitest run"
  }
}`;

const TEST_FILE_SNIPPET = `import { describe, it } from "node:test";
import assert from "node:assert";

describe("Core application logic", () => {
  it("should validate truthy arithmetic operations", () => {
    assert.strictEqual(1 + 1, 2);
  });
});`;

export function TestingSetupDialog({ open, onOpenChange, projectSlug }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FlaskConical className="size-4" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Configuring Testing in DevForge
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            DevForge inspects your workspace for test frameworks and test suites. Follow these steps to configure automated test execution.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pt-2 pr-1 text-sm">
          {/* Step 1: Add a test script */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center gap-2 font-medium">
              <Badge variant="outline" className="size-5 rounded-full p-0 flex items-center justify-center text-xs">
                1
              </Badge>
              <Package className="size-4 text-primary" />
              <span>Configure package.json test script</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Open your project&apos;s <code className="text-foreground">package.json</code> and define a <code className="text-foreground">&quot;test&quot;</code> script. DevForge supports Node.js native test runner, Vitest, Jest, and custom runners:
            </p>

            <div className="space-y-2">
              <span className="text-[11px] text-muted-foreground font-medium">
                Option A: Node.js Built-in Test Runner (Zero configuration)
              </span>
              <pre className="rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-200 shadow-inner overflow-x-auto">
                <code>{NODE_TEST_SNIPPET}</code>
              </pre>

              <span className="text-[11px] text-muted-foreground font-medium pt-1 block">
                Option B: Vitest (Fast and modern runner)
              </span>
              <pre className="rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-200 shadow-inner overflow-x-auto">
                <code>{VITEST_SNIPPET}</code>
              </pre>
            </div>
          </div>

          {/* Step 2: Create test files */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center gap-2 font-medium">
              <Badge variant="outline" className="size-5 rounded-full p-0 flex items-center justify-center text-xs">
                2
              </Badge>
              <FileCode className="size-4 text-primary" />
              <span>Create test suite files</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DevForge automatically discovers test files following standard naming conventions:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><code className="text-foreground">*.test.ts</code>, <code className="text-foreground">*.test.js</code>, <code className="text-foreground">*.test.tsx</code></li>
              <li><code className="text-foreground">*.spec.ts</code>, <code className="text-foreground">*.spec.js</code>, <code className="text-foreground">*.spec.tsx</code></li>
              <li>Any test file placed inside a <code className="text-foreground">__tests__/</code> directory</li>
            </ul>

            <pre className="rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-200 shadow-inner overflow-x-auto">
              <code>{TEST_FILE_SNIPPET}</code>
            </pre>
          </div>

          {/* Step 3: Run directly or via IDE */}
          <div className="space-y-2 rounded-lg border p-4 bg-muted/10">
            <div className="flex items-center gap-2 font-medium">
              <Badge variant="outline" className="size-5 rounded-full p-0 flex items-center justify-center text-xs">
                3
              </Badge>
              <Terminal className="size-4 text-primary" />
              <span>Run tests on demand</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once configured, you can click <span className="font-semibold text-foreground">&quot;Run tests&quot;</span> on this dashboard to execute tests in an isolated workspace process, or launch tests inside the project terminal.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-4 mt-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-xs"
          >
            Close
          </Button>

          <Link
            href={`/projects/${projectSlug}/code`}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <Code2 className="size-3.5" />
            <span>Open in Cloud IDE</span>
            <ExternalLink className="size-3 ml-0.5 opacity-70" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
