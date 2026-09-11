import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Users } from "lucide-react";

import { TeamList } from "@/components/teams/team-list";

export default async function TeamsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [teams, availableUsers, pendingInvitationsCount] = await Promise.all([
    prisma.team.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                email: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        invitations: {
          where: {
            receiverId: userId,
            status: "PENDING",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),

    // Real registered developers for team invitations
    prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    // Count of incoming pending invitations for the current user
    prisma.teamInvitation.count({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
    }),
  ]);

  const teamData = teams.map((team) => {
    const isOwner = team.ownerId === userId;
    const currentMember = team.members.find((m) => m.userId === userId);
    const pendingInvite = team.invitations[0];

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt.toISOString(),
      owner: team.owner,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
      memberCount: team.members.length,
      memberIds: team.members.map((m) => m.userId),
      isOwner,
      isMember: Boolean(currentMember),
      userRole: currentMember?.role,
      pendingInvitationId: pendingInvite?.id || null,
    };
  });

  return (
    <main className="min-h-full">
      {/* Header */}
      <div className="border-b">
        <div className="px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Users className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Teams
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Build developer squads and collaborate on projects together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <TeamList
            teams={teamData}
            availableUsers={availableUsers}
            pendingInvitationsCount={pendingInvitationsCount}
          />
        </div>
      </div>
    </main>
  );
}
