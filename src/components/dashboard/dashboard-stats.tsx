import { Activity, FolderKanban, GitBranch, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DashboardStatsProps = {
  projectsCount: number;
  activeProjectsCount: number;
  collaboratorsCount: number;
  repositoriesCount: number;
  activityCount: number;
};

export function DashboardStats({
  projectsCount,
  activeProjectsCount,
  collaboratorsCount,
  repositoriesCount,
  activityCount,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Projects",
      value: projectsCount,
      subtitle: `${activeProjectsCount} active ${activeProjectsCount === 1 ? "project" : "projects"}`,
      icon: FolderKanban,
      iconClass: "text-blue-500 dark:text-blue-400 bg-blue-500/10",
    },
    {
      title: "Team Members",
      value: collaboratorsCount,
      subtitle: "Active collaborators",
      icon: Users,
      iconClass: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
    },
    {
      title: "Git Repositories",
      value: repositoriesCount,
      subtitle: "Connected repositories",
      icon: GitBranch,
      iconClass: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "Recent Activity",
      value: activityCount,
      subtitle: "Logged workspace events",
      icon: Activity,
      iconClass: "text-amber-500 dark:text-amber-400 bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.title}
            className="border-border/80 bg-card/40 transition-colors hover:border-border/90 shadow-xs"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </span>

                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </div>

                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {stat.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
