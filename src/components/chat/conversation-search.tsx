"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type ConversationSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function ConversationSearch({
  value,
  onChange,
  placeholder = "Search conversations...",
}: ConversationSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-9 pr-8 text-xs bg-muted/30 border-white/10 rounded-lg focus-visible:ring-1 focus-visible:ring-white/20 placeholder:text-muted-foreground"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
