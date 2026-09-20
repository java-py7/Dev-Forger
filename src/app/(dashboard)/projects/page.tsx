import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { FolderKanban } from "lucide-react";

import { ProjectList } from "@/components/projects/project-list";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [projects, skills, availableUsers] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          {
            visibility: "PUBLIC",
          },
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
        applications: {
          where: {
            userId,
            status: "PENDING",
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),

    // Real database skills for languages and frameworks
    prisma.skill.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    }),

    // Real registered developers for owner invitations
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
  ]);

  const projectData = projects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    category: project.category,
    language: project.language,
    repositoryUrl: project.repositoryUrl,
    websiteUrl: project.websiteUrl,
    visibility: project.visibility,
    status: project.status,
    maxMembers: project.maxMembers,

    owner: {
      id: project.owner.id,
      name: project.owner.name,
      username: project.owner.username,
      image: project.owner.image,
    },

    memberCount: project.members.length,
    memberIds: project.members.map((m) => m.userId),

    isOwner: project.ownerId === userId,

    isMember: project.members.some(
      (member) => member.userId === userId
    ),

    hasPendingApplication: project.applications.length > 0,
  }));

  return (
    <main className="min-h-full">
      {/* Header */}
      <div className="border-b">
        <div className="px-6 py-5 lg:px-8">
          <div className="mx-auto max-w-8xl">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <FolderKanban className="size-5" />
              </div>

              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Projects
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Discover projects and build with other developers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-8xl">
          <ProjectList
            projects={projectData}
            availableSkills={skills}
            availableUsers={availableUsers}
          />
        </div>
      </div>
    </main>
  );
}