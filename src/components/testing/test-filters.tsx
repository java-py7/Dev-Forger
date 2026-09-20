"use client";

import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import { Button } from "@/components/ui/button";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

type Props = {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  suiteFilter: string;
  onSuiteChange: (suite: string) => void;
  suiteOptions: FilterOption[];
  sortOrder: "newest" | "oldest";
  onSortChange: (sort: "newest" | "oldest") => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

const STATUS_OPTIONS: FilterOption[] = [
  { id: "PASSED", name: "Passed" },
  { id: "FAILED", name: "Failed" },
];

const SORT_OPTIONS: FilterOption[] = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
];

export function TestFilters({
  statusFilter,
  onStatusChange,
  suiteFilter,
  onSuiteChange,
  suiteOptions,
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

      {/* Status Filter */}
      <div className="w-36">
        <FilterSelect
          value={statusFilter}
          placeholder="All Statuses"
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />
      </div>

      {/* Suite Filter */}
      {suiteOptions.length > 0 && (
        <div className="w-48">
          <FilterSelect
            value={suiteFilter}
            placeholder="All Suites"
            options={suiteOptions}
            onChange={onSuiteChange}
          />
        </div>
      )}

      {/* Sort Order */}
      <div className="w-36">
        <FilterSelect
          value={sortOrder}
          placeholder="Sort By"
          options={SORT_OPTIONS}
          onChange={(val) => onSortChange(val === "oldest" ? "oldest" : "newest")}
        />
      </div>

      {/* Reset Button */}
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
