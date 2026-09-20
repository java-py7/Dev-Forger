"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical,
  HelpCircle,
  Loader2,
  Play,
  FolderKanban,
  Code2,
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
  };
  userProjects: ProjectOption[];
  isConfigured: boolean;
  canEdit: boolean;
  isRunning: boolean;
  onRunTests: () => void;
  onOpenSetup: () => void;
};

export function TestingHeader({
  currentProject,
  userProjects,
  isConfigured,
  canEdit,
  isRunning,
  onRunTests,
  onOpenSetup,
}: Props) {
  const router = useRouter();

  const projectFilterOptions: FilterOption[] = userProjects.map((p) => ({
    id: p.slug,
    name: p.name,
  }));

  const handleProjectSwitch = (slug: string) => {
    if (slug === "ALL" || slug === currentProject.slug) return;
    router.push(`/testing?project=${slug}`);
  };

  return (
    <div className="flex flex-col gap-4 border-b bg-card/40 px-6 py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Header Left: Icon + Title + Description */}
          <div className="flex items-start gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-muted/40 shadow-xs">
              <FlaskConical className="size-5 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Testing
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

                {isConfigured ? (
                  <Badge variant="secondary" className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                    Not configured
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Inspect discovered test suites, execute project tests, and review historical runs for{" "}
                <span className="font-medium text-foreground">{currentProject.name}</span>.
              </p>
            </div>
          </div>

          {/* Header Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSetup}
              className="h-9 text-xs gap-1.5 cursor-pointer"
            >
              <HelpCircle className="size-3.5" />
              <span>Setup Guide</span>
            </Button>

            <Link
              href={`/projects/${currentProject.slug}/code`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              title="Open Cloud IDE"
            >
              <Code2 className="size-3.5" />
              <span>Cloud IDE</span>
            </Link>

            {canEdit && (
              <Button
                size="sm"
                onClick={onRunTests}
                disabled={isRunning}
                className="h-9 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Running Tests...</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    <span>Run Tests</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
