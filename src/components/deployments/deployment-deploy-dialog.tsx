"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Cloud,
  ExternalLink,
  GitBranch,
  Layers,
  Loader2,
  Rocket,
  Settings,
  ShieldAlert,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  projectName: string;
  isProviderConfigured: boolean;
  providerName: string | null;
  onTriggerDeploy: (env: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT") => Promise<void>;
  isDeploying: boolean;
};

export function DeploymentDeployDialog({
  open,
  onOpenChange,
  projectSlug,
  projectName,
  isProviderConfigured,
  providerName,
  onTriggerDeploy,
  isDeploying,
}: Props) {
  const [selectedEnv, setSelectedEnv] = useState<
    "PRODUCTION" | "PREVIEW" | "DEVELOPMENT"
  >("PRODUCTION");

  const handleConfirmDeploy = async () => {
    await onTriggerDeploy(selectedEnv);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="space-y-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="size-4" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              {isProviderConfigured ? "Deploy Project" : "Deployment Provider Not Configured"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {isProviderConfigured
              ? `Initiate a new build and deployment for ${projectName}.`
              : `Configure an external cloud hosting provider or deployment pipeline for ${projectName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-2 pr-1 text-sm">
          {!isProviderConfigured ? (
            /* Unconfigured Provider State */
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold">Simulated deployments disabled</span>
                  <p className="text-muted-foreground leading-relaxed">
                    DevForge strictly enforces real infrastructure integration. To ensure production integrity, deployments cannot be simulated without an authenticated cloud provider or CI/CD webhook.
                  </p>
                </div>
              </div>

              {/* Setup Requirements */}
              <div className="space-y-3 rounded-lg border p-4 bg-muted/10 text-xs">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Cloud className="size-4 text-primary" />
                  <span>Required Configuration Checklist</span>
                </h4>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted border font-mono text-[10px]">
                      1
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Select a Cloud Provider</span>
                      <p className="text-muted-foreground mt-0.5">
                        Supported providers: Vercel, AWS Amplify, Cloudflare Pages, Railway, or Custom Webhooks.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted border font-mono text-[10px]">
                      2
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Set Provider Credentials</span>
                      <p className="text-muted-foreground mt-0.5">
                        Configure <code className="text-foreground">VERCEL_TOKEN</code>, <code className="text-foreground">AWS_ACCESS_KEY_ID</code>, or <code className="text-foreground">DEPLOYMENT_WEBHOOK_URL</code> in environment secrets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted border font-mono text-[10px]">
                      3
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Verify Build Commands</span>
                      <p className="text-muted-foreground mt-0.5">
                        Ensure <code className="text-foreground">npm run build</code> generates expected production artifacts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Configured Provider - Target Environment Selector */
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/20">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <span className="text-muted-foreground">
                  Connected Provider: <strong className="text-foreground">{providerName}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-foreground">Target Environment</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["PRODUCTION", "PREVIEW", "DEVELOPMENT"] as const).map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setSelectedEnv(env)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-colors cursor-pointer ${
                        selectedEnv === env
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
                          : "border-border hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <Layers className="size-4 mb-1.5" />
                      <span className="capitalize">{env.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/10 text-muted-foreground">
                <GitBranch className="size-4 text-primary shrink-0" />
                <span>
                  Source: <strong className="text-foreground">main branch</strong> (latest commit)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4 mt-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-xs"
          >
            Cancel
          </Button>

          {!isProviderConfigured ? (
            <Link
              href={`/projects/${projectSlug}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Settings className="size-3.5" />
              <span>Project Settings</span>
              <ExternalLink className="size-3 ml-0.5 opacity-70" />
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={handleConfirmDeploy}
              disabled={isDeploying}
              className="text-xs h-8 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Initiating...</span>
                </>
              ) : (
                <>
                  <Rocket className="size-3.5" />
                  <span>Confirm & Deploy</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
