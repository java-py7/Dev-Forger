"use client";

import { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  FolderTree,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceFileItem, detectLanguage } from "./types";
import { createFile, deleteFile, renameFile } from "@/app/(dashboard)/projects/[slug]/workspace-actions";

interface FileExplorerProps {
  workspaceId: string;
  files: WorkspaceFileItem[];
  activeFileId: string | null;
  onSelectFile: (file: WorkspaceFileItem) => void;
  onFileCreated?: (file: WorkspaceFileItem) => void;
  onFileDeleted?: (fileId: string) => void;
  onFileRenamed?: (fileId: string, newName: string, newPath: string) => void;
  onFilesChanged?: () => void;
  canEdit: boolean;
}

type TreeNode = {
  item: WorkspaceFileItem;
  children: TreeNode[];
};

function getFileIcon(name: string, isFolder: boolean, isOpen: boolean) {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen className="size-4 shrink-0 text-amber-500 dark:text-amber-400" />
    ) : (
      <Folder className="size-4 shrink-0 text-amber-500 dark:text-amber-400" />
    );
  }

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
      return <FileCode className="size-4 shrink-0 text-primary" />;
    case "md":
    case "markdown":
    case "txt":
      return <FileText className="size-4 shrink-0 text-muted-foreground" />;
    default:
      return <File className="size-4 shrink-0 text-muted-foreground" />;
  }
}

export function FileExplorer({
  workspaceId,
  files,
  activeFileId,
  onSelectFile,
  onFileCreated,
  onFileDeleted,
  onFileRenamed,
  onFilesChanged,
  canEdit,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Expand all folders by default
    return new Set(files.filter((f) => f.type === "FOLDER").map((f) => f.id));
  });

  // Selected folder for creating files inside
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Dialog states
  const [newFileDialog, setNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [renameTarget, setRenameTarget] = useState<WorkspaceFileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<WorkspaceFileItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Build tree from flat files
  const tree = useMemo(() => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    files.forEach((f) => {
      map.set(f.id, { item: f, children: [] });
    });

    files.forEach((f) => {
      const node = map.get(f.id)!;
      if (f.parentId && map.has(f.parentId)) {
        map.get(f.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort: Folders first, then alphabetically
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        if (a.item.type === b.item.type) {
          return a.item.name.localeCompare(b.item.name);
        }
        return a.item.type === "FOLDER" ? -1 : 1;
      });
      nodes.forEach((n) => sortNodes(n.children));
    };

    sortNodes(roots);
    return roots;
  }, [files]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setLoading(true);
    setErrorMessage("");

    const targetFolder = files.find((f) => f.id === selectedFolderId);
    const parentPath = targetFolder ? targetFolder.path : "";
    const cleanName = newFileName.trim();
    const filePath = parentPath ? `${parentPath}/${cleanName}` : cleanName;

    const lang = detectLanguage(cleanName);

    const res = await createFile({
      workspaceId,
      name: cleanName,
      path: filePath,
      type: "FILE",
      parentId: selectedFolderId,
      content: "",
      language: lang,
    });

    setLoading(false);
    if (res.success && res.file) {
      setNewFileDialog(false);
      setNewFileName("");
      if (selectedFolderId) {
        setExpandedFolders((prev) => new Set([...prev, selectedFolderId]));
      }
      onFileCreated?.(res.file);
      onFilesChanged?.();
      onSelectFile(res.file);
    } else {
      setErrorMessage(res.error || "Failed to create file.");
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setLoading(true);
    setErrorMessage("");

    const targetFolder = files.find((f) => f.id === selectedFolderId);
    const parentPath = targetFolder ? targetFolder.path : "";
    const cleanName = newFolderName.trim();
    const folderPath = parentPath ? `${parentPath}/${cleanName}` : cleanName;

    const res = await createFile({
      workspaceId,
      name: cleanName,
      path: folderPath,
      type: "FOLDER",
      parentId: selectedFolderId,
    });

    setLoading(false);
    if (res.success && res.file) {
      setNewFolderDialog(false);
      setNewFolderName("");
      setExpandedFolders((prev) => new Set([...prev, res.file!.id, ...(selectedFolderId ? [selectedFolderId] : [])]));
      onFileCreated?.(res.file);
      onFilesChanged?.();
    } else {
      setErrorMessage(res.error || "Failed to create folder.");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    setLoading(true);
    setErrorMessage("");

    const parts = renameTarget.path.split("/");
    parts[parts.length - 1] = renameValue.trim();
    const newPath = parts.join("/");
    const renamedId = renameTarget.id;
    const cleanName = renameValue.trim();

    const res = await renameFile({
      fileId: renamedId,
      newName: cleanName,
      newPath,
    });

    setLoading(false);
    if (res.success) {
      setRenameTarget(null);
      setRenameValue("");
      onFileRenamed?.(renamedId, cleanName, newPath);
      onFilesChanged?.();
    } else {
      setErrorMessage(res.error || "Failed to rename.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);
    const deletedId = deleteTarget.id;
    const res = await deleteFile({ fileId: deletedId });
    setLoading(false);

    if (res.success) {
      setDeleteTarget(null);
      onFileDeleted?.(deletedId);
      onFilesChanged?.();
    } else {
      alert(res.error || "Failed to delete.");
    }
  };

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const { item, children } = node;
      const isFolder = item.type === "FOLDER";
      const isExpanded = expandedFolders.has(item.id);
      const isActive = item.id === activeFileId;

      return (
        <div key={item.id} className="w-full select-none">
          <div
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.id);
                setSelectedFolderId(item.id);
              } else {
                onSelectFile(item);
              }
            }}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={cn(
              "group relative flex h-7 items-center justify-between pr-2 text-xs font-normal cursor-pointer rounded-sm transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
              {isFolder && (
                <span className="shrink-0 text-muted-foreground/70">
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </span>
              )}
              {getFileIcon(item.name, isFolder, isExpanded)}
              <span className="truncate">{item.name}</span>
            </div>

            {/* Context menu actions */}
            {canEdit && (
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex size-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                    <MoreVertical className="size-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    {isFolder && (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFolderId(item.id);
                          setNewFileDialog(true);
                        }}
                      >
                        <FilePlus className="mr-2 size-3.5" />
                        New File
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameTarget(item);
                        setRenameValue(item.name);
                        setErrorMessage("");
                      }}
                    >
                      <Pencil className="mr-2 size-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(item)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Render children if folder is expanded */}
          {isFolder && isExpanded && children.length > 0 && (
            <div className="flex flex-col">
              {renderTree(children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-sidebar/50 border-r select-none">
      {/* Explorer Top Toolbar */}
      <div className="flex h-9 items-center justify-between border-b px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <FolderTree className="size-3.5" />
          Explorer
        </span>

        {canEdit && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="New File (Root)"
              onClick={() => {
                setSelectedFolderId(null);
                setNewFileDialog(true);
                setErrorMessage("");
              }}
            >
              <FilePlus className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="New Folder (Root)"
              onClick={() => {
                setSelectedFolderId(null);
                setNewFolderDialog(true);
                setErrorMessage("");
              }}
            >
              <FolderPlus className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            No files in workspace. Click above to add your first file.
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>

      {/* New File Dialog */}
      <Dialog open={newFileDialog} onOpenChange={setNewFileDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFile}>
            <DialogHeader>
              <DialogTitle>Create New File</DialogTitle>
              <DialogDescription>
                {selectedFolderId
                  ? `Creating inside ${files.find((f) => f.id === selectedFolderId)?.name}`
                  : "Creating in workspace root directory."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label htmlFor="fileName" className="text-xs">
                  File Name
                </Label>
                <Input
                  id="fileName"
                  placeholder="e.g. index.ts, style.css, script.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive">{errorMessage}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewFileDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newFileName.trim()}>
                {loading ? "Creating..." : "Create File"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateFolder}>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                {selectedFolderId
                  ? `Creating inside ${files.find((f) => f.id === selectedFolderId)?.name}`
                  : "Creating in workspace root directory."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label htmlFor="folderName" className="text-xs">
                  Folder Name
                </Label>
                <Input
                  id="folderName"
                  placeholder="e.g. src, components, utils"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive">{errorMessage}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewFolderDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !newFolderName.trim()}>
                {loading ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename {renameTarget?.type === "FOLDER" ? "Folder" : "File"}</DialogTitle>
              <DialogDescription>
                Enter a new name for {renameTarget?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <div className="space-y-1">
                <Label htmlFor="renameValue" className="text-xs">
                  New Name
                </Label>
                <Input
                  id="renameValue"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-destructive">{errorMessage}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !renameValue.trim()}>
                {loading ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "FOLDER" ? "Folder" : "File"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
