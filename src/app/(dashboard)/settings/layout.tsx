import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata = {
  title: "Settings | DevForge",
  description: "Manage your DevForge preferences, account, and developer configuration.",
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-full">
      {/* Settings Header */}
      <div className="border-b">
        <div className="px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-8xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                <Settings className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Settings
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your account, preferences, and developer workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content & Sidebar Layout */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-8xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Side Navigation */}
            <aside className="w-full md:w-52 md:shrink-0">
              <SettingsNav />
            </aside>

            {/* Main Settings Panel */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
