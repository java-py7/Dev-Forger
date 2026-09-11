"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTeam(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) {
    return {
      success: false,
      error: "Team name is required.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Team name must be 100 characters or less.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          ownerId: userId,
          name,
          description: description || null,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId,
          role: "OWNER",
        },
      });
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Create team error:", error);
    return {
      success: false,
      error: "Unable to create team. Please try again.",
    };
  }
}

export async function updateTeam(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;
  const teamId = String(formData.get("teamId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!teamId) {
    return {
      success: false,
      error: "Team ID is required.",
    };
  }

  if (!name) {
    return {
      success: false,
      error: "Team name is required.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Team name must be 100 characters or less.",
    };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      return {
        success: false,
        error: "Team not found.",
      };
    }

    if (team.ownerId !== userId) {
      return {
        success: false,
        error: "Only the team owner can edit this team.",
      };
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description: description || null,
      },
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Update team error:", error);
    return {
      success: false,
      error: "Unable to update team. Please try again.",
    };
  }
}

export async function deleteTeam(teamId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  if (!teamId) {
    return {
      success: false,
      error: "Team ID is required.",
    };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!team) {
      return {
        success: false,
        error: "Team not found.",
      };
    }

    if (team.ownerId !== userId) {
      return {
        success: false,
        error: "Only the team owner can delete this team.",
      };
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete team error:", error);
    return {
      success: false,
      error: "Unable to delete team. Please try again.",
    };
  }
}

export async function inviteToTeam({
  teamId,
  receiverId,
  role = "DEVELOPER",
}: {
  teamId: string;
  receiverId: string;
  role?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  if (!teamId || !receiverId) {
    return {
      success: false,
      error: "Team ID and recipient are required.",
    };
  }

  if (receiverId === userId) {
    return {
      success: false,
      error: "You cannot invite yourself.",
    };
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!team) {
      return {
        success: false,
        error: "Team not found.",
      };
    }

    const isOwner = team.ownerId === userId;
    const isAdmin = team.members.some((m) => m.role === "ADMIN");

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: "You do not have permission to invite developers to this team.",
      };
    }

    // Check if target is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: receiverId,
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: "This user is already a member of the team.",
      };
    }

    // Check if pending invite already exists
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: {
        teamId,
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

    await prisma.$transaction(async (tx) => {
      await tx.teamInvitation.create({
        data: {
          teamId,
          senderId: userId,
          receiverId,
          status: "PENDING",
        },
      });

      await tx.notification.create({
        data: {
          userId: receiverId,
          type: "TEAM_INVITATION",
          title: "Team Invitation",
          message: `You were invited to join "${team.name}" as a ${role.toLowerCase()}.`,
        },
      });
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Invite to team error:", error);
    return {
      success: false,
      error: "Unable to send team invitation. Please try again.",
    };
  }
}

export async function acceptTeamInvitation(invitationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  try {
    const invite = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: { team: true },
    });

    if (!invite) {
      return {
        success: false,
        error: "Invitation not found.",
      };
    }

    if (invite.receiverId !== userId) {
      return {
        success: false,
        error: "This invitation is not addressed to you.",
      };
    }

    if (invite.status !== "PENDING") {
      return {
        success: false,
        error: "This invitation is no longer pending.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.upsert({
        where: {
          teamId_userId: {
            teamId: invite.teamId,
            userId,
          },
        },
        create: {
          teamId: invite.teamId,
          userId,
          role: "DEVELOPER",
        },
        update: {
          role: "DEVELOPER",
        },
      });

      await tx.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
        },
      });

      await tx.notification.create({
        data: {
          userId: invite.team.ownerId,
          type: "TEAM_INVITATION",
          title: "Invitation Accepted",
          message: `${session.user?.name || "A developer"} joined "${invite.team.name}".`,
        },
      });
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Accept team invitation error:", error);
    return {
      success: false,
      error: "Unable to accept invitation. Please try again.",
    };
  }
}

export async function declineTeamInvitation(invitationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  try {
    const invite = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invite || invite.receiverId !== userId) {
      return {
        success: false,
        error: "Invitation not found.",
      };
    }

    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: "REJECTED",
      },
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Decline team invitation error:", error);
    return {
      success: false,
      error: "Unable to decline invitation. Please try again.",
    };
  }
}

export async function joinTeam(teamId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return {
        success: false,
        error: "Team not found.",
      };
    }

    if (team.ownerId === userId) {
      return {
        success: false,
        error: "You are already the owner of this team.",
      };
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (existingMember) {
      return {
        success: false,
        error: "You are already a member of this team.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          teamId,
          userId,
          role: "DEVELOPER",
        },
      });

      await tx.notification.create({
        data: {
          userId: team.ownerId,
          type: "SYSTEM",
          title: "New Team Member",
          message: `${session.user?.name || "A developer"} joined "${team.name}".`,
        },
      });
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Join team error:", error);
    return {
      success: false,
      error: "Unable to join team. Please try again.",
    };
  }
}

export async function leaveTeam(teamId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in.",
    };
  }

  const userId = session.user.id;

  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, ownerId: true },
    });

    if (!team) {
      return {
        success: false,
        error: "Team not found.",
      };
    }

    if (team.ownerId === userId) {
      return {
        success: false,
        error: "Team owner cannot leave the team. You can delete it instead.",
      };
    }

    await prisma.teamMember.deleteMany({
      where: {
        teamId,
        userId,
      },
    });

    revalidatePath("/teams");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Leave team error:", error);
    return {
      success: false,
      error: "Unable to leave team. Please try again.",
    };
  }
}
