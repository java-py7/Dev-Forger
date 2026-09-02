"use client";

import { useState } from "react";

import {
  Brain,
  Cloud,
  Code2,
  Database,
  Gamepad2,
  Globe,
  Lock,
  Palette,
  Server,
  Smartphone,
  Sparkles,
  GitBranch,
  Boxes,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Interest = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

type UserInterest = {
  interestId: string;
};

type InterestsProps = {
  interests: Interest[];
  selectedInterests: UserInterest[];
};

const icons = [
  Globe,
  Brain,
  Smartphone,
  Gamepad2,
  GitBranch,
  Cloud,
  Lock,
  Database,
  Server,
  Palette,
  Code2,
  Boxes,
  Sparkles,
];

export function Interests({
  interests,
  selectedInterests,
}: InterestsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    selectedInterests.map((item) => item.interestId)
  );

  function toggleInterest(interestId: string) {
    setSelectedIds((current) =>
      current.includes(interestId)
        ? current.filter((id) => id !== interestId)
        : [...current, interestId]
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interests</CardTitle>

        <CardDescription>
          Choose the areas of development and technology you are
          interested in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {interests.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Sparkles className="mx-auto size-6 text-muted-foreground" />

            <p className="mt-2 text-sm font-medium">
              No interests available
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Interests will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {interests.map((interest, index) => {
              const selected = selectedIds.includes(interest.id);

              const Icon = icons[index % icons.length];

              return (
                <label
                  key={interest.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    selected
                      ? "border-foreground bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="interestIds"
                    value={interest.id}
                    checked={selected}
                    onChange={() => toggleInterest(interest.id)}
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
                      <p className="text-sm font-medium">
                        {interest.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {interest.description ?? interest.category ?? "Technology"}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Keep selected values inside the parent saveProfile form */}
        {selectedIds.map((interestId) => (
          <input
            key={interestId}
            type="hidden"
            name="interestIds"
            value={interestId}
          />
        ))}
      </CardContent>
    </Card>
  );
}