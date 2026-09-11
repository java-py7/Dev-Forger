"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
      select: { id: true, workspaceId: true },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to edit files in this project." };
    }

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
  path,
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
    // Check if path already exists in workspace
    const existing = await prisma.workspaceFile.findUnique({
      where: {
        workspaceId_path: {
          workspaceId,
          path,
        },
      },
    });

    if (existing) {
      return { success: false, error: "A file or folder with this name already exists." };
    }

    const file = await prisma.workspaceFile.create({
      data: {
        workspaceId,
        name,
        path,
        type,
        parentId: parentId || null,
        content: type === "FILE" ? content : null,
        language: language || null,
        size: type === "FILE" ? Buffer.byteLength(content, "utf8") : 0,
      },
    });

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return {
      success: true,
      file: {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.type,
        parentId: file.parentId,
        content: file.content,
        language: file.language,
        size: file.size,
      },
    };
  } catch (error) {
    console.error("Create file error:", error);
    return { success: false, error: "Failed to create file." };
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
      select: { id: true, workspaceId: true },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to delete files." };
    }

    await prisma.workspaceFile.delete({
      where: { id: fileId },
    });

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return { success: true };
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
      select: { id: true, workspaceId: true },
    });

    if (!file) {
      return { success: false, error: "File not found." };
    }

    const access = await verifyWorkspaceAccess(file.workspaceId, session.user.id);
    if (!access || !access.canEdit) {
      return { success: false, error: "You do not have permission to rename files." };
    }

    await prisma.workspaceFile.update({
      where: { id: fileId },
      data: {
        name: newName,
        path: newPath,
      },
    });

    revalidatePath(`/projects/${access.workspace.project.slug}`);

    return { success: true };
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
    // Check if session exists for this user in this workspace
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
