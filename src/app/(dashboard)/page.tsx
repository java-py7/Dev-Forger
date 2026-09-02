import {
  Activity,
  FolderKanban,
  Users,
  GitBranch,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="min-h-screen">
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome back.
          </h2>

          <p className="mt-2 text-muted-foreground">
            Here's what's happening across your development workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Projects
              </CardTitle>

              <FolderKanban className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold">
                0
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Active projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Team Members
              </CardTitle>

              <Users className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold">
                0
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Developers you're working with
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Git Repositories
              </CardTitle>

              <GitBranch className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold">
                0
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Connected repositories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Activity
              </CardTitle>

              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-semibold">
                0
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                Recent activities
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}