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
  Sparkles,
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

// ============================================================
// TYPES
// ============================================================

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
      id?: string;
      name: string;
      category: string | null;
    };
  }[];
};

type FilterItem = {
  id: string;
  name: string;
};

type DiscoverProps = {
  developers: Developer[];
  roles: FilterItem[];
  lookingFor: FilterItem[];
  interests: FilterItem[];
  skills: FilterItem[];
};

// ============================================================
// CUSTOM DROPDOWN
// ============================================================

type FilterSelectProps = {
  value: string;
  placeholder: string;
  options: FilterItem[];
  onChange: (value: string) => void;
};

function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.id === value
  );

  const displayValue =
    selectedOption?.name ?? placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm transition-colors hover:bg-accent/40 ${
          value !== "ALL"
            ? "border-foreground/30"
            : "border-border"
        }`}
      >
        <span
          className={
            value === "ALL"
              ? "text-muted-foreground"
              : "text-foreground"
          }
        >
          {displayValue}
        </span>

        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close dropdown"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onChange("ALL");
                setOpen(false);
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                value === "ALL"
                  ? "bg-accent font-medium"
                  : ""
              }`}
            >
              {placeholder}
            </button>

            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  value === option.id
                    ? "bg-accent font-medium"
                    : ""
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatEnum(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getInitials(
  name: string | null,
  email: string | null
) {
  return (
    name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    email?.slice(0, 2).toUpperCase() ||
    "DF"
  );
}

function getLevelLabel(level: number) {
  const levels: Record<number, string> = {
    1: "Beginner",
    2: "Familiar",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
  };

  return levels[level] ?? "Unknown";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DeveloperDiscover({
  developers,
  roles,
  lookingFor,
  interests,
  skills,
}: DiscoverProps) {
  const [search, setSearch] = useState("");

  const [availability, setAvailability] =
    useState("ALL");

  const [role, setRole] = useState("ALL");

  const [lookingForFilter, setLookingForFilter] =
    useState("ALL");

  const [interest, setInterest] = useState("ALL");

  const [skill, setSkill] = useState("ALL");

  const [selectedDeveloper, setSelectedDeveloper] =
    useState<Developer | null>(null);

  // ==========================================================
  // FILTER DEVELOPERS
  // ==========================================================

  const filteredDevelopers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return developers.filter((developer) => {
      const profile = developer.profile;

      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

      const matchesSearch =
        !query ||
        developer.name
          ?.toLowerCase()
          .includes(query) ||
        profile.bio
          ?.toLowerCase()
          .includes(query) ||
        profile.location
          ?.toLowerCase()
          .includes(query) ||
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
        profile.roles.some((item) =>
          item.role.name
            .toLowerCase()
            .includes(query)
        ) ||
        profile.lookingFor.some((item) =>
          item.lookingFor.name
            .toLowerCase()
            .includes(query)
        ) ||
        profile.interests.some((item) =>
          item.interest.name
            .toLowerCase()
            .includes(query)
        );

      // ------------------------------------------------------
      // AVAILABILITY
      // ------------------------------------------------------

      const matchesAvailability =
        availability === "ALL" ||
        profile.availability === availability;

      // ------------------------------------------------------
      // ROLE
      // ------------------------------------------------------

      const matchesRole =
        role === "ALL" ||
        profile.roles.some(
          (item) => item.roleId === role
        );

      // ------------------------------------------------------
      // LOOKING FOR
      // ------------------------------------------------------

      const matchesLookingFor =
        lookingForFilter === "ALL" ||
        profile.lookingFor.some(
          (item) =>
            item.lookingForId ===
            lookingForFilter
        );

      // ------------------------------------------------------
      // INTEREST
      // ------------------------------------------------------

      const matchesInterest =
        interest === "ALL" ||
        profile.interests.some(
          (item) =>
            item.interestId === interest
        );

      // ------------------------------------------------------
      // SKILL
      // ------------------------------------------------------

      const matchesSkill =
        skill === "ALL" ||
        developer.userSkills.some(
          (item) => item.skillId === skill
        );

      return (
        matchesSearch &&
        matchesAvailability &&
        matchesRole &&
        matchesLookingFor &&
        matchesInterest &&
        matchesSkill
      );
    });
  }, [
    developers,
    search,
    availability,
    role,
    lookingForFilter,
    interest,
    skill,
  ]);

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const hasActiveFilters =
    availability !== "ALL" ||
    role !== "ALL" ||
    lookingForFilter !== "ALL" ||
    interest !== "ALL" ||
    skill !== "ALL";

  function resetFilters() {
    setAvailability("ALL");
    setRole("ALL");
    setLookingForFilter("ALL");
    setInterest("ALL");
    setSkill("ALL");
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      {/* ====================================================
          SEARCH
      ==================================================== */}

      <div className="mb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search developers, skills, roles..."
            className="h-10 pl-9"
          />
        </div>
      </div>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          value={availability}
          onChange={setAvailability}
          placeholder="Availability"
          options={[
            {
              id: "AVAILABLE",
              name: "Available",
            },
            {
              id: "BUSY",
              name: "Busy",
            },
            {
              id: "NOT_AVAILABLE",
              name: "Not available",
            },
          ]}
        />

        <FilterSelect
          value={role}
          onChange={setRole}
          placeholder="Role"
          options={roles}
        />

        <FilterSelect
          value={lookingForFilter}
          onChange={setLookingForFilter}
          placeholder="Looking for"
          options={lookingFor}
        />

        <FilterSelect
          value={interest}
          onChange={setInterest}
          placeholder="Interest"
          options={interests}
        />

        <FilterSelect
          value={skill}
          onChange={setSkill}
          placeholder="Skill"
          options={skills}
        />
      </div>

      {/* ====================================================
          ACTIVE FILTER / RESULT INFO
      ==================================================== */}

      {hasActiveFilters && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredDevelopers.length} matching developer
            {filteredDevelopers.length === 1
              ? ""
              : "s"}
          </p>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 text-xs"
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* ====================================================
          DEVELOPER LIST
      ==================================================== */}

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
              Try changing your search or filters.
            </p>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDevelopers.map((developer) => {
            const initials = getInitials(
              developer.name,
              developer.email
            );

            return (
              <button
                key={developer.id}
                type="button"
                onClick={() =>
                  setSelectedDeveloper(developer)
                }
                className="group block w-full max-w-xs text-left"
              >
                <Card className="cursor-pointer transition-colors hover:border-foreground/30 hover:bg-accent/30">
                  <CardContent className="flex items-center gap-4 px-4">
                    {/* Avatar */}
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage
                        src={
                          developer.image ??
                          undefined
                        }
                        alt={
                          developer.name ??
                          "Developer"
                        }
                      />

                      <AvatarFallback>
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + description ONLY */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium">
                        {developer.name ??
                          "Developer"}
                      </h3>

                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {developer.profile.bio ??
                          "Developer on DevForge"}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {/* ====================================================
          FULL PROFILE MODAL
      ==================================================== */}

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
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-hidden shadow-2xl">
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex items-start justify-between border-b p-6">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-14 shrink-0">
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
                    {getInitials(
                      selectedDeveloper.name,
                      selectedDeveloper.email
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold">
                    {selectedDeveloper.name ??
                      "Developer"}
                  </h2>

                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Developer on DevForge
                  </p>

                  <Badge
                    variant="secondary"
                    className="mt-2"
                  >
                    {formatEnum(
                      selectedDeveloper.profile
                        .availability
                    )}
                  </Badge>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setSelectedDeveloper(null)
                }
                className="shrink-0"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="max-h-[calc(90vh-100px)] overflow-y-auto p-6">
              <div className="space-y-7">
                {/* =================================================
                    ABOUT
                ================================================= */}

                {selectedDeveloper.profile.bio && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold">
                      About
                    </h3>

                    <p className="text-sm leading-6 text-muted-foreground">
                      {
                        selectedDeveloper
                          .profile.bio
                      }
                    </p>
                  </section>
                )}

                {/* =================================================
                    BASIC INFORMATION
                ================================================= */}

                {(selectedDeveloper.profile.location ||
                  selectedDeveloper.profile.website ||
                  selectedDeveloper.profile.githubUrl ||
                  selectedDeveloper.profile.linkedinUrl) && (
                  <section>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedDeveloper.profile
                        .location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-4 shrink-0" />

                          <span>
                            {
                              selectedDeveloper
                                .profile.location
                            }
                          </span>
                        </div>
                      )}

                      {selectedDeveloper.profile
                        .website && (
                        <a
                          href={
                            selectedDeveloper
                              .profile.website
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Globe className="size-4" />

                          <span>Portfolio</span>

                          <ExternalLink className="size-3" />
                        </a>
                      )}

                      {selectedDeveloper.profile
                        .githubUrl && (
                        <a
                          href={
                            selectedDeveloper
                              .profile.githubUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Code2 className="size-4" />

                          <span>GitHub</span>

                          <ExternalLink className="size-3" />
                        </a>
                      )}

                      {selectedDeveloper.profile
                        .linkedinUrl && (
                        <a
                          href={
                            selectedDeveloper
                              .profile.linkedinUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Users className="size-4" />

                          <span>LinkedIn</span>

                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </section>
                )}

                {/* =================================================
                    SKILLS + EXPERIENCE
                ================================================= */}

                {selectedDeveloper.userSkills.length >
                  0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Code2 className="size-4" />

                      <h3 className="text-sm font-semibold">
                        Skills & experience
                      </h3>
                    </div>

                    <div className="divide-y rounded-lg border">
                      {selectedDeveloper.userSkills.map(
                        (userSkill) => (
                          <div
                            key={
                              userSkill.skillId
                            }
                            className="flex items-center justify-between gap-4 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                {
                                  userSkill.skill
                                    .name
                                }
                              </p>

                              {userSkill.skill
                                .category && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {
                                    userSkill
                                      .skill
                                      .category
                                  }
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium">
                                {
                                  userSkill.yearsOfExperience
                                }{" "}
                                {userSkill.yearsOfExperience ===
                                1
                                  ? "year"
                                  : "years"}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {getLevelLabel(
                                  userSkill.level
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* =================================================
                    ROLES
                ================================================= */}

                {selectedDeveloper.profile.roles
                  .length > 0 && (
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

                {/* =================================================
                    LOOKING FOR
                ================================================= */}

                {selectedDeveloper.profile
                  .lookingFor.length > 0 && (
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
                            key={
                              item.lookingForId
                            }
                            variant="outline"
                            className="font-normal"
                          >
                            {
                              item.lookingFor
                                .name
                            }
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* =================================================
                    INTERESTS
                ================================================= */}

                {selectedDeveloper.profile.interests
                  .length > 0 && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="size-4" />

                      <h3 className="text-sm font-semibold">
                        Interests
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedDeveloper.profile.interests.map(
                        (item) => (
                          <Badge
                            key={
                              item.interestId
                            }
                            variant="secondary"
                            className="font-normal"
                          >
                            {
                              item.interest
                                .name
                            }
                          </Badge>
                        )
                      )}
                    </div>
                  </section>
                )}

                {/* =================================================
                    WORK PREFERENCES
                ================================================= */}

                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="size-4" />

                    <h3 className="text-sm font-semibold">
                      Work preferences
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Collaboration
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatEnum(
                          selectedDeveloper
                            .profile
                            .collaborationPreference
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Project size
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatEnum(
                          selectedDeveloper
                            .profile
                            .preferredProjectSize
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Availability
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatEnum(
                          selectedDeveloper
                            .profile.availability
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