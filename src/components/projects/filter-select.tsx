"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FilterOption = {
  id: string;
  name: string;
};

type FilterSelectProps = {
  value: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function FilterSelect({
  value,
  placeholder,
  options,
  onChange,
  className = "",
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((option) => option.id === value);
  const displayValue = selectedOption?.name ?? placeholder;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-background px-3 text-sm transition-colors hover:bg-accent/40 ${
          value !== "ALL"
            ? "border-foreground/30 font-medium"
            : "border-border text-muted-foreground"
        }`}
      >
        <span
          className={
            value === "ALL" ? "text-muted-foreground" : "text-foreground"
          }
        >
          {displayValue}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${
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

          <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-72 w-full min-w-44 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                onChange("ALL");
                setOpen(false);
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                value === "ALL" ? "bg-accent font-medium text-accent-foreground" : "text-foreground"
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
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-foreground"
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
