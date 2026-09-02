"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const themes = [
  {
    value: "light",
    label: "Light",
    description: "Use a light appearance",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use a dark appearance",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Follow your device settings",
    icon: Monitor,
  },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {themes.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.value}
              className="flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center"
            >
              <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
                <Icon className="size-5" />
              </div>

              <div>
                <p className="text-sm font-medium">
                  {item.label}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {themes.map((item) => {
        const Icon = item.icon;
        const selected = theme === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setTheme(item.value)}
            className={cn(
              "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border p-5 text-center transition-colors",
              "hover:bg-accent",
              selected
                ? "border-foreground bg-accent"
                : "border-border"
            )}
          >
            {selected && (
              <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="size-3" />
              </div>
            )}

            <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
              <Icon className="size-5" />
            </div>

            <div>
              <p className="text-sm font-medium">
                {item.label}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}