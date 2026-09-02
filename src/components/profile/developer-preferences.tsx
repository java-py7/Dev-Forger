"use client";

import { useState } from "react";
import { Briefcase, Search, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

type DeveloperRole = {
  id: string;
  name: string;
  description: string | null;
};

type LookingFor = {
  id: string;
  name: string;
  description: string | null;
};

type UserRole = {
  roleId: string;
};

type UserLookingFor = {
  lookingForId: string;
};

type DeveloperPreferencesProps = {
  roles: DeveloperRole[];
  lookingFor: LookingFor[];
  selectedRoles: UserRole[];
  selectedLookingFor: UserLookingFor[];
  availability: string;
};

export function DeveloperPreferences({
  roles,
  lookingFor,
  selectedRoles,
  selectedLookingFor,
  availability,
}: DeveloperPreferencesProps) {
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    selectedRoles.map((role) => role.roleId)
  );

  const [selectedLookingForIds, setSelectedLookingForIds] =
    useState<string[]>(
      selectedLookingFor.map((item) => item.lookingForId)
    );

  const [selectedAvailability, setSelectedAvailability] =
    useState(availability);

  function toggleRole(roleId: string) {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    );
  }

  function toggleLookingFor(id: string) {
    setSelectedLookingForIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer preferences</CardTitle>

        <CardDescription>
          Tell other developers what you do and what you are looking for.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">
                Preferred role
              </h3>

              <p className="text-xs text-muted-foreground">
                Select one or more roles you are interested in.
              </p>
            </div>
          </div>

          {roles.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((role) => {
                const selected = selectedRoleIds.includes(role.id);

                return (
                  <label
                    key={role.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-foreground bg-accent"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleRole(role.id)}
                      className="sr-only"
                    />

                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-foreground bg-foreground text-background"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {selected && (
                          <span className="text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {role.name}
                        </p>

                        {role.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No developer roles available.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">
                Looking for
              </h3>

              <p className="text-xs text-muted-foreground">
                Select everything you are currently interested in.
              </p>
            </div>
          </div>

          {lookingFor.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {lookingFor.map((item) => {
                const selected = selectedLookingForIds.includes(
                  item.id
                );

                return (
                  <label
                    key={item.id}
                    className="cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        toggleLookingFor(item.id)
                      }
                      className="sr-only"
                    />

                    <Badge
                      variant={selected ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1.5 font-normal transition-colors ${
                        !selected ? "hover:bg-accent" : ""
                      }`}
                    >
                      {item.name}
                    </Badge>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No options available.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />

            <div>
              <h3 className="text-sm font-medium">
                Availability
              </h3>

              <p className="text-xs text-muted-foreground">
                Let other developers know whether you are available.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                value: "AVAILABLE",
                label: "Available",
                description: "Open to opportunities",
              },
              {
                value: "BUSY",
                label: "Busy",
                description: "Currently working",
              },
              {
                value: "NOT_AVAILABLE",
                label: "Not available",
                description: "Not looking right now",
              },
            ].map((option) => {
              const selected =
                selectedAvailability === option.value;

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    selected
                      ? "border-foreground bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    checked={selected}
                    onChange={() =>
                      setSelectedAvailability(option.value)
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

                    <div>
                      <p className="text-sm font-medium">
                        {option.label}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {selectedRoleIds.map((roleId) => (
          <input
            key={`role-${roleId}`}
            type="hidden"
            name="preferredRole"
            value={roleId}
          />
        ))}

        {selectedLookingForIds.map((id) => (
          <input
            key={`looking-${id}`}
            type="hidden"
            name="lookingFor"
            value={id}
          />
        ))}

        <input
          type="hidden"
          name="availability"
          value={selectedAvailability}
        />
      </CardContent>
    </Card>
  );
}