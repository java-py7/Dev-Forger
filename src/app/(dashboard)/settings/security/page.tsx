import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SecuritySessions } from "@/components/settings/security-sessions";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Security Settings | DevForge",
  description: "Manage your authentication credentials, active sessions, and account security on DevForge.",
};

export default async function SecuritySettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [accounts, sessions] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        type: true,
      },
    }),
    prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        expires: true,
      },
      orderBy: { expires: "desc" },
    }),
  ]);

  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    expires: s.expires.toISOString(),
  }));

  const googleAccount = accounts.find((a) => a.provider === "google");
  const githubAccount = accounts.find((a) => a.provider === "github");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review your authentication provider, monitor active database sessions, and manage access credentials.
        </p>
      </div>

      {/* Authentication Provider Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Authentication Method</CardTitle>
          <CardDescription className="text-xs">
            Your DevForge account is secured with OAuth Single Sign-On (SSO).
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-muted/20 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border/80 text-foreground">
                <ShieldCheck className="size-5 text-emerald-500" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">
                    {googleAccount ? "Google Single Sign-On" : githubAccount ? "GitHub OAuth" : "OAuth Provider"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    SSO Protected
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Passwordless authentication backed by OAuth 2.0 protocol
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Two-Factor Authentication managed by provider</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-border/70 bg-background/50 text-xs text-muted-foreground space-y-1 leading-relaxed">
            <p className="font-medium text-foreground text-xs flex items-center gap-1.5">
              <KeyRound className="size-3.5 text-primary" />
              <span>Password Security Notice</span>
            </p>
            <p className="text-[11px]">
              DevForge never stores raw passwords on server databases. Your login credentials, two-factor authentication, and account recovery are managed directly and securely through your Google security settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Database Sessions Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Active Sessions</CardTitle>
            <Badge variant="outline" className="text-xs">
              {sessions.length} {sessions.length === 1 ? "Session" : "Sessions"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Persistent database sessions authenticated via Auth.js and Prisma.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SecuritySessions sessions={serializedSessions} />
        </CardContent>
      </Card>
    </div>
  );
}
