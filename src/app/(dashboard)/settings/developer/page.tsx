import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code2,
  ExternalLink,
  FolderGit2,
  GitBranch,
  Laptop,
  Terminal,
  UserRound,
} from "lucide-react";

export const metadata = {
  title: "Developer Settings | DevForge",
  description: "Manage your cloud workspaces, repositories, and developer platform configuration.",
};

export default async function DeveloperSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, workspaces, repositories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    }),
    prisma.workspace.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.repository.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        provider: true,
        defaultBranch: true,
        url: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Developer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure your developer workspace environment, connected repositories, and cloud editor tools.
          </p>
        </div>
        <Badge variant="outline" className="text-xs uppercase font-mono">
          {user?.role ?? "USER"}
        </Badge>
      </div>

      {/* Cloud IDE & Workspaces Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Cloud Workspaces</CardTitle>
            <Link href="/workspace">
              <Button size="sm" variant="outline" className="cursor-pointer gap-1.5 text-xs">
                <Laptop className="size-3.5" />
                <span>Launch Workspace</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
          </div>
          <CardDescription className="text-xs">
            Isolated code execution environments and Monaco Editor sessions on DevForge.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Active Workspaces
              </span>
              <p className="text-xl font-semibold text-foreground mt-1">
                {workspaces.length}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                IDE Runtime
              </span>
              <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                <span>Monaco Engine</span>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Terminal Emulator
              </span>
              <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-1.5">
                <Terminal className="size-3.5 text-primary" />
                <span>xterm.js + PTY</span>
              </p>
            </div>
          </div>

          {workspaces.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Your Workspaces
              </span>
              <div className="mt-2 rounded-xl border border-border/70 divide-y divide-border/60 overflow-hidden bg-background/50">
                {workspaces.map((ws) => (
                  <div key={ws.id} className="flex items-center justify-between p-3 text-xs">
                    <span className="font-medium text-foreground">{ws.name}</span>
                    <span className="text-muted-foreground text-[11px]">
                      Created {new Date(ws.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Repositories Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Connected Repositories</CardTitle>
          <CardDescription className="text-xs">
            Source control repositories linked to your DevForge developer profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <FolderGit2 className="size-3.5 text-primary" />
                <span>Default VCS Provider</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                GitHub integration with OAuth authentication.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <GitBranch className="size-3.5 text-primary" />
                <span>Default Branch Convention</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">main</code> for all new projects.
              </p>
            </div>
          </div>

          {repositories.length > 0 ? (
            <div className="pt-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Linked Repositories ({repositories.length})
              </span>
              <div className="mt-2 rounded-xl border border-border/70 divide-y divide-border/60 overflow-hidden bg-background/50">
                {repositories.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 text-xs">
                    <span className="font-medium text-foreground font-mono">{repo.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {repo.defaultBranch}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground pt-1">
              Repositories are automatically linked when you create or import projects into DevForge.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Developer Profile Link Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Skills & Work Preferences</CardTitle>
          <CardDescription className="text-xs">
            Your tech stack, roles, work mode, and project size preferences are managed on your Profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground max-w-md">
            Update your programming languages, frameworks, years of experience, and availability on your comprehensive Developer Profile.
          </p>

          <Link href="/profile">
            <Button variant="outline" size="sm" className="cursor-pointer gap-1.5 text-xs">
              <UserRound className="size-3.5" />
              <span>Edit Developer Profile</span>
              <ExternalLink className="size-3" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
