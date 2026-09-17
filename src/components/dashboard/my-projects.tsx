"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog, AvailableSkill } from "@/components/projects/create-project-dialog";

export type DashboardProject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  visibility: string;
  category: string | null;
  language: string | null;
  memberCount: number;
  updatedAt: string | Date;
};

type MyProjectsProps = {
  projects: DashboardProject[];
  availableSkills?: AvailableSkill[];
};

function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-medium">
          Active
        </Badge>
      );
    case "PLANNING":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 text-[10px] font-medium">
          Planning
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-500 text-[10px] font-medium">
          Completed
        </Badge>
      );
    case "ARCHIVED":
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground text-[10px] font-medium">
          {status.toLowerCase()}
        </Badge>
      );
  }
}

export function MyProjects({
  projects,
  availableSkills = [],
}: MyProjectsProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Card className="border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">My Projects</CardTitle>
              {projects.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({projects.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="cursor-pointer text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New Project</span>
              </Button>

              <Link href="/projects">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
                >
                  <span>View all</span>
                  <ArrowRight className="size-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-border/70 bg-background/50 p-4 transition-all hover:border-border hover:bg-muted/30 hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      {getStatusBadge(project.status)}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {project.language && (
                        <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">
                          {project.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        <span>{project.memberCount}</span>
                      </span>
                    </div>

                    <span>{formatRelativeTime(project.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 bg-card/20 py-12 px-4 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                <FolderKanban className="size-5" />
              </div>

              <h3 className="text-sm font-medium text-foreground">No projects yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Create your first project to start building and collaborating with developers.
              </p>

              <div className="mt-4">
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="cursor-pointer gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  <span>Create project</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableSkills={availableSkills}
      />
    </>
  );
}
