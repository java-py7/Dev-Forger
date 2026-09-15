import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectBoard } from "./task-actions";
import { ProjectWorkspace } from "@/components/projects/board/project-workspace";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

export default async function ProjectPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const currentTab = (sParams.tab as "overview" | "board" | "members" | "settings") || "board";
  const userId = session.user.id;

  // Fetch project details, owner, members, and available users for invite dialog
  const [project, boardRes, availableUsers] = await Promise.all([
    prisma.project.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    }),
    getProjectBoard(slug),
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

  if (!project) {
    notFound();
  }

  if (!boardRes.success || !boardRes.data) {
    redirect("/projects");
  }

  const { board, members, canEdit, isOwner, currentUserRole } = boardRes.data;

  return (
    <main className="min-h-full">
      <ProjectWorkspace
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          category: project.category,
          language: project.language,
          visibility: project.visibility,
          status: project.status,
          repositoryUrl: project.repositoryUrl,
          websiteUrl: project.websiteUrl,
          maxMembers: project.maxMembers,
          createdAt: project.createdAt.toISOString(),
          ownerId: project.ownerId,
          owner: project.owner,
        }}
        initialBoard={board}
        members={members}
        canEdit={canEdit}
        isOwner={isOwner}
        currentUserRole={currentUserRole}
        availableUsers={availableUsers}
        defaultTab={currentTab}
      />
    </main>
  );
}
