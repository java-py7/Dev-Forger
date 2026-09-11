"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createProject(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  const name = String(formData.get("name") || "").trim();
  const description = String(
    formData.get("description") || ""
  ).trim();

  const category = String(
    formData.get("category") || ""
  ).trim();

  const language = String(
    formData.get("language") || ""
  ).trim();

  const repositoryUrl = String(
    formData.get("repositoryUrl") || ""
  ).trim();

  const websiteUrl = String(
    formData.get("websiteUrl") || ""
  ).trim();

  const visibility = String(
    formData.get("visibility") || "PUBLIC"
  );

  const status = String(
    formData.get("status") || "PLANNING"
  );

  const maxMembersValue = String(
    formData.get("maxMembers") || ""
  ).trim();

  if (!name) {
    return {
      success: false,
      error: "Project name is required.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Project name must be 100 characters or less.",
    };
  }

  if (
    visibility !== "PUBLIC" &&
    visibility !== "PRIVATE"
  ) {
    return {
      success: false,
      error: "Invalid project visibility.",
    };
  }

  if (
    !["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(
      status
    )
  ) {
    return {
      success: false,
      error: "Invalid project status.",
    };
  }

  let maxMembers: number | null = null;

  if (maxMembersValue) {
    const parsed = Number(maxMembersValue);

    if (
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      parsed > 1000
    ) {
      return {
        success: false,
        error: "Maximum members must be between 1 and 1000.",
      };
    }

    maxMembers = parsed;
  }

  const baseSlug = createSlug(name);

  if (!baseSlug) {
    return {
      success: false,
      error: "Please enter a valid project name.",
    };
  }

  let slug = baseSlug;

  const existingProject = await prisma.project.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (existingProject) {
    slug = `${baseSlug}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ownerId: userId,
          name,
          slug,
          description: description || null,
          category: category || null,
          language: language || null,
          repositoryUrl: repositoryUrl || null,
          websiteUrl: websiteUrl || null,
          visibility: visibility as
            | "PUBLIC"
            | "PRIVATE",
          status: status as
            | "PLANNING"
            | "ACTIVE"
            | "COMPLETED"
            | "ARCHIVED",
          maxMembers,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: userId,
          role: "OWNER",
        },
      });
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create project error:", error);

    return {
      success: false,
      error: "Unable to create project. Please try again.",
    };
  }
}

export async function updateProject(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;
  const projectId = String(formData.get("projectId") || "").trim();

  if (!projectId) {
    return {
      success: false,
      error: "Project ID is required.",
    };
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(
    formData.get("description") || ""
  ).trim();

  const category = String(
    formData.get("category") || ""
  ).trim();

  const language = String(
    formData.get("language") || ""
  ).trim();

  const repositoryUrl = String(
    formData.get("repositoryUrl") || ""
  ).trim();

  const websiteUrl = String(
    formData.get("websiteUrl") || ""
  ).trim();

  const visibility = String(
    formData.get("visibility") || "PUBLIC"
  );

  const status = String(
    formData.get("status") || "PLANNING"
  );

  const maxMembersValue = String(
    formData.get("maxMembers") || ""
  ).trim();

  if (!name) {
    return {
      success: false,
      error: "Project name is required.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Project name must be 100 characters or less.",
    };
  }

  if (
    visibility !== "PUBLIC" &&
    visibility !== "PRIVATE"
  ) {
    return {
      success: false,
      error: "Invalid project visibility.",
    };
  }

  if (
    !["PLANNING", "ACTIVE", "COMPLETED", "ARCHIVED"].includes(
      status
    )
  ) {
    return {
      success: false,
      error: "Invalid project status.",
    };
  }

  let maxMembers: number | null = null;

  if (maxMembersValue) {
    const parsed = Number(maxMembersValue);

    if (
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      parsed > 1000
    ) {
      return {
        success: false,
        error: "Maximum members must be between 1 and 1000.",
      };
    }

    maxMembers = parsed;
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    if (project.ownerId !== userId) {
      return {
        success: false,
        error: "Only the project owner can edit this project.",
      };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description: description || null,
        category: category || null,
        language: language || null,
        repositoryUrl: repositoryUrl || null,
        websiteUrl: websiteUrl || null,
        visibility: visibility as
          | "PUBLIC"
          | "PRIVATE",
        status: status as
          | "PLANNING"
          | "ACTIVE"
          | "COMPLETED"
          | "ARCHIVED",
        maxMembers,
      },
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update project error:", error);

    return {
      success: false,
      error: "Unable to update project. Please try again.",
    };
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  if (!projectId) {
    return {
      success: false,
      error: "Project ID is required.",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    if (project.ownerId !== userId) {
      return {
        success: false,
        error: "Only the project owner can delete this project.",
      };
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete project error:", error);
    return {
      success: false,
      error: "Unable to delete project. Please try again.",
    };
  }
}

export async function inviteToProject({
  projectId,
  receiverId,
  role = "DEVELOPER",
  message,
}: {
  projectId: string;
  receiverId: string;
  role?: string;
  message?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  if (!projectId || !receiverId) {
    return {
      success: false,
      error: "Project ID and recipient are required.",
    };
  }

  if (receiverId === userId) {
    return {
      success: false,
      error: "You cannot invite yourself.",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: userId },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    const isOwner = project.ownerId === userId;
    const isAdmin = project.members.some((m) => m.role === "ADMIN");

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "You do not have permission to invite developers to this project.",
      };
    }

    // Check if target is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: receiverId,
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: "This user is already a member of the project.",
      };
    }

    // Check if pending invitation already exists
    const existingInvite = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        receiverId,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return {
        success: false,
        error: "An invitation has already been sent to this user.",
      };
    }

    const inviteMessage = role
      ? `[Role: ${role}] ${message?.trim() || ""}`.trim()
      : message?.trim() || null;

    await prisma.$transaction(async (tx) => {
      await tx.projectInvitation.create({
        data: {
          projectId,
          senderId: userId,
          receiverId,
          message: inviteMessage,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: receiverId,
          type: "PROJECT_INVITATION",
          title: "Project Invitation",
          message: `You were invited to join "${project.name}".`,
        },
      });
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Invite to project error:", error);
    return {
      success: false,
      error: "Unable to send invitation. Please try again.",
    };
  }
}

export async function applyToProject({
  projectId,
  message,
}: {
  projectId: string;
  message?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  if (!projectId) {
    return {
      success: false,
      error: "Project ID is required.",
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        maxMembers: true,
        members: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    if (project.ownerId === userId) {
      return {
        success: false,
        error: "You are already the owner of this project.",
      };
    }

    const isMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userId,
        },
      },
    });

    if (isMember) {
      return {
        success: false,
        error: "You are already a member of this project.",
      };
    }

    if (
      project.maxMembers &&
      project.members.length >= project.maxMembers
    ) {
      return {
        success: false,
        error: "This project has reached its maximum member limit.",
      };
    }

    const existingApp = await prisma.projectApplication.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: userId,
        },
      },
    });

    if (existingApp && existingApp.status === "PENDING") {
      return {
        success: false,
        error: "You already have a pending collaboration request for this project.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectApplication.upsert({
        where: {
          projectId_userId: {
            projectId,
            userId: userId,
          },
        },
        create: {
          projectId,
          userId: userId,
          message: message?.trim() || null,
          status: "PENDING",
        },
        update: {
          message: message?.trim() || null,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: project.ownerId,
          type: "PROJECT_APPLICATION",
          title: "New Collaboration Request",
          message: `${session.user?.name || "A developer"} requested to collaborate on "${project.name}".`,
        },
      });
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Apply to project error:", error);
    return {
      success: false,
      error: "Unable to send collaboration request. Please try again.",
    };
  }
}

export async function leaveProject(projectId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true },
    });

    if (!project) {
      return {
        success: false,
        error: "Project not found.",
      };
    }

    if (project.ownerId === userId) {
      return {
        success: false,
        error: "The owner cannot leave the project. You can delete it instead.",
      };
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId: userId,
      },
    });

    revalidatePath("/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Leave project error:", error);
    return {
      success: false,
      error: "Unable to leave project. Please try again.",
    };
  }
}