"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Code2,
  ExternalLink,
  Globe,
  MapPin,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type Developer = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;

  profile: {
    bio: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;

    availability: string;

    collaborationPreference: string | null;
    preferredProjectSize: string | null;

    roles: {
      roleId: string;
      role: {
        id: string;
        name: string;
        description: string | null;
      };
    }[];

    lookingFor: {
      lookingForId: string;
      lookingFor: {
        id: string;
        name: string;
        description: string | null;
      };
    }[];

    interests: {
      interestId: string;
      interest: {
        id: string;
        name: string;
        category: string | null;
        description: string | null;
      };
    }[];
  };

  userSkills: {
    skillId: string;
    level: number;
    yearsOfExperience: number;

    skill: {
      name: string;
      category: string | null;
    };
  }[];
};

type DiscoverProps = {
  developers: Developer[];
};

export function DeveloperDiscover({
  developers,
}: DiscoverProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [selectedDeveloper, setSelectedDeveloper] =
    useState<Developer | null>(null);

  const filterOptions = useMemo(() => {
    const options = [
      {
        value: "ALL",
        label: "All developers",
      },
      {
        value: "AVAILABLE",
        label: "Available",
      },
      {
        value: "BUSY",
        label: "Busy",
      },
      {
        value: "NOT_AVAILABLE",
        label: "Not available",
      },
    ];

    const roles = new Set<string>();
    const lookingFor = new Set<string>();
    const interests = new Set<string>();
    const skills = new Set<string>();

    developers.forEach((developer) => {
      developer.profile.roles.forEach((item) => {
        roles.add(item.role.name);
      });

      developer.profile.lookingFor.forEach((item) => {
        lookingFor.add(item.lookingFor.name);
      });

      developer.profile.interests.forEach((item) => {
        interests.add(item.interest.name);
      });

      developer.userSkills.forEach((item) => {
        skills.add(item.skill.name);
      });
    });

    roles.forEach((role) => {
      options.push({
        value: `ROLE:${role}`,
        label: `Role: ${role}`,
      });
    });

    lookingFor.forEach((item) => {
      options.push({
        value: `LOOKING:${item}`,
        label: `Looking for: ${item}`,
      });
    });

    interests.forEach((item) => {
      options.push({
        value: `INTEREST:${item}`,
        label: `Interest: ${item}`,
      });
    });

    skills.forEach((skill) => {
      options.push({
        value: `SKILL:${skill}`,
        label: `Skill: ${skill}`,
      });
    });

    return options;
  }, [developers]);

  const filteredDevelopers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return developers.filter((developer) => {
      const profile = developer.profile;

      const matchesSearch =
        !query ||
        developer.name?.toLowerCase().includes(query) ||
        profile.bio?.toLowerCase().includes(query) ||
        profile.location?.toLowerCase().includes(query) ||
        developer.userSkills.some((userSkill) =>
          userSkill.skill.name
            .toLowerCase()
            .includes(query)
        ) ||
        developer.userSkills.some((userSkill) =>
          userSkill.skill.category
            ?.toLowerCase()
            .includes(query)
        ) ||
        profile.roles.some((role) =>
          role.role.name
            .toLowerCase()
            .includes(query)
        ) ||
        profile.lookingFor.some((item) =>
          item.lookingFor.name
            .toLowerCase()
            .includes(query)
        ) ||
        profile.interests.some((interest) =>
          interest.interest.name
            .toLowerCase()
            .includes(query)
        );

      let matchesFilter = true;

      if (filter === "AVAILABLE") {
        matchesFilter =
          profile.availability === "AVAILABLE";
      }

      if (filter === "BUSY") {
        matchesFilter =
          profile.availability === "BUSY";
      }

      if (filter === "NOT_AVAILABLE") {
        matchesFilter =
          profile.availability === "NOT_AVAILABLE";
      }

      if (filter.startsWith("ROLE:")) {
        const value = filter.replace("ROLE:", "");

        matchesFilter = profile.roles.some(
          (role) => role.role.name === value
        );
      }

      if (filter.startsWith("LOOKING:")) {
        const value = filter.replace("LOOKING:", "");

        matchesFilter = profile.lookingFor.some(
          (item) => item.lookingFor.name === value
        );
      }

      if (filter.startsWith("INTEREST:")) {
        const value = filter.replace("INTEREST:", "");

        matchesFilter = profile.interests.some(
          (interest) => interest.interest.name === value
        );
      }

      if (filter.startsWith("SKILL:")) {
        const value = filter.replace("SKILL:", "");

        matchesFilter = developer.userSkills.some(
          (userSkill) => userSkill.skill.name === value
        );
      }

      return matchesSearch && matchesFilter;
    });
  }, [developers, search, filter]);

  return (
    <>
      {/* Search + Filter */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search developers, skills, roles..."
            className="pl-9"
          />
        </div>

        <div className="relative w-52 shrink-0">
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
            className="h-10 w-full appearance-none rounded-md border bg-background px-3 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {filterOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Developer List */}
      {filteredDevelopers.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40">
              <Users className="size-5 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">
              No developers found
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Try changing your search or filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDevelopers.map((developer) => {
            const initials =
              developer.name
                ?.split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ||
              developer.email
                ?.slice(0, 2)
                .toUpperCase() ||
              "DF";

            return (
              <button
                key={developer.id}
                type="button"
                onClick={() =>
                  setSelectedDeveloper(developer)
                }
                className="group block w-full max-w-md text-left"
              >
                <Card className="w-full max-w-md transition-colors hover:border-foreground/30 hover:bg-accent/30 cursor-pointer">
                  <CardContent className="flex items-center gap-4 px-4 py-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage
                        src={developer.image ?? undefined}
                        alt={
                          developer.name ?? "Developer"
                        }
                      />

                      <AvatarFallback>
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">
                        {developer.name ?? "Developer"}
                      </h3>

                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {developer.profile.bio ??
                          "Developer on DevForge"}
                      </p>
                    </div>

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* Full Profile Modal */}
      {selectedDeveloper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedDeveloper(null);
            }
          }}
        >
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b p-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarImage
                    src={
                      selectedDeveloper.image ??
                      undefined
                    }
                    alt={
                      selectedDeveloper.name ??
                      "Developer"
                    }
                  />

                  <AvatarFallback>
                    {selectedDeveloper.name
                      ?.split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "DF"}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedDeveloper.name ??
                      "Developer"}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    Developer on DevForge
                  </p>

                  {selectedDeveloper.profile
                    .availability === "AVAILABLE" && (
                    <Badge
                      variant="secondary"
                      className="mt-2"
                    >
                      Available
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedDeveloper(null)
                }
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Full Profile */}
            <div className="max-h-[calc(90vh-100px)] overflow-y-auto p-6">
              <div className="space-y-7">
                {/* About */}
                {selectedDeveloper.profile.bio && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">
                      About
                    </h3>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {selectedDeveloper.profile.bio}
                    </p>
                  </section>
                )}

                {/* Basic Information */}
                <section className="grid gap-3 sm:grid-cols-2">
                  {selectedDeveloper.profile.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0" />
                      {selectedDeveloper.profile.location}
                    </div>
                  )}

                  {selectedDeveloper.profile.website && (
                    <a
                      href={
                        selectedDeveloper.profile.website
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="size-4" />
                      Portfolio
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  {selectedDeveloper.profile.githubUrl && (
                    <a
                      href={
                        selectedDeveloper.profile.githubUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      GitHub
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  {selectedDeveloper.profile.linkedinUrl && (
                    <a
                      href={
                        selectedDeveloper.profile.linkedinUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      LinkedIn
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </section>

                {/* Skills */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Code2 className="size-4" />

                    <h3 className="text-sm font-semibold">
                      Skills
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {selectedDeveloper.userSkills.map(
                      (userSkill) => (
                        <div
                          key={userSkill.skillId}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {userSkill.skill.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {userSkill.skill.category ??
                                "Technology"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-medium">
                              Level {userSkill.level}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {userSkill.yearsOfExperience}{" "}
                              {userSkill.yearsOfExperience ===
                              1
                                ? "year"
                                : "years"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* Preferred Roles */}
                {selectedDeveloper.profile.roles.length >
                  0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Briefcase className="size-4" />

                      <h3 className="text-sm font-semibold">
                        Preferred roles
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDeveloper.profile.roles.map(
                        (item) => (
                          <Badge
                            key={item.roleId}
                            variant="secondary"
                            className="font-normal"
                          >
                            {item.role.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Looking For */}
                {selectedDeveloper.profile.lookingFor
                  .length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Search className="size-4" />

                      <h3 className="text-sm font-semibold">
                        Looking for
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDeveloper.profile.lookingFor.map(
                        (item) => (
                          <Badge
                            key={item.lookingForId}
                            variant="outline"
                            className="font-normal"
                          >
                            {item.lookingFor.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Interests */}
                {selectedDeveloper.profile.interests
                  .length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Globe className="size-4" />

                      <h3 className="text-sm font-semibold">
                        Interests
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDeveloper.profile.interests.map(
                        (item) => (
                          <Badge
                            key={item.interestId}
                            variant="secondary"
                            className="font-normal"
                          >
                            {item.interest.name}
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* Work Preferences */}
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="size-4" />

                    <h3 className="text-sm font-semibold">
                      Work preferences
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Collaboration
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedDeveloper.profile
                          .collaborationPreference
                          ?.replaceAll("_", " ") ??
                          "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Project size
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedDeveloper.profile
                          .preferredProjectSize
                          ?.replaceAll("_", " ") ??
                          "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3 sm:col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Availability
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {selectedDeveloper.profile.availability.replaceAll(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}