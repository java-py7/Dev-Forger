"use client";

import { FileCode, FileText, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OpenTab } from "./types";

interface EditorTabsProps {
  tabs: OpenTab[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

function getTabIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "py":
    case "html":
    case "css":
    case "scss":
    case "json":
    case "sql":
    case "sh":
      return <FileCode className="size-3.5 shrink-0 text-primary" />;
    case "md":
    case "markdown":
    case "txt":
      return <FileText className="size-3.5 shrink-0 text-muted-foreground" />;
    default:
      return <File className="size-3.5 shrink-0 text-muted-foreground" />;
  }
}

export function EditorTabs({
  tabs,
  activeFileId,
  onSelectTab,
  onCloseTab,
}: EditorTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 w-full items-stretch overflow-x-auto border-b bg-muted/30 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = tab.fileId === activeFileId;

        return (
          <div
            key={tab.fileId}
            onClick={() => onSelectTab(tab.fileId)}
            className={cn(
              "group relative flex h-full cursor-pointer select-none items-center gap-2 border-r px-3 text-xs font-medium transition-colors hover:bg-background/80",
              isActive
                ? "bg-background text-foreground shadow-xs after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            title={tab.path}
          >
            {getTabIcon(tab.name)}
            <span className="truncate max-w-[140px]">{tab.name}</span>

            {/* Dirty indicator or close button */}
            <div className="flex size-4 items-center justify-center">
              {tab.isDirty ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.fileId);
                  }}
                  className="flex size-4 items-center justify-center rounded-sm hover:bg-muted"
                  title="Unsaved changes - Close tab"
                >
                  <span className="size-2 rounded-full bg-primary transition-all group-hover:hidden" />
                  <X className="hidden size-3 text-muted-foreground hover:text-foreground group-hover:block" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.fileId);
                  }}
                  className="flex size-4 items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-opacity"
                  title="Close tab"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
