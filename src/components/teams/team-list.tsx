"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { TeamCard, TeamData } from "@/components/teams/team-card";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { AvailableTeamUser } from "@/components/teams/invite-team-member-dialog";
import { FilterSelect, FilterOption } from "@/components/projects/filter-select";

type TeamListProps = {
  teams: TeamData[];
  availableUsers: AvailableTeamUser[];
  pendingInvitationsCount: number;
};

type Tab = "ALL" | "MINE" | "JOINED" | "INVITED";

const ROLE_OPTIONS: FilterOption[] = [
  { id: "OWNER", name: "Owner" },
  { id: "ADMIN", name: "Admin" },
  { id: "DEVELOPER", name: "Developer" },
  { id: "DESIGNER", name: "Designer" },
];

const SIZE_OPTIONS: FilterOption[] = [
  { id: "SMALL", name: "1 - 2 members" },
  { id: "MEDIUM", name: "3 - 5 members" },
  { id: "LARGE", name: "6+ members" },
];

export function TeamList({
  teams,
  availableUsers,
  pendingInvitationsCount,
}: TeamListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sizeFilter, setSizeFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();

    return teams.filter((team) => {
      // Tab filtering
      if (activeTab === "MINE" && !team.isOwner) {
        return false;
      }
      if (activeTab === "JOINED" && (!team.isMember || team.isOwner)) {
        return false;
      }
      if (activeTab === "INVITED" && !team.pendingInvitationId) {
        return false;
      }

      // Search query
      if (q) {
        const matches =
          team.name.toLowerCase().includes(q) ||
          team.description?.toLowerCase().includes(q) ||
          team.owner.name?.toLowerCase().includes(q) ||
          team.owner.username?.toLowerCase().includes(q) ||
          team.members.some(
            (m) =>
              m.user.name?.toLowerCase().includes(q) ||
              m.user.username?.toLowerCase().includes(q)
          );

        if (!matches) return false;
      }

      // Role filter
      if (roleFilter !== "ALL") {
        const hasRole = team.members.some((m) => m.role === roleFilter);
        if (!hasRole) return false;
      }

      // Size filter
      if (sizeFilter === "SMALL" && team.memberCount > 2) return false;
      if (
        sizeFilter === "MEDIUM" &&
        (team.memberCount < 3 || team.memberCount > 5)
      )
        return false;
      if (sizeFilter === "LARGE" && team.memberCount < 6) return false;

      return true;
    });
  }, [teams, activeTab, search, roleFilter, sizeFilter]);

  const hasActiveFilters = roleFilter !== "ALL" || sizeFilter !== "ALL";

  function clearFilters() {
    setRoleFilter("ALL");
    setSizeFilter("ALL");
  }

  return (
    <>
      {/* Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teams, members, or missions..."
              className="h-10 pl-9"
            />
          </div>

          {/* Create Button */}
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-10 shrink-0 gap-2"
          >
            <Plus className="size-4" />
            Create team
          </Button>
        </div>

        {/* Tabs & Clear filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex w-fit items-center rounded-lg border bg-muted/30 p-1">
            {[
              ["ALL", "All teams"],
              ["MINE", "My teams"],
              ["JOINED", "Joined"],
              ["INVITED", "Invitations"],
            ].map(([value, label]) => {
              const selected = activeTab === value;
              const isInvited = value === "INVITED";

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value as Tab)}
                  className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isInvited && <Mail className="size-3.5" />}
                  <span>{label}</span>
                  {isInvited && pendingInvitationsCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {pendingInvitationsCount}
                    </span>
                  )}
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
              Clear filters
            </Button>
          )}
        </div>

        {/* Discover-Style Filter Dropdowns */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-2">
          <FilterSelect
            value={roleFilter}
            onChange={setRoleFilter}
            placeholder="Role"
            options={ROLE_OPTIONS}
          />

          <FilterSelect
            value={sizeFilter}
            onChange={setSizeFilter}
            placeholder="Team size"
            options={SIZE_OPTIONS}
          />
        </div>
      </div>

      {/* Counter */}
      <div className="mt-7 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Teams</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {filteredTeams.length === 0
              ? "No teams found"
              : `${filteredTeams.length} ${
                  filteredTeams.length === 1 ? "team" : "teams"
                }`}
          </p>
        </div>

        {hasActiveFilters && (
          <Badge variant="secondary" className="font-normal">
            Filtered
          </Badge>
        )}
      </div>

      {/* Teams Grid / List */}
      {filteredTeams.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/30">
            <Users className="size-5 text-muted-foreground" />
          </div>

          <h3 className="mt-4 font-semibold">No teams found</h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : activeTab === "INVITED"
              ? "You don't have any pending team invitations."
              : "Create a team and start building together with other developers."}
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
              Create team
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              availableUsers={availableUsers}
            />
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}
