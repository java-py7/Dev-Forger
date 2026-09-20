import fs from "fs";
import path from "path";

// Root directory for all isolated workspaces
export const WORKSPACES_ROOT = path.resolve(
  process.env.WORKSPACES_ROOT || path.resolve(process.cwd(), "workspaces")
);

// Ensure base root directory exists
try {
  if (!fs.existsSync(WORKSPACES_ROOT)) {
    fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
  }
} catch (err) {
  console.error("[Workspace] Failed to initialize WORKSPACES_ROOT:", err);
}

/**
 * Sanitizes a path segment (user ID or project slug) to eliminate illegal characters
 * and prevent path traversal attacks.
 */
export function sanitizeSegment(segment: string): string {
  if (!segment) return "default";

  // Reject path traversal attempts immediately
  if (
    segment.includes("..") ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0")
  ) {
    throw new Error(`Access Denied: Path traversal detected in identifier: ${segment}`);
  }

  const clean = segment
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  if (!clean) {
    throw new Error(`Invalid identifier: ${segment}`);
  }
  return clean;
}

/**
 * Resolves the isolated disk workspace directory for a specific user and project.
 * Guaranteed to be strictly inside WORKSPACES_ROOT.
 */
export function resolveWorkspaceDir(userId: string, projectSlug: string): string {
  const safeUser = sanitizeSegment(userId);
  const safeProject = sanitizeSegment(projectSlug);

  const fullPath = path.resolve(WORKSPACES_ROOT, safeUser, safeProject);

  // Strict boundary check
  const normalizedRoot = path.normalize(WORKSPACES_ROOT) + path.sep;
  const normalizedPath = path.normalize(fullPath);

  if (!normalizedPath.startsWith(normalizedRoot) && normalizedPath !== path.normalize(WORKSPACES_ROOT)) {
    throw new Error(`Access Denied: Path traversal detected for path ${fullPath}`);
  }

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
}

/**
 * Safely resolves a file path inside a workspace directory, preventing traversal.
 */
export function resolveSafeFilePath(workspaceDir: string, relativePath: string): string {
  const normalizedRel = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const fullPath = path.resolve(workspaceDir, normalizedRel);

  const normalizedBase = path.normalize(workspaceDir) + path.sep;
  const normalizedTarget = path.normalize(fullPath);

  if (!normalizedTarget.startsWith(normalizedBase) && normalizedTarget !== path.normalize(workspaceDir)) {
    throw new Error(`Access Denied: Path traversal attempted: ${relativePath}`);
  }

  return fullPath;
}

/**
 * Writes or updates a file inside the isolated workspace.
 */
export function writeWorkspaceFile(
  workspaceDir: string,
  relativePath: string,
  content: string
): void {
  const fullPath = resolveSafeFilePath(workspaceDir, relativePath);
  const parent = path.dirname(fullPath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, "utf8");
}

/**
 * Deletes a file inside the isolated workspace.
 */
export function deleteWorkspaceFile(workspaceDir: string, relativePath: string): void {
  const fullPath = resolveSafeFilePath(workspaceDir, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Seeds or syncs initial project files into the workspace directory.
 */
export function syncInitialFiles(
  workspaceDir: string,
  files: Array<{ path: string; type: string; content?: string }>
): void {
  if (!files || files.length === 0) return;

  for (const f of files) {
    try {
      if (f.type === "FOLDER") {
        const fullPath = resolveSafeFilePath(workspaceDir, f.path);
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      } else {
        writeWorkspaceFile(workspaceDir, f.path, f.content || "");
      }
    } catch (err) {
      console.warn(`[Workspace] Failed syncing file ${f.path}:`, err);
    }
  }
}

/**
 * Watches a workspace directory for changes made by shell commands (e.g. touch, git, npm).
 * Returns an unwatch function.
 */
export function watchWorkspaceDir(
  workspaceDir: string,
  onChange: () => void
): () => void {
  if (!fs.existsSync(workspaceDir)) {
    try {
      fs.mkdirSync(workspaceDir, { recursive: true });
    } catch {}
  }

  let debounceTimer: NodeJS.Timeout | null = null;

  try {
    const watcher = fs.watch(workspaceDir, { recursive: true }, (eventType, filename) => {
      // Ignore git internals and large vendor dirs
      if (
        filename &&
        (filename.includes(".git") ||
          filename.includes("node_modules") ||
          filename.includes(".next") ||
          filename.includes(".cache"))
      ) {
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          onChange();
        } catch {}
      }, 250);
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      try {
        watcher.close();
      } catch {}
    };
  } catch (err) {
    console.warn(`[Workspace] File watcher not available for ${workspaceDir}:`, err);
    return () => {};
  }
}
