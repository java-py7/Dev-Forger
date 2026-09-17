import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/common/theme-selector";

export const metadata = {
  title: "Appearance Settings | DevForge",
  description: "Choose how DevForge looks on your device.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Customize the theme and visual appearance of DevForge across your devices.
        </p>
      </div>

      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Theme Mode</CardTitle>
          <CardDescription className="text-xs">
            Select your preferred color scheme or synchronize with your operating system.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>
    </div>
  );
}