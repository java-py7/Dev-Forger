import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/common/theme-provider";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, unreadNotificationsCount] = await Promise.all([
    prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
    }),
    prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    }),
  ]);

  if (!profile) {
    redirect("/profile/setup");
  }

  return (
    <ThemeProvider>
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
        initialUnreadCount={unreadNotificationsCount}
      />

      <SidebarInset className="!m-0 !rounded-none !shadow-none">
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <SidebarTrigger className="cursor-pointer" />

          <div className="h-5 w-px bg-border" />

          <div className="text-sm font-medium">
            DevForge
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </ThemeProvider>
  );
}