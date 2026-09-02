"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

type Skill = {
  id: string;
  name: string;
  category: string | null;
};

type UserSkill = {
  skillId: string;
  level: number;
  yearsOfExperience: number;
  skill: Skill;
};

type ProfileSkillsProps = {
  skills: Skill[];
  userSkills: UserSkill[];
};

const skillLevels = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Familiar" },
  { value: 3, label: "Intermediate" },
  { value: 4, label: "Advanced" },
  { value: 5, label: "Expert" },
];

const experienceOptions = [
  { value: 0, label: "Less than 1 year" },
  { value: 1, label: "1 year" },
  { value: 2, label: "2 years" },
  { value: 3, label: "3 years" },
  { value: 4, label: "4 years" },
  { value: 5, label: "5 years" },
  { value: 6, label: "6 years" },
  { value: 7, label: "7 years" },
  { value: 8, label: "8 years" },
  { value: 9, label: "9 years" },
  { value: 10, label: "10+ years" },
];

export function ProfileSkills({
  skills,
  userSkills,
}: ProfileSkillsProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedSkills, setSelectedSkills] = useState<
    Record<
      string,
      {
        level: number;
        yearsOfExperience: number;
      }
    >
  >(
    Object.fromEntries(
      userSkills.map((userSkill) => [
        userSkill.skillId,
        {
          level: userSkill.level,
          yearsOfExperience: userSkill.yearsOfExperience,
        },
      ])
    )
  );

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(
        new Set(
          skills
            .map((skill) => skill.category)
            .filter(Boolean) as string[]
        )
      ).sort(),
    ];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();

    return skills
      .filter((skill) => {
        const matchesCategory =
          category === "All" || skill.category === category;

        const matchesSearch =
          !query ||
          skill.name.toLowerCase().includes(query) ||
          skill.category?.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .slice(0, 10);
  }, [skills, search, category]);

  const selectedSkillObjects = skills.filter(
    (skill) => selectedSkills[skill.id]
  );

  function toggleSkill(skillId: string) {
    setSelectedSkills((current) => {
      const next = { ...current };

      if (next[skillId]) {
        delete next[skillId];
      } else {
        next[skillId] = {
          level: 2,
          yearsOfExperience: 0,
        };
      }

      return next;
    });
  }

  function updateSkill(
    skillId: string,
    field: "level" | "yearsOfExperience",
    value: number
  ) {
    setSelectedSkills((current) => ({
      ...current,
      [skillId]: {
        ...current[skillId],
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-6">
      {selectedSkillObjects.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">
                Selected skills
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Configure your experience and level.
              </p>
            </div>

            <span className="text-xs text-muted-foreground">
              {selectedSkillObjects.length} selected
            </span>
          </div>

          <div className="space-y-3">
            {selectedSkillObjects.map((skill) => {
              const data = selectedSkills[skill.id];

              return (
                <div
                  key={skill.id}
                  className="rounded-xl border bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                        <Check className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {skill.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {skill.category || "Other"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor={`skill-level-${skill.id}`}
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Skill level
                      </label>

                      <select
                        id={`skill-level-${skill.id}`}
                        name={`skillLevel-${skill.id}`}
                        value={data.level}
                        onChange={(event) =>
                          updateSkill(
                            skill.id,
                            "level",
                            Number(event.target.value)
                          )
                        }
                        className="h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        {skillLevels.map((level) => (
                          <option
                            key={level.value}
                            value={level.value}
                          >
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`skill-experience-${skill.id}`}
                        className="mb-1.5 block text-xs font-medium text-muted-foreground"
                      >
                        Years of experience
                      </label>

                      <select
                        id={`skill-experience-${skill.id}`}
                        name={`skillExperience-${skill.id}`}
                        value={data.yearsOfExperience}
                        onChange={(event) =>
                          updateSkill(
                            skill.id,
                            "yearsOfExperience",
                            Number(event.target.value)
                          )
                        }
                        className="h-9 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        {experienceOptions.map((experience) => (
                          <option
                            key={experience.value}
                            value={experience.value}
                          >
                            {experience.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <input
                    type="hidden"
                    name="skillIds"
                    value={skill.id}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium">
            Add skills
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Search for a technology or filter by category.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search skills..."
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            className="h-10 cursor-pointer rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-48"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All categories" : item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => {
            const selected = Boolean(
              selectedSkills[skill.id]
            );

            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  selected
                    ? "border-foreground/30 bg-muted"
                    : "hover:bg-muted/50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-input bg-background"
                  }`}
                >
                  {selected && (
                    <Check className="h-3 w-3" />
                  )}
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {skill.name}
                  </span>

                  <span className="block truncate text-xs text-muted-foreground">
                    {skill.category || "Other"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Search className="mx-auto h-7 w-7 text-muted-foreground" />

            <p className="mt-3 text-sm font-medium">
              No skills found
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Try another search or category.
            </p>
          </div>
        )}

        {filteredSkills.length === 10 && (
          <p className="text-xs text-muted-foreground">
            Showing the first 10 results. Use search or the
            category filter to find more.
          </p>
        )}
      </div>
    </div>
  );
}