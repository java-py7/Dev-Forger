"use client";

import { useState } from "react";
import { FolderKanban, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WorkPreferencesProps = {
  collaborationPreference: string | null;
  preferredProjectSize: string | null;
};

const collaborationOptions = [
  {
    value: "INDIVIDUAL",
    label: "Individual",
    description: "I prefer working independently.",
  },
  {
    value: "TEAM",
    label: "Team",
    description: "I prefer working with other developers.",
  },
  {
    value: "BOTH",
    label: "Both",
    description: "I'm comfortable working either way.",
  },
];

const projectSizeOptions = [
  {
    value: "SMALL",
    label: "Small",
    description: "Small projects with a focused scope.",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Projects with a moderate scope and team.",
  },
  {
    value: "LARGE",
    label: "Large",
    description: "Large projects with more features or people.",
  },
  {
    value: "ANY",
    label: "Any",
    description: "I'm open to projects of any size.",
  },
];

export function WorkPreferences({
  collaborationPreference,
  preferredProjectSize,
}: WorkPreferencesProps) {
  const [selectedCollaboration, setSelectedCollaboration] =
    useState(collaborationPreference ?? "");

  const [selectedProjectSize, setSelectedProjectSize] = useState(
    preferredProjectSize ?? ""
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work preferences</CardTitle>

        <CardDescription>
          Tell other developers how you prefer to work and what kind of
          projects interest you.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Collaboration preference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">Collaboration</h3>

              <p className="text-xs text-muted-foreground">
                How do you prefer to work?
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {collaborationOptions.map((option) => {
              const selected = selectedCollaboration === option.value;

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
                    name="collaborationPreference"
                    value={option.value}
                    checked={selected}
                    onChange={() =>
                      setSelectedCollaboration(option.value)
                    }
                    className="sr-only"
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && (
                        <div className="size-2 rounded-full bg-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Project size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">
                Preferred project size
              </h3>

              <p className="text-xs text-muted-foreground">
                What size of projects would you like to work on?
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {projectSizeOptions.map((option) => {
              const selected = selectedProjectSize === option.value;

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
                    name="preferredProjectSize"
                    value={option.value}
                    checked={selected}
                    onChange={() =>
                      setSelectedProjectSize(option.value)
                    }
                    className="sr-only"
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-foreground"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && (
                        <div className="size-2 rounded-full bg-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}