"use client";

import Link from "next/link";
import {
  Code2,
  Tag,
  Globe,
  FolderGit2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BoardColumnWithTasks,
  ProjectMemberItem,
} from "@/app/(dashboard)/projects/[slug]/task-actions";

type ProjectOverviewTabProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    language: string | null;
    visibility: string;
    status: string;
    repositoryUrl: string | null;
    websiteUrl: string | null;
    createdAt: string;
  };
  columns: BoardColumnWithTasks[];
  members: ProjectMemberItem[];
};

export function ProjectOverviewTab({
  project,
  columns,
  members,
}: ProjectOverviewTabProps) {
  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);

  const doneCol = columns.find(
    (c) => c.name.toUpperCase() === "DONE" || c.name.toUpperCase() === "COMPLETED"
  );
  const doneTasks = doneCol ? doneCol.tasks.length : 0;
  const completionPercentage =
    totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <ListTodo className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all columns</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{doneTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionPercentage}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Team Members
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active contributors</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Created
            </CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold mt-1">
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Status: {project.status.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two column layout: About + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: About project */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                About Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p className="text-muted-foreground">
                {project.description || "No project description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                {project.language && (
                  <Badge variant="outline" className="gap-1.5 py-1 text-xs">
                    <Code2 className="size-3 text-primary" />
                    {project.language}
                  </Badge>
                )}

                {project.category && (
                  <Badge variant="secondary" className="gap-1.5 py-1 text-xs">
                    <Tag className="size-3" />
                    {project.category}
                  </Badge>
                )}
              </div>

              {/* External Links */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                {project.repositoryUrl && (
                  <Link
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FolderGit2 className="size-4" />
                    <span>Repository</span>
                  </Link>
                )}

                {project.websiteUrl && (
                  <Link
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="size-4" />
                    <span>Live Website</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members preview */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Project Team ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2.5"
                  >
                    <Avatar className="size-8 border">
                      <AvatarImage src={m.user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {m.user.name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {m.user.name || m.user.username}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {m.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Column Breakdown */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Column Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {columns.map((col) => {
                const count = col.tasks.length;
                const percentage =
                  totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={col.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {col.name}
                      </span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
