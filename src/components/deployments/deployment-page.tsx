"use client";

import { useMemo, useState } from "react";
import {
  ProjectDeploymentsData,
  DeploymentItem,
  triggerProjectDeploymentAction,
} from "@/app/(dashboard)/deployments/deployment-actions";
import { DeploymentHeader } from "./deployment-header";
import { DeploymentOverview } from "./deployment-overview";
import { DeploymentFilters } from "./deployment-filters";
import { DeploymentList } from "./deployment-list";
import { DeploymentDetailsSheet } from "./deployment-details-sheet";
import { DeploymentDeployDialog } from "./deployment-deploy-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Cloud, Rocket, X } from "lucide-react";

type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  initialData: ProjectDeploymentsData;
  userProjects: ProjectSummary[];
};

export function DeploymentPage({ initialData, userProjects }: Props) {
  const [data, setData] = useState<ProjectDeploymentsData>(initialData);
  const [isDeploying, setIsDeploying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog / Sheet states
  const [deployOpen, setDeployOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] =
    useState<DeploymentItem | null>(null);

  // Filter states
  const [envFilter, setEnvFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Filter & sort deployments
  const filteredDeployments = useMemo(() => {
    let result = [...data.deployments];

    if (envFilter !== "ALL") {
      result = result.filter((d) => d.environment === envFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((d) => d.status === statusFilter);
    }

    if (sortOrder === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [data.deployments, envFilter, statusFilter, sortOrder]);

  const hasActiveFilters =
    envFilter !== "ALL" || statusFilter !== "ALL" || sortOrder !== "newest";

  const handleResetFilters = () => {
    setEnvFilter("ALL");
    setStatusFilter("ALL");
    setSortOrder("newest");
  };

  const handleOpenDetails = (d: DeploymentItem) => {
    setSelectedDeployment(d);
    setSheetOpen(true);
  };

  const handleTriggerDeploy = async (
    env: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT"
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeploying(true);

    try {
      const res = await triggerProjectDeploymentAction(data.project.id, env);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to trigger deployment.");
        return;
      }

      if (res.deployment) {
        const newDeployment = res.deployment;
        setData((prev) => {
          const nextDeployments = [newDeployment, ...prev.deployments];
          return {
            ...prev,
            deployments: nextDeployments,
            stats: {
              ...prev.stats,
              totalDeployments: nextDeployments.length,
              latestDeployment: newDeployment,
              productionStatus:
                newDeployment.environment === "PRODUCTION"
                  ? newDeployment.status
                  : prev.stats.productionStatus,
            },
          };
        });

        setSuccessMessage(
          `Deployment pipeline queued for ${env.toLowerCase()} environment.`
        );
      }
    } catch {
      setErrorMessage(
        "An unexpected network error occurred while initiating deployment."
      );
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Header */}
      <DeploymentHeader
        currentProject={data.project}
        userProjects={userProjects}
        isProviderConfigured={data.stats.isProviderConfigured}
        canDeploy={data.canDeploy}
        onOpenDeploy={() => setDeployOpen(true)}
        onOpenProviderSetup={() => setDeployOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Notification Banners */}
          {errorMessage && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="shrink-0 cursor-pointer p-0.5 hover:opacity-70"
                aria-label="Dismiss message"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="truncate">{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="shrink-0 cursor-pointer p-0.5 hover:opacity-70"
                aria-label="Dismiss message"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}

          {/* Provider Unconfigured Guidance Card */}
          {!data.stats.isProviderConfigured && data.deployments.length === 0 && (
            <Card className="rounded-xl border border-muted bg-muted/20">
              <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Rocket className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Deployment provider not configured
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                      Connect a hosting provider (such as Vercel, AWS, Cloudflare, or a custom CI/CD webhook) to deploy{" "}
                      <span className="font-medium text-foreground">{data.project.name}</span>. DevForge avoids simulated deployments to ensure complete infrastructure reliability.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeployOpen(true)}
                    className="text-xs h-8 cursor-pointer gap-1.5"
                  >
                    <Cloud className="size-3.5" />
                    <span>View Setup Guide</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overview Metrics */}
          <DeploymentOverview stats={data.stats} />

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <DeploymentFilters
              envFilter={envFilter}
              onEnvChange={setEnvFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
            />

            <span className="text-xs text-muted-foreground">
              Showing {filteredDeployments.length} of {data.deployments.length} deployment{data.deployments.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Deployments List */}
          <DeploymentList
            deployments={filteredDeployments}
            onSelectDeployment={handleOpenDetails}
            onOpenDeploy={() => setDeployOpen(true)}
            canDeploy={data.canDeploy}
          />
        </div>
      </main>

      {/* Slide-out Sheet for details & logs */}
      <DeploymentDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        deployment={selectedDeployment}
      />

      {/* Deploy Confirmation / Provider Configuration Dialog */}
      <DeploymentDeployDialog
        open={deployOpen}
        onOpenChange={setDeployOpen}
        projectSlug={data.project.slug}
        projectName={data.project.name}
        isProviderConfigured={data.stats.isProviderConfigured}
        providerName={data.stats.providerName}
        onTriggerDeploy={handleTriggerDeploy}
        isDeploying={isDeploying}
      />
    </div>
  );
}
