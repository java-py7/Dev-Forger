"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  ensureWorkspaceDiskSync,
  scanWorkspaceDisk,
  createWorkspaceFileOnDisk,
  deleteWorkspaceFileOnDisk,
  renameWorkspaceFileOnDisk,
  saveWorkspaceFileContentOnDisk,
  createTerminalTicket,
} from "@/server/workspace-manager";

// Helper to check user access to a workspace
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      project: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!workspace) return null;

  const isOwner = workspace.ownerId === userId;
  const isMember = workspace.project.members.length > 0;
  const isPublic = workspace.project.visibility === "PUBLIC";

  if (!isOwner && !isMember && !isPublic) {
    return null;
  }

  return { workspace, isOwner, isMember, canEdit: isOwner || isMember };
}

/**
 * Creates a short-lived authenticated ticket for a project terminal session.
 */
export async function getTerminalTicketAction(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to access terminal." };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!project) {
    return { success: false, error: "Project not found." };
  }

  const isOwner = project.ownerId === session.user.id;
  const isMember = project.members.length > 0;
  const isPublic = project.visibility === "PUBLIC";

  if (!isOwner && !isMember && !isPublic) {
    return { success: false, error: "Access denied to project terminal." };
  }

  try {
    const dir = await ensureWorkspaceDiskSync(projectId);
    const ticketId = createTerminalTicket(projectId, session.user.id, dir);

    return {
      success: true,
      ticketId,
      projectId: project.id,
      projectSlug: project.slug,
    };
  } catch (err: any) {
    console.error("Get terminal ticket error:", err);
    return { success: false, error: "Failed to initialize workspace terminal." };
  }
}

/**
 * Scans disk workspace and returns the latest file tree.
 */
export async function syncWorkspaceFilesAction(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }

  try {
    const files = await scanWorkspaceDisk(projectId);
    return { success: true, files };
  } catch (err: any) {
    console.error("Sync workspace files error:", err);
    return { success: false, error: "Failed to sync files." };
  }
}

export async function saveFileContent({
  fileId,
  content,
}: {
  fileId: string;
  content: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const file = await prisma.workspaceFile.findUnique({
      where: { id: fileId },
      include: {
        workspace: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to edit files in this project." };
    }

    // Save to physical disk workspace
    await saveWorkspaceFileContentOnDisk({
      projectId: file.workspace.projectId,
      path: file.path,
      content,
    });

    // Update in database
    const updated = await prisma.workspaceFile.update({
      where: { id: fileId },
      data: {
        content,
        size: Buffer.byteLength(content, "utf8"),
      },
    });

    return {
      success: true,
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Save file error:", error);
    return { success: false, error: "Unable to save file." };
  }
}

export async function createFile({
  workspaceId,
  name,
  path: filePath,
  type,
  parentId,
  content = "",
  language,
}: {
  workspaceId: string;
  name: string;
  path: string;
  type: "FILE" | "FOLDER";
  parentId?: string | null;
  content?: string;
  language?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  const access = await verifyWorkspaceAccess(workspaceId, session.user.id);
  if (!access || !access.canEdit) {
    return { success: false, error: "You do not have permission to create files." };
  }

  try {
    // Create on physical disk
    const updatedDiskFiles = await createWorkspaceFileOnDisk({
      projectId: access.workspace.projectId,
      path: filePath,
      type,
      content,
    });

    const created = updatedDiskFiles.find((f) => f.path === filePath.replace(/\\/g, "/"));

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return {
      success: true,
      file: created || {
        id: `file_${Date.now()}`,
        name,
        path: filePath,
        type,
        parentId: parentId || null,
        content: type === "FILE" ? content : null,
        language: language || null,
        size: type === "FILE" ? Buffer.byteLength(content, "utf8") : 0,
      },
      allFiles: updatedDiskFiles,
    };
  } catch (error: any) {
    console.error("Create file error:", error);
    return { success: false, error: error?.message || "Failed to create file." };
  }
}

export async function deleteFile({ fileId }: { fileId: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const file = await prisma.workspaceFile.findUnique({
      where: { id: fileId },
      include: {
        workspace: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to delete files." };
    }

    // Delete on physical disk
    const updatedFiles = await deleteWorkspaceFileOnDisk({
      projectId: file.workspace.projectId,
      path: file.path,
    });

    // Delete in database
    await prisma.workspaceFile.delete({
      where: { id: fileId },
    }).catch(() => {});

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return { success: true, allFiles: updatedFiles };
  } catch (error) {
    console.error("Delete file error:", error);
    return { success: false, error: "Failed to delete file." };
  }
}

export async function renameFile({
  fileId,
  newName,
  newPath,
}: {
  fileId: string;
  newName: string;
  newPath: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const file = await prisma.workspaceFile.findUnique({
      where: { id: fileId },
      include: {
        workspace: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to rename files." };
    }

    // Rename on physical disk
    const updatedFiles = await renameWorkspaceFileOnDisk({
      projectId: file.workspace.projectId,
      oldPath: file.path,
      newPath,
    });

    // Update in database
    await prisma.workspaceFile.update({
      where: { id: fileId },
      data: {
        name: newName,
        path: newPath,
      },
    }).catch(() => {});

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return { success: true, allFiles: updatedFiles };
  } catch (error) {
    console.error("Rename file error:", error);
    return { success: false, error: "Failed to rename file." };
  }
}

export async function updateEditorSession({
  workspaceId,
  fileId,
}: {
  workspaceId: string;
  fileId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false };
  }

  try {
    const existing = await prisma.editorSession.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
      },
    });

    if (existing) {
      await prisma.editorSession.update({
        where: { id: existing.id },
        data: {
          fileId: fileId || null,
        },
      });
    } else {
      await prisma.editorSession.create({
        data: {
          workspaceId,
          userId: session.user.id,
          fileId: fileId || null,
        },
      });
    }

    return { success: true };
  } catch {
    return { success: false };
  }
}
