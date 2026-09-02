import { Settings } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/common/theme-selector";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
              <Settings className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Settings
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your DevForge preferences and appearance.
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>

            <CardDescription>
              Choose how DevForge looks on your device.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ThemeSelector />
          </CardContent>
        </Card>

      </div>
    </main>
  );
}