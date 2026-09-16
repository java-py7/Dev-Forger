import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Testing | DevForge",
  description: "Automated test runner and test suites for DevForge projects.",
};

export default function TestingPage() {
  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-muted/40 shadow-inner">
        <FlaskConical className="size-6 text-muted-foreground" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Testing
        </h1>
        <Badge variant="secondary" className="text-[10px] font-medium tracking-wide uppercase">
          Coming Soon
        </Badge>
      </div>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Automated test runner, integration test suites, and coverage analytics are coming soon to DevForge.
      </p>
    </main>
  );
}
