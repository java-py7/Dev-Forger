"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Cloud,
  FolderKanban,
  Code2,
  ExternalLink,
} from "lucide-react";

type ProjectOption = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  currentProject: {
    id: string;
    name: string;
    slug: string;
    websiteUrl: string | null;
  };
  userProjects: ProjectOption[];
  isProviderConfigured: boolean;
  canDeploy: boolean;
  onOpenDeploy: () => void;
  onOpenProviderSetup: () => void;
};

export function DeploymentHeader({
  currentProject,
  userProjects,
  isProviderConfigured,
  canDeploy,
  onOpenDeploy,
  onOpenProviderSetup,
}: Props) {
  const router = useRouter();

  const projectFilterOptions: FilterOption[] = userProjects.map((p) => ({
    id: p.slug,
    name: p.name,
  }));

  const handleProjectSwitch = (slug: string) => {
    if (slug === "ALL" || slug === currentProject.slug) return;
    router.push(`/deployments?project=${slug}`);
  };

  return (
    <div className="flex flex-col gap-4 border-b bg-card/40 px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Header Left: Icon + Title + Description */}
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-muted/40 shadow-xs">
              <Rocket className="size-5 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Deployments
                </h1>

                {/* Project selector / context */}
                {userProjects.length > 1 ? (
                  <div className="w-44">
                    <FilterSelect
                      value={currentProject.slug}
                      placeholder="Select Project"
                      options={projectFilterOptions}
                      onChange={handleProjectSwitch}
                    />
                  </div>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs font-normal">
                    <FolderKanban className="size-3 text-muted-foreground" />
                    <span>{currentProject.name}</span>
                  </Badge>
                )}

                {isProviderConfigured ? (
                  <Badge variant="secondary" className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                    Provider connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                    Provider not configured
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Continuous delivery pipelines, build logs, and live preview environments for{" "}
                <span className="font-medium text-foreground">{currentProject.name}</span>.
              </p>
            </div>
          </div>

          {/* Header Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProviderSetup}
              className="h-9 text-xs gap-1.5 cursor-pointer"
            >
              <Cloud className="size-3.5" />
              <span>Provider Setup</span>
            </Button>

            {currentProject.websiteUrl && (
              <a
                href={currentProject.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                title="Open production website"
              >
                <span>Live Site</span>
                <ExternalLink className="size-3" />
              </a>
            )}

            <Link
              href={`/projects/${currentProject.slug}/code`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              title="Open Cloud IDE"
            >
              <Code2 className="size-3.5" />
              <span>Cloud IDE</span>
            </Link>

            {canDeploy && (
              <Button
                size="sm"
                onClick={onOpenDeploy}
                className="h-9 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                <Rocket className="size-3.5" />
                <span>Deploy</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
