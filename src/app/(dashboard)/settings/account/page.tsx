import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/components/settings/account-form";
import { Calendar, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Account Settings | DevForge",
  description: "View and manage your account information and connected providers.",
};

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      accounts: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user.email?.slice(0, 2).toUpperCase() ||
    "DF";

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const lastUpdated = new Date(user.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const googleAccount = user.accounts.find((a) => a.provider === "google");
  const githubAccount = user.accounts.find((a) => a.provider === "github");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your account identity, update profile details, and review authentication credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold">Profile Identity</CardTitle>
          <CardDescription className="text-xs">
            Your display credentials across DevForge workspaces and projects.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-xl border border-border/80">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="rounded-xl text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-foreground truncate">
                  {user.name || "Developer"}
                </h3>
                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                  {user.role}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {user.username ? `@${user.username}` : "No username set"}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Calendar className="size-3.5" />
                <span>Member since {memberSince}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 pt-4">
            <AccountForm
              initialName={user.name ?? ""}
              initialUsername={user.username ?? ""}
              email={user.email}
            />
          </div>
        </CardContent>
      </Card>

      {/* Connected Authentication Providers */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Connected Providers</CardTitle>
          <CardDescription className="text-xs">
            External identity providers linked to your DevForge account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {googleAccount ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-background border border-border/80">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-sm">Google</span>
                    <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Signed in as {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Active</span>
              </div>
            </div>
          ) : null}

          {githubAccount ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-muted/20 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-background border border-border/80">
                  <svg className="size-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-sm">GitHub</span>
                    <Badge variant="secondary" className="text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Linked to your GitHub profile
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>Active</span>
              </div>
            </div>
          ) : null}

          {!googleAccount && !githubAccount && (
            <div className="p-3 text-xs text-muted-foreground">
              Standard email authentication active.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Metadata Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Account Metadata</CardTitle>
          <CardDescription className="text-xs">
            System records and audit timestamps for this developer account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium tracking-wider">
                User ID
              </span>
              <p className="font-mono text-xs text-foreground mt-1 truncate">
                {user.id}
              </p>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20">
              <span className="text-[11px] text-muted-foreground uppercase font-medium tracking-wider">
                Last Updated
              </span>
              <p className="text-xs text-foreground mt-1">
                {lastUpdated}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
