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
  Globe,
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
import { TerminalPanel, LogEntry, TerminalPanelHandle } from "../terminal/terminal-panel";
import { LivePreview } from "./live-preview";
import { WorkspaceFileItem, OpenTab, detectLanguage } from "./types";
import {
  saveFileContent,
  updateEditorSession,
  syncWorkspaceFilesAction,
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
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalPanelRef = useRef<TerminalPanelHandle>(null);

  // Populate initial connection log on mount (avoids SSR hydration mismatch #418)
  useEffect(() => {
    setLogs([
      {
        type: "info",
        text: `Connected to DevForge workspace: ${project.name}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, [project.name]);

  // Live Preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("index.html");
  const [previewReloadCounter, setPreviewReloadCounter] = useState(0);
  const [splitPercent, setSplitPercent] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [detectedServers, setDetectedServers] = useState<Array<{ port: number; url: string; label?: string }>>([]);
  const splitAreaRef = useRef<HTMLDivElement>(null);

  // Re-layout Monaco Editor whenever split or preview state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 80);
    return () => clearTimeout(timer);
  }, [previewOpen, splitPercent]);

  // Keyboard shortcut to toggle Live Preview (Alt+P or Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && (e.key === "p" || e.key === "P")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "v" || e.key === "V"))
      ) {
        e.preventDefault();
        setPreviewOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Split view dragging handler
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSplit(true);

    const startX = e.clientX;
    const startPercent = splitPercent;
    const containerWidth = splitAreaRef.current?.getBoundingClientRect().width || 1000;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newPercent = Math.min(80, Math.max(20, startPercent + deltaPercent));
      setSplitPercent(newPercent);
    };

    const onMouseUp = () => {
      setIsDraggingSplit(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 50);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // Detected server handler
  const handleDevServerDetected = useCallback((url: string, port: number) => {
    setDetectedServers((prev) => {
      if (prev.some((s) => s.port === port)) return prev;
      return [...prev, { port, url, label: `Port ${port}` }];
    });
    setLogs((prev) => [
      ...prev,
      {
        type: "success",
        text: `[Dev Server Detected] Listening on ${url}. Open Live Preview to view.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const handleOpenServerPreview = useCallback((targetUrl?: string) => {
    setPreviewOpen(true);
    setPreviewReloadCounter((c) => c + 1);
  }, []);

  const handlePreviewFile = useCallback((file: WorkspaceFileItem) => {
    setPreviewPath(file.path);
    setPreviewOpen(true);
    setPreviewReloadCounter((c) => c + 1);
  }, []);

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

  // Live filesystem synchronization when files change from disk/terminal
  const handleFsChange = useCallback(async () => {
    try {
      const res = await syncWorkspaceFilesAction(project.id);
      if (res.success && res.files) {
        setFiles(res.files);
        setFileBuffers((prev) => {
          const next = { ...prev };
          res.files.forEach((f) => {
            if (f.type === "FILE" && f.content !== null && next[f.id] === undefined) {
              next[f.id] = f.content || "";
            }
          });
          return next;
        });
        setPreviewReloadCounter((c) => c + 1);
      }
    } catch (e) {
      console.warn("Failed to sync workspace files:", e);
    }
  }, [project.id]);

  // Update tabs when files change from server
  const handleFilesRefreshed = useCallback(() => {
    handleFsChange();
    router.refresh();
  }, [handleFsChange, router]);

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
      setPreviewReloadCounter((c) => c + 1);

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

      // Immediately sync saved file to the real external terminal server disk
      if (activeFile) {
        terminalPanelRef.current?.syncFile(activeFile.path, contentToSave);
      }
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

  // Run Code logic: Executes through the REAL terminal / PTY session
  const handleRunCode = async () => {
    if (!activeFile) return;

    const time = new Date().toLocaleTimeString();
    const lang = activeFile.language || detectLanguage(activeFile.name);

    // If HTML / Web frontend file: Launch Live Preview!
    if (lang === "html" || activeFile.name.endsWith(".html") || activeFile.name.endsWith(".htm")) {
      setPreviewPath(activeFile.path);
      setPreviewOpen(true);
      setPreviewReloadCounter((c) => c + 1);
      setLogs((prev) => [
        ...prev,
        {
          type: "success",
          text: `[Live Preview] Launched live website preview for ${activeFile.name}`,
          timestamp: time,
        },
      ]);
      return;
    }

    // Auto-save active file if modified before running so the disk has the latest code
    if (activeFileId && fileBuffers[activeFileId] !== undefined) {
      await handleSave();
    }

    setTerminalOpen(true);
    setIsRunning(true);
    terminalPanelRef.current?.openTerminal();

    // Determine execution command based on file type and project
    const fileName = activeFile.name;
    let runCmd = `node "${fileName}"\n`;

    if (lang === "python" || fileName.endsWith(".py")) {
      runCmd = `python3 "${fileName}" || python "${fileName}"\n`;
    } else if (lang === "typescript" || fileName.endsWith(".ts")) {
      runCmd = `node "${fileName}"\n`;
    } else if (lang === "bash" || lang === "shell" || fileName.endsWith(".sh")) {
      runCmd = `bash "${fileName}"\n`;
    } else if (lang === "rust" || fileName.endsWith(".rs")) {
      runCmd = `cargo run\n`;
    } else if (lang === "go" || fileName.endsWith(".go")) {
      runCmd = `go run "${fileName}"\n`;
    } else if (fileName === "package.json") {
      runCmd = `npm test\n`;
    }

    setLogs((prev) => [
      ...prev,
      {
        type: "info",
        text: `[Terminal] Executing command: ${runCmd.trim()}`,
        timestamp: time,
      },
    ]);

    // Send real command to active PTY shell
    terminalPanelRef.current?.sendInput(runCmd);
    terminalPanelRef.current?.focus();

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
              href={`/projects/${project.slug}`}
              className="flex size-8 items-center justify-center rounded-lg border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Project Workspace"
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

            {/* Preview Button */}
            <Button
              type="button"
              variant={previewOpen ? "secondary" : "outline"}
              size="sm"
              onClick={() => setPreviewOpen(!previewOpen)}
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs font-medium cursor-pointer transition-all",
                previewOpen
                  ? "bg-primary/15 text-primary border-primary/30 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Toggle Live Preview (Alt+P)"
            >
              <Globe className={cn("size-3.5", previewOpen && "text-primary")} />
              <span className="hidden sm:inline">Preview</span>
              {detectedServers.length > 0 && !previewOpen && (
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </Button>

            {/* Run Button */}
            <Button
              type="button"
              size="sm"
              onClick={handleRunCode}
              disabled={isRunning || !activeFileId}
              className="h-7 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              title={
                activeFile?.name.endsWith(".html") || activeFile?.language === "html"
                  ? "Run & Open Live Preview"
                  : "Run Code"
              }
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
                onPreviewFile={handlePreviewFile}
                canEdit={canEdit}
              />
            </div>
          )}

          {/* Right: Tabs + Monaco Editor (with Live Preview Split) + Terminal */}
          <div className="flex flex-1 flex-col overflow-hidden bg-background">
            {/* Editor Tabs Bar */}
            <EditorTabs
              tabs={openTabs}
              activeFileId={activeFileId}
              onSelectTab={(id) => setActiveFileId(id)}
              onCloseTab={handleCloseTab}
            />

            {/* Monaco Editor & Live Preview Split Area */}
            <div ref={splitAreaRef} className="flex flex-1 overflow-hidden relative">
              {/* Left: Monaco Code Editor */}
              <div
                style={{
                  width: previewOpen ? `${splitPercent}%` : "100%",
                }}
                className="h-full overflow-hidden relative"
              >
                <CodeEditor
                  file={activeFile}
                  content={currentContent}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  readOnly={!canEdit}
                />
              </div>

              {/* Resizable Divider Handle */}
              {previewOpen && (
                <div
                  onMouseDown={handleSplitMouseDown}
                  className="group relative w-1.5 shrink-0 cursor-col-resize select-none bg-border/40 hover:bg-primary/50 transition-colors z-20 flex items-center justify-center"
                  title="Drag to resize editor and live preview"
                >
                  <div className="h-8 w-0.5 rounded-full bg-muted-foreground/30 group-hover:bg-primary transition-colors" />
                </div>
              )}

              {/* Right: Live Preview Panel */}
              {previewOpen && (
                <div
                  style={{
                    width: `${100 - splitPercent}%`,
                  }}
                  className="h-full overflow-hidden flex flex-col relative"
                >
                  <LivePreview
                    projectSlug={project.slug}
                    workspaceId={workspace.id}
                    projectName={project.name}
                    initialPath={previewPath}
                    detectedServers={detectedServers}
                    reloadTrigger={previewReloadCounter}
                    onClose={() => setPreviewOpen(false)}
                    canEdit={canEdit}
                    onFileCreated={handleFileCreated}
                    onSelectFile={handleSelectFile}
                  />
                </div>
              )}
            </div>

            {/* Bottom Terminal / Output Panel */}
            <TerminalPanel
              ref={terminalPanelRef}
              isOpen={terminalOpen}
              onToggle={() => setTerminalOpen(!terminalOpen)}
              logs={logs}
              onClearLogs={() => setLogs([])}
              isRunning={isRunning}
              projectId={project.id}
              projectSlug={project.slug}
              onFilesChanged={handleFsChange}
              onDevServerDetected={handleDevServerDetected}
              detectedServers={detectedServers}
              onOpenPreview={handleOpenServerPreview}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
