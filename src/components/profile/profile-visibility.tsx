"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProfileVisibilityProps = {
  visibility: string;
};

const visibilityOptions = [
  {
    value: "PUBLIC",
    label: "Public",
    description:
      "Your profile can be discovered by other developers on DevForge.",
    icon: Eye,
  },
  {
    value: "PRIVATE",
    label: "Private",
    description:
      "Your profile will not appear in the DevForge developer network.",
    icon: EyeOff,
  },
];

export function ProfileVisibility({
  visibility,
}: ProfileVisibilityProps) {
  const [selectedVisibility, setSelectedVisibility] = useState(
    visibility || "PUBLIC"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile visibility</CardTitle>

        <CardDescription>
          Control whether your developer profile appears in Discover.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibilityOptions.map((option) => {
            const selected = selectedVisibility === option.value;
            const Icon = option.icon;

            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  selected
                    ? "border-foreground bg-accent"
                    : "hover:bg-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="profileVisibility"
                  value={option.value}
                  checked={selected}
                  onChange={() =>
                    setSelectedVisibility(option.value)
                  }
                  className="sr-only"
                />

                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${
                      selected
                        ? "border-foreground bg-background"
                        : "bg-muted/40"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {option.label}
                      </p>

                      {selected && (
                        <span className="text-xs text-muted-foreground">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}