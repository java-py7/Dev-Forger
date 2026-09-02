import {
  Code2,
  FolderKanban,
  GitCommitHorizontal,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DeveloperStatsProps = {
  projectsCompleted: number;
  teamsJoined: number;
  contributions: number;
  skills: number;
};

export function DeveloperStats({
  projectsCompleted,
  teamsJoined,
  contributions,
  skills,
}: DeveloperStatsProps) {
  const stats = [
    {
      label: "Projects completed",
      value: projectsCompleted,
      icon: FolderKanban,
    },
    {
      label: "Teams joined",
      value: teamsJoined,
      icon: Users,
    },
    {
      label: "Contributions",
      value: contributions,
      icon: GitCommitHorizontal,
    },
    {
      label: "Skills",
      value: skills,
      icon: Code2,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer stats</CardTitle>

        <CardDescription>
          Your activity and progress on DevForge.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <span className="text-2xl font-semibold tracking-tight">
                    {stat.value}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium">
                  {stat.label}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.label === "Skills"
                    ? "Skills added to your profile"
                    : "Calculated from your DevForge activity"}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}