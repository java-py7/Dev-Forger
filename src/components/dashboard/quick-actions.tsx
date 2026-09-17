"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  KanbanSquare,
  Code2,
  MessageSquare,
  Compass,
  Bell,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateProjectDialog, AvailableSkill } from "@/components/projects/create-project-dialog";

type QuickActionsProps = {
  availableSkills?: AvailableSkill[];
};

export function QuickActions({ availableSkills = [] }: QuickActionsProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const actions = [
    {
      title: "Kanban Board",
      description: "Manage project tasks & sprint boards",
      href: "/kanban",
      icon: KanbanSquare,
      color: "text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Cloud IDE",
      description: "Code & edit workspace files in real-time",
      href: "/workspace",
      icon: Code2,
      color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Team Chat",
      description: "Collaborate across project channels",
      href: "/chat",
      icon: MessageSquare,
      color: "text-purple-500 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Discover Talent",
      description: "Find developers and open projects",
      href: "/discover",
      icon: Compass,
      color: "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Notifications",
      description: "View invites and workspace alerts",
      href: "/notifications",
      icon: Bell,
      color: "text-rose-500 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <>
      <Card className="border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Primary Action Button: Create Project Dialog */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-primary/25 bg-primary/5 hover:bg-primary/10 transition-colors text-left group cursor-pointer"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <Plus className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>Create New Project</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">New</span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Set up a project, invite members, and start building
              </p>
            </div>
          </button>

          {/* Grid of feature shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-border/70 hover:border-border hover:bg-muted/40 transition-colors group"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${action.color}`}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {action.title}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        availableSkills={availableSkills}
      />
    </>
  );
}
