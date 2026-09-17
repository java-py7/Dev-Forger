import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrivacyForm } from "@/components/settings/privacy-form";
import { ExternalLink, Lock, ShieldCheck, UserRound } from "lucide-react";

export const metadata = {
  title: "Privacy Settings | DevForge",
  description: "Control your profile visibility and review data privacy settings on DevForge.",
};

export default async function PrivacySettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      visibility: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Privacy</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure who can discover your developer profile and learn how your data is protected.
        </p>
      </div>

      {/* Profile Visibility Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Profile Visibility</CardTitle>
          <CardDescription className="text-xs">
            Determine how your identity and public projects are shared across DevForge.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PrivacyForm initialVisibility={profile?.visibility ?? "PUBLIC"} />
        </CardContent>
      </Card>

      {/* Data Privacy & Sharing Overview */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Data Protection & Privacy</CardTitle>
          <CardDescription className="text-xs">
            How your sensitive account information is treated on DevForge.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Lock className="size-3.5 text-primary" />
                <span>Strictly Private</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your email address, OAuth tokens, and direct chat messages are strictly confidential and never displayed on public pages.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border/70 bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Public Information</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your display name, username, public repositories, and selected developer skills are displayed based on your visibility setting above.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-xs">
            <span className="text-muted-foreground">
              Need to manage your bio, social links, or developer skills?
            </span>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5 text-xs">
                <UserRound className="size-3.5" />
                <span>Profile Settings</span>
                <ExternalLink className="size-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
