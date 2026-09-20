import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { WorkspaceFileItem, detectLanguage } from "@/components/editor/types";

// In serverless environments (Vercel, AWS Lambda, Netlify), process.cwd() (/var/task) is read-only.
// os.tmpdir() (/tmp) provides a writable scratch directory.
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

export const WORKSPACES_ROOT = isServerless
  ? path.resolve(os.tmpdir(), "devforge-workspaces")
  : path.resolve(process.cwd(), "workspaces");

// Ensure base root directory exists safely
if (!fs.existsSync(WORKSPACES_ROOT)) {
  try {
    fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
  } catch (err) {
    console.warn("[WorkspaceManager] Failed to create WORKSPACES_ROOT:", err);
  }
}

export function sanitizeProjectSlug(slug: string): string {
  return slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function getProjectWorkspaceDir(projectSlug: string): string {
  const clean = sanitizeProjectSlug(projectSlug);
  if (!clean) {
    throw new Error("Invalid project slug");
  }
  const fullPath = path.resolve(WORKSPACES_ROOT, clean);
  if (!fullPath.startsWith(WORKSPACES_ROOT)) {
    throw new Error("Access denied: Directory traversal detected");
  }
  return fullPath;
}

export async function getProjectWorkspaceDirById(
  projectId: string
): Promise<{ dir: string; slug: string; workspaceId: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: true },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const slug = project.slug;
  const dir = getProjectWorkspaceDir(slug);
  const workspaceId = project.workspace?.id || "";

  return { dir, slug, workspaceId };
}

/**
 * Ensures the project directory exists on disk and initial files from DB are written.
 */
export async function ensureWorkspaceDiskSync(projectId: string): Promise<string> {
  const { dir, workspaceId } = await getProjectWorkspaceDirById(projectId);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if directory already has files
    let existingDiskItems: string[] = [];
    try {
      existingDiskItems = fs.readdirSync(dir);
    } catch {
      existingDiskItems = [];
    }

    if (existingDiskItems.length === 0 && workspaceId) {
      // Disk is empty: Seed from database files if any
      const dbFiles = await prisma.workspaceFile.findMany({
        where: { workspaceId },
        orderBy: { path: "asc" },
      });

      for (const f of dbFiles) {
        try {
          const targetPath = path.join(dir, f.path);
          if (f.type === "FOLDER") {
            if (!fs.existsSync(targetPath)) {
              fs.mkdirSync(targetPath, { recursive: true });
            }
          } else {
            const parentDir = path.dirname(targetPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }
            fs.writeFileSync(targetPath, f.content || "", "utf8");
          }
        } catch (fileErr) {
          console.warn(`[WorkspaceManager] Failed writing file ${f.path} to disk:`, fileErr);
        }
      }
    }
  } catch (err) {
    console.warn("[WorkspaceManager] ensureWorkspaceDiskSync disk error:", err);
  }

  return dir;
}

/**
 * Recursively scans the disk workspace directory and harmonizes with database.
 * Returns the up-to-date WorkspaceFileItem[] tree.
 */
export async function scanWorkspaceDisk(projectId: string): Promise<WorkspaceFileItem[]> {
  const { dir, workspaceId } = await getProjectWorkspaceDirById(projectId);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn("[WorkspaceManager] scanWorkspaceDisk mkdir warning:", err);
  }

  // Load existing DB files for ID continuity
  const existingDbFiles = workspaceId
    ? await prisma.workspaceFile.findMany({ where: { workspaceId } })
    : [];

  const dbFileMap = new Map<string, (typeof existingDbFiles)[0]>();
  for (const f of existingDbFiles) {
    dbFileMap.set(f.path.replace(/\\/g, "/"), f);
  }

  const items: WorkspaceFileItem[] = [];
  const diskPaths = new Set<string>();

  function walk(currentDir: string, relativePath: string = "") {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      // Ignore hidden files and internal directories
      if (
        entry.name.startsWith(".git") ||
        entry.name === ".next" ||
        entry.name === "node_modules"
      ) {
        continue;
      }

      const entryRelPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const normalizedPath = entryRelPath.replace(/\\/g, "/");
      const fullPath = path.join(currentDir, entry.name);

      diskPaths.add(normalizedPath);

      if (entry.isDirectory()) {
        const existingDb = dbFileMap.get(normalizedPath);
        const folderId = existingDb?.id || `folder_${crypto.createHash("md5").update(normalizedPath).digest("hex").slice(0, 16)}`;

        items.push({
          id: folderId,
          name: entry.name,
          path: normalizedPath,
          type: "FOLDER",
          parentId: null, // will be resolved in parent pass
          content: null,
          language: null,
          size: 0,
        });

        walk(fullPath, normalizedPath);
      } else if (entry.isFile()) {
        let content = "";
        let size = 0;
        try {
          const stats = fs.statSync(fullPath);
          size = stats.size;
          // Only read text content for files under 2MB
          if (size < 2 * 1024 * 1024) {
            content = fs.readFileSync(fullPath, "utf8");
          }
        } catch {}

        const existingDb = dbFileMap.get(normalizedPath);
        const fileId = existingDb?.id || `file_${crypto.createHash("md5").update(normalizedPath).digest("hex").slice(0, 16)}`;
        const lang = detectLanguage(entry.name);

        items.push({
          id: fileId,
          name: entry.name,
          path: normalizedPath,
          type: "FILE",
          parentId: null, // will be resolved in parent pass
          content,
          language: lang,
          size,
        });
      }
    }
  }

  walk(dir);

  // Build folder path to ID mapping to resolve parentId
  const pathToIdMap = new Map<string, string>();
  for (const item of items) {
    pathToIdMap.set(item.path, item.id);
  }

  for (const item of items) {
    const lastSlash = item.path.lastIndexOf("/");
    if (lastSlash > 0) {
      const parentPath = item.path.slice(0, lastSlash);
      item.parentId = pathToIdMap.get(parentPath) || null;
    } else {
      item.parentId = null;
    }
  }

  // Asynchronously sync database with disk state in background if workspaceId exists
  if (workspaceId) {
    syncDbWithDiskAsync(workspaceId, items, existingDbFiles).catch((err) => {
      console.error("[WorkspaceManager] DB sync error:", err);
    });
  }

  return items;
}

async function syncDbWithDiskAsync(
  workspaceId: string,
  diskItems: WorkspaceFileItem[],
  existingDbFiles: any[]
) {
  // CRITICAL: NEVER delete DB records if disk is empty or disk scanning found 0 items!
  // In serverless / ephemeral containers, disk might be fresh or read-only while DB has the real files.
  if (diskItems.length === 0) {
    return;
  }

  const existingPathMap = new Map<string, any>();
  for (const f of existingDbFiles) {
    existingPathMap.set(f.path.replace(/\\/g, "/"), f);
  }

  const diskPathSet = new Set<string>();

  // Upsert folders and files from disk
  for (const item of diskItems) {
    diskPathSet.add(item.path);
    const existing = existingPathMap.get(item.path);

    if (!existing) {
      try {
        await prisma.workspaceFile.create({
          data: {
            workspaceId,
            name: item.name,
            path: item.path,
            type: item.type,
            content: item.content,
            language: item.language,
            size: item.size || 0,
          },
        });
      } catch {}
    } else if (item.type === "FILE" && existing.size !== item.size) {
      try {
        await prisma.workspaceFile.update({
          where: { id: existing.id },
          data: {
            content: item.content,
            size: item.size || 0,
          },
        });
      } catch {}
    }
  }

  // Delete DB records for files that were deleted on disk (only when disk has files)
  for (const f of existingDbFiles) {
    const norm = f.path.replace(/\\/g, "/");
    if (!diskPathSet.has(norm)) {
      try {
        await prisma.workspaceFile.delete({
          where: { id: f.id },
        });
      } catch {}
    }
  }
}

/**
 * Creates a file or folder on the physical workspace disk and database.
 */
export async function createWorkspaceFileOnDisk({
  projectId,
  path: filePath,
  type,
  content = "",
}: {
  projectId: string;
  path: string;
  type: "FILE" | "FOLDER";
  content?: string;
}) {
  const { dir } = await getProjectWorkspaceDirById(projectId);
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fullPath = path.resolve(dir, normalizedPath);

  if (!fullPath.startsWith(dir)) {
    throw new Error("Access denied: Path traversal detected");
  }

  try {
    if (type === "FOLDER") {
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    } else {
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(fullPath, content, "utf8");
    }
  } catch (err) {
    console.warn("[WorkspaceManager] createWorkspaceFileOnDisk disk warning:", err);
  }

  return scanWorkspaceDisk(projectId);
}

/**
 * Deletes a file or directory on the physical workspace disk and database.
 */
export async function deleteWorkspaceFileOnDisk({
  projectId,
  path: filePath,
}: {
  projectId: string;
  path: string;
}) {
  const { dir } = await getProjectWorkspaceDirById(projectId);
  const normalizedPath = filePath.replace(/\\/g, "/");
  const fullPath = path.resolve(dir, normalizedPath);

  if (!fullPath.startsWith(dir)) {
    throw new Error("Access denied: Path traversal detected");
  }

  try {
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (err) {
    console.warn("[WorkspaceManager] deleteWorkspaceFileOnDisk disk warning:", err);
  }

  return scanWorkspaceDisk(projectId);
}

/**
 * Renames a file or folder on disk.
 */
export async function renameWorkspaceFileOnDisk({
  projectId,
  oldPath,
  newPath,
}: {
  projectId: string;
  oldPath: string;
  newPath: string;
}) {
  const { dir } = await getProjectWorkspaceDirById(projectId);
  const fullOld = path.resolve(dir, oldPath.replace(/\\/g, "/"));
  const fullNew = path.resolve(dir, newPath.replace(/\\/g, "/"));

  if (!fullOld.startsWith(dir) || !fullNew.startsWith(dir)) {
    throw new Error("Access denied: Path traversal detected");
  }

  try {
    if (fs.existsSync(fullOld)) {
      const newParent = path.dirname(fullNew);
      if (!fs.existsSync(newParent)) {
        fs.mkdirSync(newParent, { recursive: true });
      }
      fs.renameSync(fullOld, fullNew);
    }
  } catch (err) {
    console.warn("[WorkspaceManager] renameWorkspaceFileOnDisk disk warning:", err);
  }

  return scanWorkspaceDisk(projectId);
}

/**
 * Saves file content directly to disk.
 */
export async function saveWorkspaceFileContentOnDisk({
  projectId,
  path: filePath,
  content,
}: {
  projectId: string;
  path: string;
  content: string;
}) {
  const { dir } = await getProjectWorkspaceDirById(projectId);
  const fullPath = path.resolve(dir, filePath.replace(/\\/g, "/"));

  if (!fullPath.startsWith(dir)) {
    throw new Error("Access denied: Path traversal detected");
  }

  try {
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, "utf8");
  } catch (err) {
    console.warn("[WorkspaceManager] saveWorkspaceFileContentOnDisk disk warning:", err);
  }
}

// ---------------------------------------------------------------------------
// File Watcher System
// ---------------------------------------------------------------------------

interface WorkspaceWatcher {
  watcher: fs.FSWatcher;
  subscribers: Set<() => void>;
  debounceTimer: NodeJS.Timeout | null;
}

const watchers = new Map<string, WorkspaceWatcher>();

export function watchWorkspace(
  targetDirOrProjectId: string,
  onChange: () => void
): () => void {
  // Resolve directory: if it's an existing directory path, use it; otherwise check if it's a project slug
  let dir = path.resolve(targetDirOrProjectId);
  if (!fs.existsSync(dir)) {
    try {
      dir = getProjectWorkspaceDir(targetDirOrProjectId);
    } catch {
      dir = path.join(WORKSPACES_ROOT, targetDirOrProjectId);
    }
  }

  let watcherEntry = watchers.get(dir);

  if (!watcherEntry) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const subscribers = new Set<() => void>();
      subscribers.add(onChange);

      let debounceTimer: NodeJS.Timeout | null = null;

      const fsWatcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
        // Ignore internal dependencies and build folders
        if (
          filename &&
          (filename.includes("node_modules") ||
            filename.includes(".git") ||
            filename.includes(".next"))
        ) {
          return;
        }

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          subscribers.forEach((cb) => {
            try {
              cb();
            } catch {}
          });
        }, 150);
      });

      watcherEntry = {
        watcher: fsWatcher,
        subscribers,
        debounceTimer,
      };

      watchers.set(dir, watcherEntry);
    } catch (e) {
      console.warn(`[WorkspaceManager] Failed to start watcher for ${dir}:`, e);
      return () => {};
    }
  } else {
    watcherEntry.subscribers.add(onChange);
  }

  return () => {
    const entry = watchers.get(dir);
    if (!entry) return;
    entry.subscribers.delete(onChange);
    if (entry.subscribers.size === 0) {
      if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
      try {
        entry.watcher.close();
      } catch {}
      watchers.delete(dir);
    }
  };
}

// ---------------------------------------------------------------------------
// Terminal Ticket Authorization System
// ---------------------------------------------------------------------------

interface TicketData {
  projectId: string;
  userId: string;
  workspaceDir: string;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __terminalTickets: Map<string, TicketData> | undefined;
}

const tickets = globalThis.__terminalTickets ?? new Map<string, TicketData>();
globalThis.__terminalTickets = tickets;

export function createTerminalTicket(
  projectId: string,
  userId: string,
  workspaceDir: string
): string {
  const ticketId = crypto.randomBytes(24).toString("hex");
  tickets.set(ticketId, {
    projectId,
    userId,
    workspaceDir,
    createdAt: Date.now(),
  });

  // Expire ticket after 60 seconds
  setTimeout(() => {
    tickets.delete(ticketId);
  }, 60000);

  return ticketId;
}

export function validateTerminalTicket(ticketId: string): TicketData | null {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  if (Date.now() - ticket.createdAt > 60000) {
    tickets.delete(ticketId);
    return null;
  }

  // One-time use
  tickets.delete(ticketId);
  return ticket;
}
