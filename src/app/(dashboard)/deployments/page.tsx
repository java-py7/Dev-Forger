import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Deployments | DevForge",
  description: "Cloud hosting, CI/CD pipelines, and preview deployments for DevForge projects.",
};

export default function DeploymentsPage() {
  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center p-6 text-center select-none">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-muted/40 shadow-inner">
        <Rocket className="size-6 text-muted-foreground" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Deployments
        </h1>
        <Badge variant="secondary" className="text-[10px] font-medium tracking-wide uppercase">
          Coming Soon
        </Badge>
      </div>

      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Cloud hosting, continuous delivery pipelines, and live preview environments are coming soon to DevForge.
      </p>
    </main>
  );
}
