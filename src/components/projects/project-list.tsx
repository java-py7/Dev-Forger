"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Project, ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog, PROJECT_CATEGORIES, AvailableSkill } from "@/components/projects/create-project-dialog";
import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import { AvailableUser } from "@/components/projects/invite-member-dialog";

type ProjectListProps = {
  projects: Project[];
  availableSkills?: AvailableSkill[];
  availableUsers?: AvailableUser[];
};

type Tab = "ALL" | "MINE" | "JOINED";

const STATUS_OPTIONS: FilterOption[] = [
  { id: "PLANNING", name: "Planning" },
  { id: "ACTIVE", name: "Active" },
  { id: "COMPLETED", name: "Completed" },
  { id: "ARCHIVED", name: "Archived" },
];

const VISIBILITY_OPTIONS: FilterOption[] = [
  { id: "PUBLIC", name: "Public" },
  { id: "PRIVATE", name: "Private" },
];

export function ProjectList({
  projects,
  availableSkills = [],
  availableUsers = [],
}: ProjectListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [visibility, setVisibility] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [language, setLanguage] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  // Dynamic category options from available project categories
  const categoryOptions: FilterOption[] = useMemo(() => {
    return PROJECT_CATEGORIES.map((cat) => ({ id: cat, name: cat }));
  }, []);

  // Dynamic language options from database skills
  const languageOptions: FilterOption[] = useMemo(() => {
    // If skills provided, use them; otherwise extract from projects
    if (availableSkills.length > 0) {
      return availableSkills.map((s) => ({ id: s.name, name: s.name }));
    }
    const uniqueLangs = Array.from(
      new Set(
        projects
          .map((p) => p.language)
          .filter((l): l is string => Boolean(l))
      )
    );
    return uniqueLangs.map((l) => ({ id: l, name: l }));
  }, [availableSkills, projects]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      // Tabs
      if (activeTab === "MINE" && !project.isOwner) {
        return false;
      }

      if (
        activeTab === "JOINED" &&
        (!project.isMember || project.isOwner)
      ) {
        return false;
      }

      // Search
      if (query) {
        const matchesSearch =
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.category?.toLowerCase().includes(query) ||
          project.language?.toLowerCase().includes(query) ||
          project.owner.name?.toLowerCase().includes(query) ||
          project.owner.username?.toLowerCase().includes(query);

        if (!matchesSearch) {
          return false;
        }
      }

      // Status
      if (status !== "ALL" && project.status !== status) {
        return false;
      }

      // Visibility
      if (visibility !== "ALL" && project.visibility !== visibility) {
        return false;
      }

      // Category
      if (category !== "ALL" && project.category !== category) {
        return false;
      }

      // Language
      if (
        language !== "ALL" &&
        project.language?.toLowerCase() !== language.toLowerCase()
      ) {
        return false;
      }

      return true;
    });
  }, [
    projects,
    activeTab,
    search,
    status,
    visibility,
    category,
    language,
  ]);

  const hasActiveFilters =
    status !== "ALL" ||
    visibility !== "ALL" ||
    category !== "ALL" ||
    language !== "ALL";

  function clearFilters() {
    setStatus("ALL");
    setVisibility("ALL");
    setCategory("ALL");
    setLanguage("ALL");
  }

  return (
    <>
      {/* Top Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search projects, stack, category, or owner..."
              className="h-10 pl-9"
            />
          </div>

          {/* Create Button */}
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-10 shrink-0 gap-2"
          >
            <Plus className="size-4" />
            Create project
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex w-fit items-center rounded-lg border bg-muted/30 p-1">
            {[
              ["ALL", "All projects"],
              ["MINE", "My projects"],
              ["JOINED", "Joined"],
            ].map(([value, label]) => {
              const selected = activeTab === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as Tab)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Discover-Style Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            value={status}
            onChange={setStatus}
            placeholder="Status"
            options={STATUS_OPTIONS}
          />

          <FilterSelect
            value={visibility}
            onChange={setVisibility}
            placeholder="Visibility"
            options={VISIBILITY_OPTIONS}
          />

          <FilterSelect
            value={category}
            onChange={setCategory}
            placeholder="Category / Type"
            options={categoryOptions}
          />

          <FilterSelect
            value={language}
            onChange={setLanguage}
            placeholder="Language / Tech"
            options={languageOptions}
          />
        </div>
      </div>

      {/* Section Header & Counters */}
      <div className="mt-7 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Projects</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filteredProjects.length === 0
              ? "No projects found"
              : `${filteredProjects.length} ${
                  filteredProjects.length === 1 ? "project" : "projects"
                }`}
          </p>
        </div>

        {hasActiveFilters && (
          <Badge variant="secondary" className="font-normal">
            Filtered
          </Badge>
        )}
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/30">
            <FolderKanban className="size-5 text-muted-foreground" />
          </div>

          <h3 className="mt-4 font-semibold">No projects found</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting or clearing your filters to see more projects."
              : "Be the first to create a project and invite developers to collaborate!"}
          </p>

          <div className="mt-4 flex gap-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-1.5 size-3.5" />
              Create project
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              availableUsers={availableUsers}
              availableSkills={availableSkills}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        availableSkills={availableSkills}
      />
    </>
  );
}