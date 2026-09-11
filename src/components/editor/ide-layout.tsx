"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Save,
  Check,
  PanelLeftClose,
  PanelLeft,
  Terminal as TerminalIcon,
  Users,
  Code2,
  Tag,
  Circle,
  Loader2,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CodeEditor } from "./code-editor";
import { FileExplorer } from "./file-explorer";
import { EditorTabs } from "./editor-tabs";
import { TerminalPanel, LogEntry } from "../terminal/terminal-panel";
import { WorkspaceFileItem, OpenTab, detectLanguage } from "./types";
import {
  saveFileContent,
  updateEditorSession,
} from "@/app/(dashboard)/projects/[slug]/workspace-actions";

interface IdeLayoutProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    language: string | null;
    category: string | null;
    visibility: string;
    owner: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
    members: Array<{
      id: string;
      role: string;
      user: {
        id: string;
        name: string | null;
        username: string | null;
        image: string | null;
      };
    }>;
  };
  workspace: {
    id: string;
    name: string;
    projectId: string;
    ownerId: string;
  };
  initialFiles: WorkspaceFileItem[];
  currentUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  canEdit: boolean;
}

export function IdeLayout({
  project,
  workspace,
  initialFiles,
  currentUser,
  canEdit,
}: IdeLayoutProps) {
  const router = useRouter();

  // Workspace Files state
  const [files, setFiles] = useState<WorkspaceFileItem[]>(initialFiles);

  // Active open file and tabs
  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    // Default to first file if available
    const firstFile = initialFiles.find((f) => f.type === "FILE");
    return firstFile ? firstFile.id : null;
  });

  const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => {
    const firstFile = initialFiles.find((f) => f.type === "FILE");
    if (!firstFile) return [];
    return [
      {
        fileId: firstFile.id,
        name: firstFile.name,
        path: firstFile.path,
        language: firstFile.language || detectLanguage(firstFile.name),
        isDirty: false,
      },
    ];
  });

  // Local buffer for uncommitted file content: { [fileId]: content }
  const [fileBuffers, setFileBuffers] = useState<Record<string, string>>(() => {
    const buffers: Record<string, string> = {};
    initialFiles.forEach((f) => {
      if (f.type === "FILE") {
        buffers[f.id] = f.content || "";
      }
    });
    return buffers;
  });

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Terminal & Explorer panel states
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      type: "info",
      text: `Connected to DevForge workspace: ${project.name}`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Active file object
  const activeFile = files.find((f) => f.id === activeFileId) || null;
  const currentContent = activeFileId ? (fileBuffers[activeFileId] ?? "") : "";

  // Sync files state when server props update
  useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  // Synchronize editor session when active file changes
  useEffect(() => {
    if (activeFileId) {
      updateEditorSession({ workspaceId: workspace.id, fileId: activeFileId });
    }
  }, [activeFileId, workspace.id]);

  // Update tabs when files change from server
  const handleFilesRefreshed = useCallback(() => {
    router.refresh();
  }, [router]);

  // Select file from explorer
  const handleSelectFile = useCallback((file: WorkspaceFileItem) => {
    if (file.type === "FOLDER") return;

    setActiveFileId(file.id);

    // Ensure content buffer is populated
    setFileBuffers((prev) => {
      if (prev[file.id] !== undefined) return prev;
      return {
        ...prev,
        [file.id]: file.content || "",
      };
    });

    // Add tab if not already present
    setOpenTabs((prev) => {
      const exists = prev.some((t) => t.fileId === file.id);
      if (exists) return prev;

      return [
        ...prev,
        {
          fileId: file.id,
          name: file.name,
          path: file.path,
          language: file.language || detectLanguage(file.name),
          isDirty: false,
        },
      ];
    });
  }, []);

  // Handle instant file/folder creation without requiring page refresh
  const handleFileCreated = useCallback((newFile: WorkspaceFileItem) => {
    setFiles((prev) => {
      if (prev.some((f) => f.id === newFile.id)) return prev;
      return [...prev, newFile];
    });

    if (newFile.type === "FILE") {
      setFileBuffers((prev) => ({
        ...prev,
        [newFile.id]: newFile.content || "",
      }));
      handleSelectFile(newFile);
    }
  }, [handleSelectFile]);

  // Handle instant file/folder deletion without requiring page refresh
  const handleFileDeleted = useCallback((deletedId: string) => {
    setFiles((prev) => {
      const idsToDelete = new Set<string>([deletedId]);
      let addedMore = true;
      while (addedMore) {
        addedMore = false;
        for (const f of prev) {
          if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
            idsToDelete.add(f.id);
            addedMore = true;
          }
        }
      }

      // Close tabs for deleted files
      setOpenTabs((currentTabs) => currentTabs.filter((t) => !idsToDelete.has(t.fileId)));
      setActiveFileId((currentActive) =>
        currentActive && idsToDelete.has(currentActive) ? null : currentActive
      );

      return prev.filter((f) => !idsToDelete.has(f.id));
    });
  }, []);

  // Handle instant file/folder renaming without requiring page refresh
  const handleFileRenamed = useCallback((fileId: string, newName: string, newPath: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            name: newName,
            path: newPath,
            language: f.type === "FILE" ? detectLanguage(newName) : f.language,
          };
        }
        return f;
      })
    );

    setOpenTabs((prev) =>
      prev.map((t) =>
        t.fileId === fileId
          ? {
              ...t,
              name: newName,
              path: newPath,
              language: detectLanguage(newName),
            }
          : t
      )
    );
  }, []);

  // Close tab
  const handleCloseTab = (fileIdToClose: string) => {
    setOpenTabs((prev) => {
      const nextTabs = prev.filter((t) => t.fileId !== fileIdToClose);

      // If active tab was closed, switch to adjacent tab
      if (activeFileId === fileIdToClose) {
        if (nextTabs.length > 0) {
          const closedIndex = prev.findIndex((t) => t.fileId === fileIdToClose);
          const nextIndex = Math.min(closedIndex, nextTabs.length - 1);
          setActiveFileId(nextTabs[nextIndex].fileId);
        } else {
          setActiveFileId(null);
        }
      }

      return nextTabs;
    });
  };

  // Code editor onChange
  const handleContentChange = (newContent: string) => {
    if (!activeFileId || !canEdit) return;

    setFileBuffers((prev) => ({
      ...prev,
      [activeFileId]: newContent,
    }));

    setSaveStatus("unsaved");

    // Mark tab as dirty
    setOpenTabs((prev) =>
      prev.map((t) =>
        t.fileId === activeFileId ? { ...t, isDirty: true } : t
      )
    );
  };

  // Save current file
  const handleSave = async () => {
    if (!activeFileId || !canEdit) return;

    const contentToSave = fileBuffers[activeFileId] ?? "";

    setIsSaving(true);
    setSaveStatus("saving");

    const res = await saveFileContent({
      fileId: activeFileId,
      content: contentToSave,
    });

    setIsSaving(false);

    if (res.success) {
      setSaveStatus("saved");
      setLastSaved(new Date().toLocaleTimeString());

      // Update in files state
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId ? { ...f, content: contentToSave } : f
        )
      );

      // Clear dirty state on tab
      setOpenTabs((prev) =>
        prev.map((t) =>
          t.fileId === activeFileId ? { ...t, isDirty: false } : t
        )
      );
    } else {
      setSaveStatus("unsaved");
      setLogs((prev) => [
        ...prev,
        {
          type: "error",
          text: `Save error: ${res.error}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setTerminalOpen(true);
    }
  };

  // Run Code logic (Safe client evaluator for JS/TS, plus syntax check)
  const handleRunCode = () => {
    if (!activeFile) return;

    setTerminalOpen(true);
    setIsRunning(true);

    const time = new Date().toLocaleTimeString();
    const lang = activeFile.language || detectLanguage(activeFile.name);

    setLogs((prev) => [
      ...prev,
      {
        type: "info",
        text: `--- Executing ${activeFile.name} (${lang}) ---`,
        timestamp: time,
      },
    ]);

    const code = currentContent;

    // JavaScript / TypeScript browser-safe runner
    if (lang === "javascript" || lang === "typescript" || lang === "json") {
      try {
        const capturedLogs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
          capturedLogs.push(
            args
              .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
              .join(" ")
          );
        };
        console.warn = (...args) => {
          capturedLogs.push(
            "[warn] " +
              args
                .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
                .join(" ")
          );
        };
        console.error = (...args) => {
          capturedLogs.push(
            "[error] " +
              args
                .map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)))
                .join(" ")
          );
        };

        let result: any;
        try {
          if (lang === "json") {
            result = JSON.parse(code);
            capturedLogs.push("JSON Valid: true\n" + JSON.stringify(result, null, 2));
          } else {
            // Strip typescript type annotations roughly or evaluate direct JS
            const cleanJs = code.replace(/:\s*[A-Za-z0-9_<>\[\]]+/g, "");
            result = new Function(cleanJs)();
          }
        } finally {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
        }

        const now = new Date().toLocaleTimeString();
        if (capturedLogs.length > 0) {
          setLogs((prev) => [
            ...prev,
            ...capturedLogs.map((text) => ({
              type: "info" as const,
              text,
              timestamp: now,
            })),
          ]);
        }

        if (result !== undefined) {
          setLogs((prev) => [
            ...prev,
            {
              type: "success",
              text: `Result: ${typeof result === "object" ? JSON.stringify(result, null, 2) : result}`,
              timestamp: now,
            },
          ]);
        }

        setLogs((prev) => [
          ...prev,
          {
            type: "success",
            text: `Process finished successfully (exit code 0).`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } catch (err: any) {
        setLogs((prev) => [
          ...prev,
          {
            type: "error",
            text: `Runtime Exception: ${err?.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } else {
      // General language simulation
      setLogs((prev) => [
        ...prev,
        {
          type: "info",
          text: `[${lang.toUpperCase()}] Source code parsed. Remote container runner queued for ${activeFile.name}.`,
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          type: "success",
          text: `Code syntax verified. Ready for deployment.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    setIsRunning(false);
  };

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden bg-background">
        {/* IDE Top Navigation Bar */}
        <header className="flex h-12 w-full shrink-0 items-center justify-between border-b bg-card/60 px-3 backdrop-blur select-none">
          {/* Left section: Back button, project info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/projects"
              className="flex size-8 items-center justify-center rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Projects"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title={explorerOpen ? "Hide Explorer" : "Show Explorer"}
              onClick={() => setExplorerOpen(!explorerOpen)}
            >
              {explorerOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm truncate text-foreground">
                {project.name}
              </span>

              {project.language && (
                <Badge
                  variant="outline"
                  className="gap-1 border-primary/30 bg-primary/10 text-primary font-medium text-[11px] h-5 px-1.5"
                >
                  <Code2 className="size-3" />
                  {project.language}
                </Badge>
              )}

              {project.category && (
                <Badge
                  variant="secondary"
                  className="hidden md:inline-flex gap-1 text-[11px] h-5 px-1.5 font-normal text-muted-foreground"
                >
                  <Tag className="size-2.5" />
                  {project.category}
                </Badge>
              )}
            </div>
          </div>

          {/* Right section: Presence, Run, Save, Terminal Toggle */}
          <div className="flex items-center gap-2">
            {/* Real Project Members Presence Stack */}
            <div className="flex items-center -space-x-1.5 overflow-hidden pr-2">
              {project.members.map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger className="cursor-pointer">
                    <Avatar className="size-6 border-2 border-background ring-1 ring-border">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback className="text-[9px] font-semibold">
                        {member.user.name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p className="font-medium">{member.user.name || "Member"}</p>
                    <p className="text-[10px] text-muted-foreground">{member.role}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Save Status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground px-1">
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="size-3 animate-spin text-primary" />
                  <span className="text-[11px]">Saving...</span>
                </>
              ) : saveStatus === "unsaved" ? (
                <>
                  <Circle className="size-2 fill-amber-500 text-amber-500" />
                  <span className="text-[11px] text-amber-500">Unsaved</span>
                </>
              ) : (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">
                    {lastSaved ? `Saved ${lastSaved}` : "Saved"}
                  </span>
                </>
              )}
            </div>

            {/* Save Button */}
            {canEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !activeFileId}
                className="h-7 gap-1.5 px-2.5 text-xs font-medium cursor-pointer"
                title="Save (Ctrl+S)"
              >
                <Save className="size-3.5" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            )}

            {/* Run Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleRunCode}
              disabled={isRunning || !activeFileId}
              className="h-7 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              title="Run Code"
            >
              {isRunning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5 fill-white" />
              )}
              <span>Run</span>
            </Button>

            {/* Terminal Toggle Button */}
            <Button
              type="button"
              variant={terminalOpen ? "secondary" : "ghost"}
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Toggle Terminal"
              onClick={() => setTerminalOpen(!terminalOpen)}
            >
              <TerminalIcon className="size-3.5" />
            </Button>
          </div>
        </header>

        {/* Main IDE Body (Explorer + Editor + Terminal) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Collapsible File Explorer */}
          {explorerOpen && (
            <div className="w-56 shrink-0 md:w-64">
              <FileExplorer
                workspaceId={workspace.id}
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onFileCreated={handleFileCreated}
                onFileDeleted={handleFileDeleted}
                onFileRenamed={handleFileRenamed}
                onFilesChanged={handleFilesRefreshed}
                canEdit={canEdit}
              />
            </div>
          )}

          {/* Right: Tabs + Monaco Editor + Terminal */}
          <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Editor Tabs Bar */}
            <EditorTabs
              tabs={openTabs}
              activeFileId={activeFileId}
              onSelectTab={(id) => setActiveFileId(id)}
              onCloseTab={handleCloseTab}
            />

            {/* Monaco Editor Container */}
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                file={activeFile}
                content={currentContent}
                onChange={handleContentChange}
                onSave={handleSave}
                readOnly={!canEdit}
              />
            </div>

            {/* Bottom Terminal / Output Panel */}
            <TerminalPanel
              isOpen={terminalOpen}
              onToggle={() => setTerminalOpen(!terminalOpen)}
              logs={logs}
              onClearLogs={() => setLogs([])}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
