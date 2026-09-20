"use client";

import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

type Props = {
  envFilter: string;
  onEnvChange: (env: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortOrder: "newest" | "oldest";
  onSortChange: (sort: "newest" | "oldest") => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

const ENV_OPTIONS: FilterOption[] = [
  { id: "PRODUCTION", name: "Production" },
  { id: "PREVIEW", name: "Preview" },
  { id: "DEVELOPMENT", name: "Development" },
];

const STATUS_OPTIONS: FilterOption[] = [
  { id: "READY", name: "Ready" },
  { id: "BUILDING", name: "Building" },
  { id: "DEPLOYING", name: "Deploying" },
  { id: "QUEUED", name: "Queued" },
  { id: "FAILED", name: "Failed" },
  { id: "CANCELLED", name: "Cancelled" },
];

const SORT_OPTIONS: FilterOption[] = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
];

export function DeploymentFilters({
  envFilter,
  onEnvChange,
  statusFilter,
  onStatusChange,
  sortOrder,
  onSortChange,
  hasActiveFilters,
  onResetFilters,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
        <SlidersHorizontal className="size-3.5" />
        <span className="font-medium">Filter:</span>
      </div>

      {/* Environment Filter */}
      <div className="w-40">
        <FilterSelect
          value={envFilter}
          placeholder="All Environments"
          options={ENV_OPTIONS}
          onChange={onEnvChange}
        />
      </div>

      {/* Status Filter */}
      <div className="w-36">
        <FilterSelect
          value={statusFilter}
          placeholder="All Statuses"
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />
      </div>

      {/* Sort Order */}
      <div className="w-36">
        <FilterSelect
          value={sortOrder}
          placeholder="Sort By"
          options={SORT_OPTIONS}
          onChange={(val) => onSortChange(val === "oldest" ? "oldest" : "newest")}
        />
      </div>

      {/* Reset Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
        >
          <RotateCcw className="size-3" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  );
}
